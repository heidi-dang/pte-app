import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const root = resolve(import.meta.dirname, '..');

export let errors = [];
export let warnings = [];

export function resetValidation() {
  errors = [];
  warnings = [];
}

export function getAllErrors() {
  return [...errors];
}

export function getAllWarnings() {
  return [...warnings];
}

const VALID_IDS = new Set([
  'read_aloud', 'repeat_sentence', 'describe_image', 'retell_lecture',
  'answer_short_question', 'summarize_group_discussion', 'respond_to_situation',
  'summarize_written_text', 'write_essay',
  'reading_writing_fill_blanks', 'reading_multiple_answers', 'reorder_paragraph',
  'reading_fill_blanks', 'reading_single_answer',
  'summarize_spoken_text', 'listening_multiple_answers', 'listening_fill_blanks',
  'highlight_correct_summary', 'listening_single_answer', 'select_missing_word',
  'highlight_incorrect_words', 'write_from_dictation',
]);

const VALID_SECTIONS = ['Speaking and Writing', 'Reading', 'Listening'];
const VALID_PROMPT_TYPES = ['text', 'audio', 'image', 'text-and-audio'];
const VALID_RESPONSE_TYPES = ['audio', 'text', 'dropdown-selection', 'checkbox-selection', 'drag-and-drop-order', 'drag-words-to-blanks', 'radio-selection', 'text-input', 'clickable-text-selection'];
const VALID_TIMING_MODES = ['fixed', 'item-dependent', 'section-timed', 'range'];
const VALID_TIMING_UNITS = ['seconds', 'words', 'sentences', 'paragraphs', 'image'];
const VALID_SCORING_TYPES = ['partial-credit', 'correct-incorrect', 'partial-credit-negative'];
const FUTURE_LABELS = ['future task', 'not yet official', 'future', 'unofficial'];

const SECTION_COUNTS = { 'Speaking and Writing': 9, 'Reading': 5, 'Listening': 8 };

export function requiredFile(relativePath) {
  const fullPath = relativePath.startsWith('/') ? relativePath : join(root, relativePath);
  const displayPath = relativePath.startsWith('/') ? relativePath.replace(root + '/', '') : relativePath;
  if (!existsSync(fullPath)) {
    errors.push(`Missing required file: ${displayPath}`);
    return null;
  }
  const content = readFileSync(fullPath, 'utf-8');
  if (fullPath.endsWith('.gitkeep')) {
    return content;
  }
  if (content.trim().length === 0) {
    errors.push(`Empty file: ${displayPath}`);
    return null;
  }
  return content;
}

export function checkUnresolvedMarkers(relativePath, content) {
  const skipFiles = ['scripts/validate-docs.mjs', 'docs/testing/audit-scorecard.md'];
  if (skipFiles.includes(relativePath)) return;
  for (const marker of ['TODO', 'TBD', 'FIXME', 'INSERT HERE', 'COMING SOON']) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (new RegExp(`\\b${marker}\\b`, 'i').test(lines[i])) {
        errors.push(`Unresolved marker "${marker}" found in ${relativePath} at line ${i + 1}`);
      }
    }
  }
}

export function checkContent(relativePath, content, checks) {
  for (const [description, pattern, caseSensitive] of checks) {
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = typeof pattern === 'string' ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags) : pattern;
    if (!regex.test(content)) {
      errors.push(`Missing content in ${relativePath}: ${description}`);
    }
  }
}

function isValidDate(v) {
  if (typeof v !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isNonEmptyArray(v) {
  return Array.isArray(v) && v.length > 0;
}

function validateTimingObject(obj, path, context) {
  if (!obj || typeof obj !== 'object') {
    errors.push(`${path}: ${context} must be a timing object`);
    return;
  }
  if (!VALID_TIMING_MODES.includes(obj.mode)) {
    errors.push(`${path}: ${context} has invalid timing mode "${obj.mode}"`);
  }
  if (!VALID_TIMING_UNITS.includes(obj.unit)) {
    errors.push(`${path}: ${context} has invalid timing unit "${obj.unit}"`);
  }
  if (obj.minimum !== null && obj.maximum !== null && typeof obj.minimum === 'number' && typeof obj.maximum === 'number') {
    if (obj.minimum > obj.maximum) {
      errors.push(`${path}: ${context} minimum (${obj.minimum}) exceeds maximum (${obj.maximum})`);
    }
  }
  if (obj.mode === 'fixed' && (obj.minimum === null || obj.maximum === null)) {
    errors.push(`${path}: ${context} fixed mode requires non-null min/max`);
  }
  if (typeof obj.minimum === 'number' && obj.minimum < 0) {
    errors.push(`${path}: ${context} negative minimum value`);
  }
}

function loadAllReferenceIds() {
  const refPath = join(root, 'docs/content/official-pte-reference-register.json');
  if (!existsSync(refPath)) {
    errors.push('Missing required file: docs/content/official-pte-reference-register.json');
    return new Set();
  }
  try {
    const refs = JSON.parse(readFileSync(refPath, 'utf-8'));
    return new Set(refs.map(r => r.id));
  } catch {
    errors.push('Invalid JSON in docs/content/official-pte-reference-register.json');
    return new Set();
  }
}

export function validateTaskManifest(manifestPath) {
  const content = requiredFile(manifestPath);
  if (!content) return;

  let manifest;
  try {
    manifest = JSON.parse(content);
  } catch (e) {
    errors.push(`Invalid JSON in ${manifestPath}: ${e.message}`);
    return;
  }

  if (!Array.isArray(manifest)) {
    errors.push(`${manifestPath}: must be an array`);
    return;
  }

  if (manifest.length !== 22) {
    errors.push(`${manifestPath}: expected 22 task records, found ${manifest.length}`);
  }

  const ids = manifest.map(t => t.canonicalId);
  const uniqueIds = new Set(ids);

  if (uniqueIds.size !== ids.length) {
    const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
    errors.push(`${manifestPath}: duplicate canonical IDs: ${[...new Set(dups)].join(', ')}`);
  }

  // Check exact ID set
  const manifestIdSet = new Set(ids);
  for (const expectedId of VALID_IDS) {
    if (!manifestIdSet.has(expectedId)) {
      errors.push(`${manifestPath}: missing expected canonical ID "${expectedId}"`);
    }
  }
  for (const actualId of manifestIdSet) {
    if (!VALID_IDS.has(actualId)) {
      errors.push(`${manifestPath}: unexpected canonical ID "${actualId}"`);
    }
  }

  const validRefIds = loadAllReferenceIds();
  const sectionCounts = { 'Speaking and Writing': 0, 'Reading': 0, 'Listening': 0 };

  const requiredFields = [
    'canonicalId', 'displayName', 'section', 'currentOfficialTask',
    'officialSkillsAssessed', 'scoreContributions',
    'promptType', 'responseType', 'promptLength',
    'preparationTiming', 'responseTiming',
    'playbackLimit', 'recordingLimit', 'officialScoringType',
    'officialScoringTraits', 'promptTranscriptRequired', 'postAttemptTranscriptAvailable',
    'practiceMode', 'mockMode', 'referenceIds', 'lastVerifiedAt'
  ];

  for (const task of manifest) {
    const cid = task.canonicalId || 'unknown';

    for (const field of requiredFields) {
      if (task[field] === undefined || task[field] === null) {
        errors.push(`${manifestPath}: task "${cid}" missing required field: ${field}`);
      }
    }

    // Old field rejection
    if (task.skillsAssessed !== undefined) {
      errors.push(`${manifestPath}: task "${cid}" uses deprecated field "skillsAssessed"; use "officialSkillsAssessed" and "scoreContributions"`);
    }

    // Section
    if (task.section && !VALID_SECTIONS.includes(task.section)) {
      errors.push(`${manifestPath}: task "${cid}" invalid section "${task.section}"`);
    } else if (task.section) {
      sectionCounts[task.section]++;
    }

    // Current official
    if (task.currentOfficialTask === false) {
      errors.push(`${manifestPath}: task "${cid}" must be marked as current official task`);
    }

    // Empty string checks
    if (isNonEmptyString(task.displayName) === false && task.displayName !== undefined) {
      errors.push(`${manifestPath}: task "${cid}" displayName must be a non-empty string`);
    }

    // Empty array checks
    if (task.officialSkillsAssessed !== undefined && !isNonEmptyArray(task.officialSkillsAssessed)) {
      errors.push(`${manifestPath}: task "${cid}" officialSkillsAssessed must be a non-empty array`);
    }
    if (task.scoreContributions !== undefined && !isNonEmptyArray(task.scoreContributions)) {
      errors.push(`${manifestPath}: task "${cid}" scoreContributions must be a non-empty array`);
    }
    if (task.officialScoringTraits !== undefined && !isNonEmptyArray(task.officialScoringTraits)) {
      errors.push(`${manifestPath}: task "${cid}" officialScoringTraits must be a non-empty array`);
    }

    // Enum checks
    if (task.promptType && !VALID_PROMPT_TYPES.includes(task.promptType)) {
      errors.push(`${manifestPath}: task "${cid}" invalid promptType "${task.promptType}"`);
    }
    if (task.responseType && !VALID_RESPONSE_TYPES.includes(task.responseType)) {
      errors.push(`${manifestPath}: task "${cid}" invalid responseType "${task.responseType}"`);
    }
    if (task.officialScoringType && !VALID_SCORING_TYPES.includes(task.officialScoringType)) {
      errors.push(`${manifestPath}: task "${cid}" invalid officialScoringType "${task.officialScoringType}"`);
    }

    // Timing validation
    if (task.promptLength) {
      validateTimingObject(task.promptLength, `${manifestPath} task "${cid}"`, 'promptLength');
    }
    if (task.preparationTiming) {
      validateTimingObject(task.preparationTiming, `${manifestPath} task "${cid}"`, 'preparationTiming');
    }
    if (task.responseTiming) {
      validateTimingObject(task.responseTiming, `${manifestPath} task "${cid}"`, 'responseTiming');
    }

    // Playback/recording limits
    if (typeof task.playbackLimit !== 'number' || task.playbackLimit < 0) {
      errors.push(`${manifestPath}: task "${cid}" playbackLimit must be a non-negative number`);
    }
    if (typeof task.recordingLimit !== 'number' || task.recordingLimit < 0) {
      errors.push(`${manifestPath}: task "${cid}" recordingLimit must be a non-negative number`);
    }

    // Transcript fields
    if (typeof task.promptTranscriptRequired !== 'boolean') {
      errors.push(`${manifestPath}: task "${cid}" promptTranscriptRequired must be a boolean`);
    }
    if (typeof task.postAttemptTranscriptAvailable !== 'boolean') {
      errors.push(`${manifestPath}: task "${cid}" postAttemptTranscriptAvailable must be a boolean`);
    }

    // Reference IDs
    if (task.referenceIds && Array.isArray(task.referenceIds)) {
      if (task.referenceIds.length === 0) {
        errors.push(`${manifestPath}: task "${cid}" referenceIds must not be empty`);
      }
      if (validRefIds.size > 0) {
        for (const refId of task.referenceIds) {
          if (!validRefIds.has(refId)) {
            errors.push(`${manifestPath}: task "${cid}" unknown reference ID "${refId}"`);
          }
        }
      }
    }

    // Date validation
    if (task.lastVerifiedAt && !isValidDate(task.lastVerifiedAt)) {
      errors.push(`${manifestPath}: task "${cid}" lastVerifiedAt "${task.lastVerifiedAt}" is not a valid ISO date`);
    }

    // Future labels
    const stringified = JSON.stringify(task).toLowerCase();
    for (const label of FUTURE_LABELS) {
      if (stringified.includes(label)) {
        errors.push(`${manifestPath}: task "${cid}" contains prohibited label "${label}"`);
      }
    }
  }

  // Section counts
  for (const [section, expected] of Object.entries(SECTION_COUNTS)) {
    if (sectionCounts[section] !== expected) {
      errors.push(`${manifestPath}: expected ${expected} ${section} tasks, found ${sectionCounts[section]}`);
    }
  }

  // Factual contract assertions
  for (const task of manifest) {
    const cid = task.canonicalId;

    // Write From Dictation: prompt max 5 seconds
    if (cid === 'write_from_dictation' && task.promptLength) {
      if (task.promptLength.maximum !== null && task.promptLength.maximum > 5) {
        errors.push(`${manifestPath}: task "${cid}" promptLength maximum must be 5 seconds, got ${task.promptLength.maximum}`);
      }
    }

    // Summarize Spoken Text: 60-90 seconds, includes Spelling, 10 min includes listening+writing
    if (cid === 'summarize_spoken_text') {
      if (task.promptLength) {
        if (task.promptLength.minimum !== 60 || task.promptLength.maximum !== 90) {
          errors.push(`${manifestPath}: task "${cid}" promptLength must be 60-90 seconds`);
        }
      }
      if (task.officialScoringTraits && !task.officialScoringTraits.includes('Spelling')) {
        errors.push(`${manifestPath}: task "${cid}" must include Spelling in officialScoringTraits`);
      }
      if (task.responseTimingDescription !== 'Ten minutes total includes listening and writing') {
        errors.push(`${manifestPath}: task "${cid}" must document that 10 minutes includes listening and writing`);
      }
    }

    // Write Essay: 2-3 sentence prompt, exact official traits
    if (cid === 'write_essay') {
      if (task.promptLength) {
        if (task.promptLength.minimum !== 2 || task.promptLength.maximum !== 3 || task.promptLength.unit !== 'sentences') {
          errors.push(`${manifestPath}: task "${cid}" promptLength must be 2-3 sentences`);
        }
      }
      const requiredTraits = ['Content', 'Form', 'Development, Structure and Coherence', 'Grammar', 'General Linguistic Range', 'Vocabulary Range', 'Spelling'];
      if (task.officialScoringTraits) {
        for (const trait of requiredTraits) {
          if (!task.officialScoringTraits.includes(trait)) {
            errors.push(`${manifestPath}: task "${cid}" missing official scoring trait "${trait}"`);
          }
        }
        // Ensure no split traits
        if (task.officialScoringTraits.includes('Structure') || task.officialScoringTraits.includes('Coherence')) {
          errors.push(`${manifestPath}: task "${cid}" must not split "Development, Structure and Coherence" into separate traits`);
        }
        if (task.officialScoringTraits.includes('General linguistic range')) {
          errors.push(`${manifestPath}: task "${cid}" official trait must be "General Linguistic Range" (capital L)`);
        }
        if (task.officialScoringTraits.includes('Vocabulary')) {
          errors.push(`${manifestPath}: task "${cid}" official trait must be "Vocabulary Range" not "Vocabulary"`);
        }
      }
    }

    // Respond to a Situation: text+audio required
    if (cid === 'respond_to_situation') {
      if (task.mockMode && (task.mockMode.includes('optional') || (task.promptType !== 'text-and-audio'))) {
        errors.push(`${manifestPath}: task "${cid}" must have text and audio both required, promptType must be text-and-audio`);
      }
    }

    // Listening Fill in the Blanks: transcript required
    if (cid === 'listening_fill_blanks' && task.promptTranscriptRequired !== true) {
      errors.push(`${manifestPath}: task "${cid}" promptTranscriptRequired must be true`);
    }

    // Highlight Incorrect Words: transcript required
    if (cid === 'highlight_incorrect_words' && task.promptTranscriptRequired !== true) {
      errors.push(`${manifestPath}: task "${cid}" promptTranscriptRequired must be true`);
    }

    // Tasks where no transcript is shown as part of prompt
    const noTranscriptTasks = ['read_aloud', 'repeat_sentence', 'describe_image', 'retell_lecture',
      'answer_short_question', 'summarize_group_discussion', 'respond_to_situation',
      'summarize_written_text', 'write_essay', 'reading_writing_fill_blanks',
      'reading_multiple_answers', 'reorder_paragraph', 'reading_fill_blanks',
      'reading_single_answer', 'summarize_spoken_text', 'listening_multiple_answers',
      'highlight_correct_summary', 'listening_single_answer', 'select_missing_word',
      'write_from_dictation'];
    if (noTranscriptTasks.includes(cid) && task.promptTranscriptRequired !== false) {
      errors.push(`${manifestPath}: task "${cid}" promptTranscriptRequired must be false`);
    }
  }
}

export function validateOfficialReferenceRegister(registerPath) {
  const content = requiredFile(registerPath);
  if (!content) return;

  const requiredSources = [
    'https://www.pearsonpte.com/pte-academic/test-format/',
    'https://www.pearsonpte.com/pte-academic/test-format/speaking-writing/',
    'https://www.pearsonpte.com/pte-academic/test-format/reading/',
    'https://www.pearsonpte.com/pte-academic/test-format/listening/',
    'https://www.pearsonpte.com/pte-updates-2025/',
    'https://www.pearsonpte.com/content/dam/ELL/pte/pearsonpte/pdfs/pte-academic-pdfs/PTE-Academic-Test-Taker-Score-Guide.pdf',
  ];

  for (const url of requiredSources) {
    if (!content.includes(url)) {
      errors.push(`${registerPath}: missing required source URL: ${url}`);
    }
  }

  checkContent(registerPath, content, [
    ['Last verified date fields', 'Last verified date', false],
    ['Publisher fields', 'Publisher', false],
    ['Content covered fields', 'Content covered', false],
    ['Collected by attribution', 'Collected by', false],
    ['Reviewed by attribution', 'Reviewed by', false],
    ['Approval status', 'Approval status', false],
  ]);

  // Verify Heidi is not listed as Internal reviewer
  if (content.includes('Internal reviewer | Heidi Dang') || content.includes('Internal reviewer|Heidi')) {
    errors.push(`${registerPath}: must not list Heidi Dang as Internal reviewer without explicit evidence`);
  }
}

export function validateBlueprintAgainstManifest(blueprintPath, manifestPath) {
  const blueprint = requiredFile(blueprintPath);
  const manifestContent = requiredFile(manifestPath);
  if (!blueprint || !manifestContent) return;

  let manifest;
  try {
    manifest = JSON.parse(manifestContent);
  } catch {
    return;
  }

  for (const task of manifest) {
    const cid = task.canonicalId;
    const dn = task.displayName;

    if (!blueprint.includes(cid)) {
      errors.push(`${blueprintPath}: missing canonical ID "${cid}" in blueprint`);
    }
    if (!blueprint.includes(dn)) {
      errors.push(`${blueprintPath}: missing display name "${dn}" in blueprint`);
    }

    // Check section heading
    const sectionHeading = `## ${task.section}`;
    if (!blueprint.includes(sectionHeading)) {
      errors.push(`${blueprintPath}: missing section heading "${sectionHeading}" for task "${cid}"`);
    }

    // Check current status
    if (task.currentOfficialTask && blueprint.includes('future task')) {
      errors.push(`${blueprintPath}: current task "${dn}" must not contain "future task" label`);
    }
    if (task.currentOfficialTask && blueprint.includes('not yet official')) {
      errors.push(`${blueprintPath}: current task "${dn}" must not contain "not yet official" label`);
    }

    // Check playback limit
    if (blueprint.includes(cid)) {
      const taskSection = extractTaskSection(blueprint, cid);
      if (taskSection) {
        if (task.playbackLimit !== null) {
          const expectedPlayback = `**Playback limit**: ${task.playbackLimit}`;
          if (!taskSection.includes(expectedPlayback) && !taskSection.includes(`**Playback limit**: ${task.playbackLimit}`)) {
            // Some tasks have `**Playback limit**: No audio`
            const altPlayback = task.playbackLimit === 0 ? 'No audio' : null;
            if (!altPlayback || !taskSection.includes(altPlayback)) {
              errors.push(`${blueprintPath}: task "${cid}" playback limit mismatch`);
            }
          }
        }
        if (task.recordingLimit !== null) {
          const expectedRecording = `**Recording limit**: ${task.recordingLimit}`;
          if (!taskSection.includes(expectedRecording)) {
            const altRecording = task.recordingLimit === 0 ? 'No audio' : null;
            if (!altRecording || !taskSection.includes(altRecording)) {
              errors.push(`${blueprintPath}: task "${cid}" recording limit mismatch`);
            }
          }
        }
        if (task.officialScoringType) {
          const normalizedManifest = task.officialScoringType.replace(/-/g, ' ').toLowerCase();
          const typeLine = taskSection.split('\n').find(l => l.toLowerCase().startsWith('- **official scoring type**:'));
          if (typeLine) {
            const bpType = typeLine.split(':')[1].trim().toLowerCase();
            const bpTypeNormalized = bpType.replace(/[()]/g, '').replace(/[/-]/g, ' ').replace(/\s+/g, ' ').trim();
            if (bpTypeNormalized !== normalizedManifest && !bpTypeNormalized.startsWith(normalizedManifest)) {
              errors.push(`${blueprintPath}: task "${cid}" official scoring type mismatch (expected "${task.officialScoringType}", got "${typeLine.split(':')[1].trim()}")`);
            }
          }
        }
      }
    }
  }

  if (blueprint.includes('future task') || blueprint.includes('not yet official')) {
    errors.push(`${blueprintPath}: contains prohibited label "future task" or "not yet official"`);
  }
}

function extractTaskSection(content, canonicalId) {
  const lines = content.split('\n');
  let inTask = false;
  let taskLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(canonicalId) && lines[i].includes('**Canonical ID**')) {
      inTask = true;
    }
    if (inTask) {
      taskLines.push(lines[i]);
      if (i + 1 < lines.length && lines[i + 1].startsWith('### ') && taskLines.length > 5) {
        break;
      }
    }
  }
  return taskLines.join('\n');
}

export function validateFreeStudentRoutes(routeMapPath) {
  const content = requiredFile(routeMapPath);
  if (!content) return;

  const routes = ['/app', '/app/onboarding', '/app/dashboard', '/app/courses',
    '/app/practice', '/app/progress', '/app/subscription', '/app/profile'];

  for (const route of routes) {
    const escaped = route.replace(/\//g, '\\/');
    const regex = new RegExp(`\\|\\s*\`?${escaped}\`?\\s*\\|\\s*Free student`, 'i');
    if (!regex.test(content)) {
      errors.push(`${routeMapPath}: route ${route} must be accessible to Free student`);
    }
  }
}

export function validateAtoZPhases(readmePath) {
  const content = requiredFile(readmePath);
  if (!content) return;

  for (const phase of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const regex = new RegExp(`\\|\\s*${phase}\\s*\\|`, 'i');
    if (!regex.test(content)) {
      errors.push(`${readmePath}: missing phase ${phase} in development phases table`);
    }
  }
}

export function validateMockTimerConsistency() {
  const mockDocs = ['docs/product/student-journey.md', 'docs/product/acceptance-criteria.md', 'docs/architecture-decisions/0004-recoverable-assessment-state.md'];
  for (const docPath of mockDocs) {
    const content = requiredFile(docPath);
    if (!content) continue;
    if (content.includes('remaining time at interruption') || content.includes('reflects the remaining time at the point')) {
      errors.push(`${docPath}: contains incorrect mock timer policy`);
    }
  }
  for (const docPath of mockDocs) {
    const content = requiredFile(docPath);
    if (!content) continue;
    checkContent(docPath, content, [['Mock deadline continues during interruption', 'deadline continue', false]]);
  }
}

export function validateBlueprintReferences(blueprintPath) {
  const content = requiredFile(blueprintPath);
  if (!content) return;
  for (let i = 1; i <= 6; i++) {
    if (!content.includes(`source-${i}`)) {
      errors.push(`${blueprintPath}: missing reference source-${i}`);
    }
  }
}

function scorecardTotal(scorecardPath) {
  const content = requiredFile(scorecardPath);
  if (!content) return null;

  const sectionPoints = [];
  const sectionPattern = /### .+? — (\d+) points?/g;
  let match;
  while ((match = sectionPattern.exec(content)) !== null) {
    sectionPoints.push(parseInt(match[1], 10));
  }

  const total = sectionPoints.reduce((a, b) => a + b, 0);
  if (sectionPoints.length > 0 && total !== 100) {
    errors.push(`${scorecardPath}: category points total ${total}, expected 100`);
  }

  return sectionPoints;
}

// Run all document validations
export function validateAll() {
  resetValidation();

  const requiredFiles = [
    '.editorconfig', '.gitattributes', '.gitignore', '.nvmrc', '.node-version',
    'LICENSE', 'README.md', 'package.json',
    'docs/product/product-requirements.md', 'docs/product/user-roles.md',
    'docs/product/student-journey.md', 'docs/product/route-map.md',
    'docs/product/feature-priority.md', 'docs/product/acceptance-criteria.md',
    'docs/content/pte-task-blueprints.md', 'docs/content/pte-task-manifest.json',
    'docs/content/official-pte-reference-register.md', 'docs/content/official-pte-reference-register.json',
    'docs/content/content-policy.md', 'docs/content/content-workflow.md',
    'docs/scoring/scoring-principles.md', 'docs/scoring/calibration-plan.md',
    'docs/testing/test-strategy.md', 'docs/testing/audit-scorecard.md',
    'docs/operations/development-workflow.md', 'docs/operations/release-criteria.md',
    'docs/architecture-decisions/0001-monorepo.md', 'docs/architecture-decisions/0002-provider-adapters.md',
    'docs/architecture-decisions/0003-versioned-content-and-scoring.md', 'docs/architecture-decisions/0004-recoverable-assessment-state.md',
    'scripts/validate-docs.mjs',
    'apps/.gitkeep', 'services/.gitkeep', 'packages/.gitkeep', 'content/.gitkeep', 'infrastructure/.gitkeep', 'scripts/.gitkeep',
  ];

  for (const file of requiredFiles) {
    const content = requiredFile(file);
    if (content !== null) {
      checkUnresolvedMarkers(file, content);
    }
  }

  const readme = requiredFile('README.md');
  if (readme) {
    checkContent('README.md', readme, [
      ['Independent platform disclaimer', 'not affiliated with, endorsed by or operated by Pearson', false],
      ['98/100 audit gate', '98/100', false],
      ['Estimated training scores', 'estimated training scores', false],
      ['Recovery requirement', 'recoverable', false],
      ['No hardcoded values statement', 'hardcoded', false],
      ['Progress exposure requirement', 'progress', false],
    ]);
    validateAtoZPhases('README.md');
  }

  validateTaskManifest('docs/content/pte-task-manifest.json');
  validateBlueprintAgainstManifest('docs/content/pte-task-blueprints.md', 'docs/content/pte-task-manifest.json');
  validateBlueprintReferences('docs/content/pte-task-blueprints.md');
  validateOfficialReferenceRegister('docs/content/official-pte-reference-register.md');

  // JSON reference register validation
  const jsonRef = requiredFile('docs/content/official-pte-reference-register.json');
  if (jsonRef) {
    try {
      const refs = JSON.parse(jsonRef);
      if (!Array.isArray(refs)) errors.push('Reference register JSON must be an array');
      else if (refs.length !== 6) errors.push(`Reference register: expected 6 sources, found ${refs.length}`);
      else {
        for (const ref of refs) {
          const reqRefFields = ['id', 'title', 'publisher', 'url', 'contentCovered', 'lastVerifiedAt', 'collectedBy', 'reviewedBy', 'approvalStatus'];
          for (const field of reqRefFields) {
            if (!ref[field]) errors.push(`Reference register: source "${ref.id || 'unknown'}" missing field "${field}"`);
          }
        }
      }
    } catch (e) {
      errors.push(`Invalid JSON in reference register: ${e.message}`);
    }
  }

  // Scorecard
  const scorecard = requiredFile('docs/testing/audit-scorecard.md');
  if (scorecard) {
    checkContent('docs/testing/audit-scorecard.md', scorecard, [
      ['98/100 acceptance threshold', '98/100', false],
      ['Repository and structure section', 'Repository and Structure', false],
      ['Requirements completeness section', 'Requirements Completeness', false],
      ['PTE coverage section', 'PTE Coverage and Accuracy', false],
      ['Content system section', 'Content System', false],
      ['UX and recovery section', 'UX and Recovery', false],
      ['Testing and release gates section', 'Testing and Release Gates', false],
      ['Documentation quality section', 'Documentation Quality', false],
    ]);
    scorecardTotal('docs/testing/audit-scorecard.md');
  }

  // Scoring principles
  const scoring = requiredFile('docs/scoring/scoring-principles.md');
  if (scoring) {
    checkContent('docs/scoring/scoring-principles.md', scoring, [
      ['Estimated training scores', 'estimated training scores', false],
      ['Component evidence requirement', 'component evidence', false],
      ['Versioning requirement', 'version', false],
      ['Confidence range requirement', 'confidence', false],
      ['Historical result integrity', 'cannot silently change', false],
      ['Constrained-response speaking tasks', 'Constrained-Response', false],
      ['Open-response speaking tasks', 'Open-Response', false],
      ['Integrated-skill contributions', 'Integrated-Skill', false],
    ]);
  }

  const contentPolicy = requiredFile('docs/content/content-policy.md');
  if (contentPolicy) {
    checkContent('docs/content/content-policy.md', contentPolicy, [
      ['Permitted content section', 'Permitted Content', false],
      ['Prohibited content section', 'Prohibited Content', false],
      ['Licensing', 'licence', false],
      ['Review score gate', '9/10', false],
    ]);
  }

  const journey = requiredFile('docs/product/student-journey.md');
  if (journey) {
    checkContent('docs/product/student-journey.md', journey, [
      ['Internet interruption recovery', 'Internet interruption', false],
      ['Mock interruption recovery', 'interrupted', false],
      ['Autosave', 'autosave', false],
      ['Subscription expiry', 'Subscription expires', false],
      ['Scoring provider unavailable', 'Scoring Provider', false],
    ]);
  }

  const criteria = requiredFile('docs/product/acceptance-criteria.md');
  if (criteria) {
    checkContent('docs/product/acceptance-criteria.md', criteria, [
      ['Mobile experience criteria', 'Mobile Experience', false],
      ['Recovery criteria', 'Recovery', false],
      ['Configuration names', 'AUTH_MAX_FAILED_ATTEMPTS', false],
      ['Configuration names', 'SESSION_IDLE_TIMEOUT_SECONDS', false],
      ['Configuration names', 'AUTOSAVE_INTERVAL_MS', false],
    ]);
  }

  const testStrategy = requiredFile('docs/testing/test-strategy.md');
  if (testStrategy) {
    checkContent('docs/testing/test-strategy.md', testStrategy, [
      ['Unit tests section', 'Unit Tests', false],
      ['Integration tests section', 'Integration Tests', false],
      ['End-to-end tests section', 'End-to-End Tests', false],
      ['Stability tests section', 'Stability Tests', false],
      ['Browser matrix', 'Browser Matrix', false],
    ]);
  }

  const calibration = requiredFile('docs/scoring/calibration-plan.md');
  if (calibration) {
    checkContent('docs/scoring/calibration-plan.md', calibration, [
      ['Recruit pilot students', 'Recruit pilot', false],
      ['Collect student responses', 'Collect student', false],
      ['Qualified teacher scores', 'teacher score', false],
      ['Platform scoring comparison', 'Compare', false],
      ['Metrics tracking', 'Mean difference', false],
    ]);
  }

  for (const adr of ['0001-monorepo.md', '0002-provider-adapters.md', '0003-versioned-content-and-scoring.md', '0004-recoverable-assessment-state.md']) {
    const adrContent = requiredFile(`docs/architecture-decisions/${adr}`);
    if (adrContent) {
      checkContent(`docs/architecture-decisions/${adr}`, adrContent, [
        ['Status section', 'Status', true],
        ['Context section', 'Context', true],
        ['Decision section', 'Decision', true],
      ]);
    }
  }

  validateFreeStudentRoutes('docs/product/route-map.md');
  validateMockTimerConsistency();

  const workflow = requiredFile('docs/content/content-workflow.md');
  if (workflow) {
    checkContent('docs/content/content-workflow.md', workflow, [
      ['Workflow stages', 'Idea', false],
      ['Approval stage', 'Approval', true],
      ['Publication stage', 'Publication', true],
    ]);
  }

  const devWorkflow = requiredFile('docs/operations/development-workflow.md');
  if (devWorkflow) {
    checkContent('docs/operations/development-workflow.md', devWorkflow, [
      ['Conventional commits', 'conventional commit', false],
      ['Branch format', 'feat/phase-<letter>', false],
    ]);
  }

  const releaseCriteria = requiredFile('docs/operations/release-criteria.md');
  if (releaseCriteria) {
    checkContent('docs/operations/release-criteria.md', releaseCriteria, [
      ['All task types implemented', 'All task types', false],
      ['Final audit gate', '98/100', false],
    ]);
  }

  return { errors: getAllErrors(), warnings: getAllWarnings() };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^.*[\\/]/, ''))) {
  const result = validateAll();
  console.log('\n=== Phase A Documentation Validation ===\n');
  if (result.errors.length > 0) {
    console.log(`FAILED — ${result.errors.length} error(s) found:\n`);
    for (const err of result.errors) {
      console.log(`  [ERROR] ${err}`);
    }
    console.log('');
    process.exit(1);
  } else {
    console.log('  All checks passed.\n');
    process.exit(0);
  }
}
