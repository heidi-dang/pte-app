import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
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
const VALID_PROMPT_TYPES = ['text', 'audio', 'image', 'text-and-audio', 'audio-or-video'];
const VALID_RESPONSE_TYPES = ['audio', 'text', 'dropdown-selection', 'checkbox-selection', 'drag-and-drop-order', 'drag-words-to-blanks', 'radio-selection', 'text-input', 'clickable-text-selection'];
const VALID_TIMING_MODES = ['fixed', 'item-dependent', 'section-timed', 'range', 'not-applicable'];
const VALID_TIMING_UNITS = ['seconds', 'words', 'sentences', 'paragraphs', 'image'];
const VALID_SCORING_TYPES = ['partial-credit', 'correct-incorrect', 'partial-credit-negative'];
const FUTURE_LABELS = ['future task', 'not yet official', 'future', 'unofficial'];

const SECTION_COUNTS = { 'Speaking and Writing': 9, 'Reading': 5, 'Listening': 8 };

const SECTION_SOURCE_MAP = {
  'Speaking and Writing': 'source-2',
  'Reading': 'source-3',
  'Listening': 'source-4',
};

const SPECIAL_SOURCE_TASKS = {
  'summarize_group_discussion': ['source-1', 'source-2', 'source-5', 'source-6'],
  'respond_to_situation': ['source-1', 'source-2', 'source-5', 'source-6'],
};

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
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  if (mo < 1 || mo > 12 || d < 1) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
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
  // not-applicable mode has no unit
  if (obj.mode === 'not-applicable') return;
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
  if (obj.mode === 'fixed' && typeof obj.minimum === 'number' && typeof obj.maximum === 'number' && obj.minimum !== obj.maximum) {
    errors.push(`${path}: ${context} fixed mode requires min (${obj.minimum}) === max (${obj.maximum})`);
  }
  if (typeof obj.minimum === 'number' && obj.minimum < 0) {
    errors.push(`${path}: ${context} negative minimum value`);
  }
  if (typeof obj.maximum === 'number' && obj.maximum < 0) {
    errors.push(`${path}: ${context} negative maximum value`);
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

// ---- I: Task References Validation ----

export function validateTaskReferences(manifestOverride) {
  let manifest = manifestOverride;
  if (!manifest) {
    const manifestPath = 'docs/content/pte-task-manifest.json';
    const content = requiredFile(manifestPath);
    if (!content) return;
    try { manifest = JSON.parse(content); } catch { return; }
  }
  if (!Array.isArray(manifest)) return;

  for (const task of manifest) {
    const cid = task.canonicalId;
    const refs = task.referenceIds || [];
    const section = task.section;

    // Check Summarize Group Discussion special sources
    if (cid === 'summarize_group_discussion') {
      const expected = SPECIAL_SOURCE_TASKS[cid];
      for (const ref of expected) {
        if (!refs.includes(ref)) {
          errors.push(`Task "${cid}": missing required reference "${ref}" for SGD`);
        }
      }
      // Must NOT include source-4
      if (refs.includes('source-4')) {
        errors.push(`Task "${cid}": must not include source-4 (Listening format)`);
      }
      continue;
    }

    // Check Respond to a Situation special sources
    if (cid === 'respond_to_situation') {
      const expected = SPECIAL_SOURCE_TASKS[cid];
      for (const ref of expected) {
        if (!refs.includes(ref)) {
          errors.push(`Task "${cid}": missing required reference "${ref}" for RTS`);
        }
      }
      continue;
    }

    // Every task must have source-1 (overview)
    if (!refs.includes('source-1')) {
      errors.push(`Task "${cid}": missing source-1 (overview)`);
    }

    // Section-format source
    const sectionSource = SECTION_SOURCE_MAP[section];
    if (sectionSource && !refs.includes(sectionSource)) {
      errors.push(`Task "${cid}": missing required section-format source "${sectionSource}" for section "${section}"`);
    }

    // source-6 for scoring rules/contributions
    if (task.scoreContributions && task.scoreContributions.length > 0) {
      if (!refs.includes('source-6')) {
        errors.push(`Task "${cid}": missing source-6 (Score Guide) required when score contributions are documented`);
      }
    }
    // source-6 required for scoring fields (use "Task" prefix, no manifestPath in scope)
    if (task.officialRubricTraits && task.officialRubricTraits.length > 0) {
      if (!refs.includes('source-6')) {
        errors.push(`Task "${cid}": missing source-6 (Score Guide) required when rubric traits are documented`);
      }
    }
    if (task.officialHumanReviewTraits && task.officialHumanReviewTraits.length > 0) {
      if (!refs.includes('source-6')) {
        errors.push(`Task "${cid}": missing source-6 (Score Guide) required when human-review traits are documented`);
      }
    }
    if (task.platformEstimatedScoringRule) {
      if (!refs.includes('source-6')) {
        errors.push(`Task "${cid}": missing source-6 (Score Guide) required when scoring rules are documented`);
      }
    }

    // Reading tasks must NOT have source-2
    if (section === 'Reading' && refs.includes('source-2')) {
      errors.push(`Task "${cid}": must not include source-2 (Speaking/Writing format) as a Reading task`);
    }
  }
}

// ---- I: Reference Register Validation ----

export function validateReferenceRegisterJson(jsonPath) {
  const content = requiredFile(jsonPath);
  if (!content) return;

  let refs;
  try { refs = JSON.parse(content); } catch (e) {
    errors.push(`Invalid JSON in ${jsonPath}: ${e.message}`);
    return;
  }

  if (!Array.isArray(refs)) {
    errors.push(`${jsonPath}: must be an array`);
    return;
  }

  if (refs.length !== 6) {
    errors.push(`${jsonPath}: expected 6 reference records, found ${refs.length}`);
    return;
  }

  const ids = new Set();
  const urls = new Set();

  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    const idx = i + 1;

    // ID
    if (!ref.id || typeof ref.id !== 'string') {
      errors.push(`${jsonPath}: entry ${idx} missing or invalid "id"`);
    } else if (ids.has(ref.id)) {
      errors.push(`${jsonPath}: duplicate ID "${ref.id}" in entry ${idx}`);
    } else {
      ids.add(ref.id);
    }

    // Title
    if (!ref.title || typeof ref.title !== 'string' || ref.title.trim() === '') {
      errors.push(`${jsonPath}: entry ${idx} ("${ref.id || 'unknown'}"): missing or empty "title"`);
    }

    // Publisher
    if (!ref.publisher || typeof ref.publisher !== 'string' || !ref.publisher.toLowerCase().includes('pearson')) {
      errors.push(`${jsonPath}: entry ${idx} ("${ref.id || 'unknown'}"): publisher must include "Pearson", got "${ref.publisher}"`);
    }

    // URL
    if (!ref.url) {
      errors.push(`${jsonPath}: entry ${idx} ("${ref.id || 'unknown'}"): missing "url"`);
    } else {
      try {
        const parsed = new URL(ref.url);
        if (parsed.protocol !== 'https:') {
          errors.push(`${jsonPath}: entry ${idx} ("${ref.id}"): URL must be HTTPS, got "${ref.url}"`);
        }
        if (urls.has(ref.url)) {
          errors.push(`${jsonPath}: entry ${idx} ("${ref.id}"): duplicate URL "${ref.url}"`);
        }
        urls.add(ref.url);
      } catch {
        errors.push(`${jsonPath}: entry ${idx} ("${ref.id || 'unknown'}"): invalid URL "${ref.url}"`);
      }
    }

    // Date
    if (!ref.lastVerifiedAt || !isValidDate(ref.lastVerifiedAt)) {
      errors.push(`${jsonPath}: entry ${idx} ("${ref.id || 'unknown'}"): lastVerifiedAt "${ref.lastVerifiedAt}" must be a valid YYYY-MM-DD date`);
    }

    // Approval status
    const validStatuses = ['Verified', 'Pending verification', 'Awaiting review', 'Superseded', 'Pending'];
    if (!ref.approvalStatus || !validStatuses.includes(ref.approvalStatus)) {
      errors.push(`${jsonPath}: entry ${idx} ("${ref.id || 'unknown'}"): approvalStatus must be one of: ${validStatuses.join(', ')}, got "${ref.approvalStatus}"`);
    }
  }

  if (ids.size < 6) {
    errors.push(`${jsonPath}: expected 6 unique IDs, found ${ids.size}`);
  }
  if (urls.size < 6) {
    errors.push(`${jsonPath}: expected 6 unique URLs, found ${urls.size}`);
  }
}

// ---- H: Blueprint Synchronization Validation (via generator) ----

export function validateBlueprintAgainstManifest(blueprintPath, manifestPath) {
  // Use the generator's --validate mode for byte-for-byte comparison
  const generatorPath = join(root, 'scripts/generate-pte-blueprints.mjs');
  try {
    execSync(`node "${generatorPath}" --validate`, { encoding: 'utf-8', cwd: root, stdio: 'pipe' });
    // Success - exited 0
  } catch (e) {
    if (e.status === 1) {
      errors.push(e.stdout ? e.stdout.trim() : 'docs/content/pte-task-blueprints.md is not synchronized with the manifest. Run npm run generate:pte-blueprints.');
    } else {
      errors.push(`Blueprint validation error: ${e.message}`);
    }
  }
}

// ---- J: Scorecard Validation ----

export function validateScorecard(scorecardPath) {
  const content = requiredFile(scorecardPath);
  if (!content) return null;

  const lines = content.split('\n');

  // Find all category headings
  const categoryRegex = /^###\s+(.+?)\s*[—–-]\s*(\d+)\s+points?\s*$/i;
  const categories = [];
  let totalCategoryPoints = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(categoryRegex);
    if (match) {
      const name = match[1].trim();
      const points = parseInt(match[2], 10);
      categories.push({ name, points, startLine: i });
      totalCategoryPoints += points;
    }
  }

  // Check exactly 8 categories
  if (categories.length !== 8) {
    errors.push(`${scorecardPath}: expected 8 audit categories, found ${categories.length}`);
  }

  // Check total is 100
  if (totalCategoryPoints !== 100) {
    errors.push(`${scorecardPath}: category points total ${totalCategoryPoints}, expected 100`);
  }

  // Check rows within each category total the category heading
  const knownCategories = [
    'Repository and Structure', 'Requirements Completeness', 'PTE Coverage and Accuracy',
    'Content System', 'Scoring and Calibration', 'UX and Recovery',
    'Testing and Release Gates', 'Documentation Quality'
  ];

  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci];
    const endLine = ci < categories.length - 1 ? categories[ci + 1].startLine : lines.length;
    let criterionSum = 0;
    let hasCriteria = false;

    // Validate category name
    const matchedKnown = knownCategories.some(kc => cat.name.toLowerCase() === kc.toLowerCase() || cat.name.toLowerCase().startsWith(kc.toLowerCase()));
    if (!matchedKnown) {
      errors.push(`${scorecardPath}: unrecognised category "${cat.name}"`);
    }

    for (let i = cat.startLine + 1; i < endLine; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && !line.startsWith('|---') && !line.startsWith('| ---')) {
        const cells = line.split('|').filter(c => c.trim().length > 0);
        if (cells.length >= 2) {
          const numMatch = cells[1].trim().match(/^(\d+(?:\.\d+)?)\s*$/);
          if (numMatch) {
            criterionSum += parseFloat(numMatch[1]);
            hasCriteria = true;
            continue;
          }
        }
        if (cells.length >= 3) {
          const numMatch = cells[2].trim().match(/^(\d+(?:\.\d+)?)\s*$/);
          if (numMatch) {
            criterionSum += parseFloat(numMatch[1]);
            hasCriteria = true;
          }
        }
      }
    }

    if (hasCriteria && criterionSum !== cat.points) {
      errors.push(`${scorecardPath}: criterion rows under '${cat.name}' sum to ${criterionSum}, but heading says ${cat.points}`);
    }
  }

  return { totalCategoryPoints, criterionMismatches: 0 };
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
    'taskPurpose', 'studentInterface', 'inputMedia', 'answerFormat',
    'promptType', 'responseType', 'promptLength',
    'preparationTiming', 'responseTiming',
    'playbackLimit', 'recordingLimit', 'officialScoringType',
    'officialRubricTraits', 'officialHumanReviewTraits',
    'platformEstimatedScoringRule', 'platformEstimatedScoringEvidence',
    'feedbackFormat', 'contentMetadata',
    'responseValidation', 'failureRecoveryBehavior',
    'promptTranscriptRequired', 'postAttemptTranscriptAvailable',
    'practiceMode', 'mockMode', 'referenceIds', 'lastVerifiedAt'
  ];

  for (const task of manifest) {
    const cid = task.canonicalId || 'unknown';

    for (const field of requiredFields) {
      if (task[field] === undefined || task[field] === null) {
        errors.push(`${manifestPath}: task "${cid}" missing required field: ${field}`);
      }
    }

    if (task.skillsAssessed !== undefined) {
      errors.push(`${manifestPath}: task "${cid}" uses deprecated field "skillsAssessed"; use "officialSkillsAssessed" and "scoreContributions"`);
    }
    if (task.officialScoringTraits !== undefined) {
      errors.push(`${manifestPath}: task "${cid}" uses deprecated field "officialScoringTraits"; use "officialRubricTraits"`);
    }

    if (task.section && !VALID_SECTIONS.includes(task.section)) {
      errors.push(`${manifestPath}: task "${cid}" invalid section "${task.section}"`);
    } else if (task.section) {
      sectionCounts[task.section]++;
    }

    if (task.currentOfficialTask === false) {
      errors.push(`${manifestPath}: task "${cid}" must be marked as current official task`);
    }

    if (isNonEmptyString(task.displayName) === false && task.displayName !== undefined) {
      errors.push(`${manifestPath}: task "${cid}" displayName must be a non-empty string`);
    }

    if (task.officialSkillsAssessed !== undefined && !isNonEmptyArray(task.officialSkillsAssessed)) {
      errors.push(`${manifestPath}: task "${cid}" officialSkillsAssessed must be a non-empty array`);
    }
    if (task.scoreContributions !== undefined && !isNonEmptyArray(task.scoreContributions)) {
      errors.push(`${manifestPath}: task "${cid}" scoreContributions must be a non-empty array`);
    }
    if (task.officialRubricTraits === undefined || !Array.isArray(task.officialRubricTraits)) {
      errors.push(`${manifestPath}: task "${cid}" officialRubricTraits must be an array`);
    } else if (task.scoringRule && task.scoringRule.type === 'rubric') {
      // Rubric-scored tasks must have named traits
      if (task.officialRubricTraits.length === 0) {
        errors.push(`${manifestPath}: task "${cid}" rubric-scored but officialRubricTraits is empty`);
      }
    }
    // Specific objective tasks with Score Guide "Not applicable" must have empty traits
    const objectiveEmptyTraitsTasks = ['reading_writing_fill_blanks', 'reading_multiple_answers',
      'reorder_paragraph', 'reading_fill_blanks', 'reading_single_answer',
      'listening_multiple_answers', 'listening_fill_blanks', 'highlight_correct_summary',
      'listening_single_answer', 'select_missing_word', 'highlight_incorrect_words', 'write_from_dictation'];
    if (objectiveEmptyTraitsTasks.includes(cid) && task.officialRubricTraits && task.officialRubricTraits.length > 0) {
      errors.push(`${manifestPath}: task "${cid}" must have empty officialRubricTraits (Score Guide says Not applicable)`);
    }

    if (task.promptType && !VALID_PROMPT_TYPES.includes(task.promptType)) {
      errors.push(`${manifestPath}: task "${cid}" invalid promptType "${task.promptType}"`);
    }
    if (task.responseType && !VALID_RESPONSE_TYPES.includes(task.responseType)) {
      errors.push(`${manifestPath}: task "${cid}" invalid responseType "${task.responseType}"`);
    }
    if (task.officialScoringType && !VALID_SCORING_TYPES.includes(task.officialScoringType)) {
      errors.push(`${manifestPath}: task "${cid}" invalid officialScoringType "${task.officialScoringType}"`);
    }

    if (task.platformEstimatedScoringRule) {
      const validRuleTypes = ['rubric-estimate', 'correct-incorrect', 'per-correct-blank', 'per-correct-word', 'selection-with-negative-marking', 'adjacent-pair-order'];
      if (!validRuleTypes.includes(task.platformEstimatedScoringRule.type)) {
        errors.push(`${manifestPath}: task "${cid}" platformEstimatedScoringRule has invalid type "${task.platformEstimatedScoringRule.type}"`);
      }
      if (task.platformEstimatedScoringRule.minimumItemScore !== undefined && task.platformEstimatedScoringRule.minimumItemScore < 0) {
        errors.push(`${manifestPath}: task "${cid}" platformEstimatedScoringRule minimumItemScore must be >= 0`);
      }
      if ((task.platformEstimatedScoringRule.type === 'selection-with-negative-marking') && task.platformEstimatedScoringRule.minimumItemScore !== 0) {
        errors.push(`${manifestPath}: task "${cid}" negative-marking platformEstimatedScoringRule must have minimumItemScore 0`);
      }
      // Platform scoring must not be labelled as official
      if (task.platformEstimatedScoringRule.type !== 'rubric-estimate') {
        const ruleStr = JSON.stringify(task.platformEstimatedScoringRule);
        if (ruleStr.includes('official') || ruleStr.includes('pearson') || ruleStr.includes('Pearson') || ruleStr.includes('ai-evaluation')) {
          errors.push(`${manifestPath}: task "${cid}" platformEstimatedScoringRule must not reference official Pearson scoring or ai-evaluation`);
        }
      }
    }

    // responseValidation validation
    if (task.responseValidation) {
      const requiredRvKeys = ['allowedSubmissionStates', 'rejectCorruptPayload', 'learningModeWarnBeforeSubmit', 'timedModeForceAnswer', 'noResponseScore'];
      for (const key of requiredRvKeys) {
        if (!(key in task.responseValidation)) {
          errors.push(`${manifestPath}: task "${cid}" responseValidation missing required key "${key}"`);
        }
      }
      if (task.responseValidation.allowedSubmissionStates) {
        if (!task.responseValidation.allowedSubmissionStates.includes('complete')) {
          errors.push(`${manifestPath}: task "${cid}" responseValidation.allowedSubmissionStates must include "complete"`);
        }
        if (!task.responseValidation.allowedSubmissionStates.includes('incomplete')) {
          errors.push(`${manifestPath}: task "${cid}" responseValidation.allowedSubmissionStates must include "incomplete"`);
        }
        if (!task.responseValidation.allowedSubmissionStates.includes('empty')) {
          errors.push(`${manifestPath}: task "${cid}" responseValidation.allowedSubmissionStates must include "empty"`);
        }
      }
      if (task.responseValidation.timedModeForceAnswer === true) {
        errors.push(`${manifestPath}: task "${cid}" responseValidation.timedModeForceAnswer must be false`);
      }
      if (task.responseValidation.noResponseScore !== 0) {
        errors.push(`${manifestPath}: task "${cid}" responseValidation.noResponseScore must be 0`);
      }
    }

    // failureRecoveryBehavior validation
    if (task.failureRecoveryBehavior) {
      const requiredFrKeys = ['autosaveRequired', 'preserveLocalResponseUntilConfirmed', 'resumableUploadRequired', 'audioLoadFailureAction', 'duplicateSubmissionPrevention'];
      for (const key of requiredFrKeys) {
        if (!(key in task.failureRecoveryBehavior)) {
          errors.push(`${manifestPath}: task "${cid}" failureRecoveryBehavior missing required key "${key}"`);
        }
      }
      // Speaking recordings require resumable upload
      const speakingTasks = ['read_aloud', 'repeat_sentence', 'describe_image', 'retell_lecture', 'answer_short_question', 'summarize_group_discussion', 'respond_to_situation'];
      if (speakingTasks.includes(cid) && task.failureRecoveryBehavior.resumableUploadRequired !== true) {
        errors.push(`${manifestPath}: task "${cid}" speaking recording requires resumableUploadRequired true`);
      }
    }

    // Deprecated fields
    if (task.scoringRule) {
      errors.push(`${manifestPath}: task "${cid}" uses deprecated field "scoringRule"; use "platformEstimatedScoringRule"`);
    }

    if (task.promptLength) {
      validateTimingObject(task.promptLength, `${manifestPath} task "${cid}"`, 'promptLength');
    }
    if (task.preparationTiming) {
      validateTimingObject(task.preparationTiming, `${manifestPath} task "${cid}"`, 'preparationTiming');
    }
    if (task.responseTiming) {
      validateTimingObject(task.responseTiming, `${manifestPath} task "${cid}"`, 'responseTiming');
    }

    if (typeof task.playbackLimit !== 'number' || task.playbackLimit < 0) {
      errors.push(`${manifestPath}: task "${cid}" playbackLimit must be a non-negative number`);
    }
    if (typeof task.recordingLimit !== 'number' || task.recordingLimit < 0) {
      errors.push(`${manifestPath}: task "${cid}" recordingLimit must be a non-negative number`);
    }

    if (typeof task.promptTranscriptRequired !== 'boolean') {
      errors.push(`${manifestPath}: task "${cid}" promptTranscriptRequired must be a boolean`);
    }
    if (typeof task.postAttemptTranscriptAvailable !== 'boolean') {
      errors.push(`${manifestPath}: task "${cid}" postAttemptTranscriptAvailable must be a boolean`);
    }

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

    if (task.lastVerifiedAt && !isValidDate(task.lastVerifiedAt)) {
      errors.push(`${manifestPath}: task "${cid}" lastVerifiedAt "${task.lastVerifiedAt}" is not a valid ISO date`);
    }

    const stringified = JSON.stringify(task).toLowerCase();
    for (const label of FUTURE_LABELS) {
      if (stringified.includes(label)) {
        errors.push(`${manifestPath}: task "${cid}" contains prohibited label "${label}"`);
      }
    }
  }

  for (const [section, expected] of Object.entries(SECTION_COUNTS)) {
    if (sectionCounts[section] !== expected) {
      errors.push(`${manifestPath}: expected ${expected} ${section} tasks, found ${sectionCounts[section]}`);
    }
  }

  // Canonical fixture comparison
  const fixturePath = join(root, 'tests/docs/fixtures/canonical-pte-task-contract.json');
  let canonical = [];
  try {
    if (existsSync(fixturePath)) {
      canonical = JSON.parse(readFileSync(fixturePath, 'utf-8'));
    }
  } catch {}

  if (canonical.length === 22) {
    const fieldsToCompare = [
      'section', 'promptType', 'responseType',
      'playbackLimit', 'recordingLimit', 'officialScoringType',
      'promptTranscriptRequired'
    ];
    const arrayFieldsToCompare = [
      'officialSkillsAssessed', 'scoreContributions', 'officialRubricTraits'
    ];
    const timingFields = ['promptLength', 'preparationTiming', 'responseTiming'];

    for (const task of manifest) {
      const cid = task.canonicalId;
      const fixture = canonical.find(f => f.canonicalId === cid);
      if (!fixture) continue;

      for (const field of fieldsToCompare) {
        if (JSON.stringify(task[field]) !== JSON.stringify(fixture[field])) {
          errors.push(`Task "${cid}": ${field} mismatch. Expected: ${JSON.stringify(fixture[field])}. Actual: ${JSON.stringify(task[field])}`);
        }
      }

      for (const field of arrayFieldsToCompare) {
        if (JSON.stringify(task[field]) !== JSON.stringify(fixture[field])) {
          errors.push(`Task "${cid}": ${field} mismatch. Expected: ${JSON.stringify(fixture[field])}. Actual: ${JSON.stringify(task[field])}`);
        }
      }

      for (const field of timingFields) {
        if (task[field] && fixture[field]) {
          for (const sub of ['mode', 'minimum', 'maximum', 'unit']) {
            if (JSON.stringify(task[field][sub]) !== JSON.stringify(fixture[field][sub])) {
              errors.push(`Task "${cid}": ${field}.${sub} mismatch. Expected: ${JSON.stringify(fixture[field][sub])}. Actual: ${JSON.stringify(task[field][sub])}`);
            }
          }
        }
      }

      const taskRefs = new Set(task.referenceIds || []);
      const fixRefs = new Set(fixture.referenceIds || []);
      if (taskRefs.size !== fixRefs.size || [...taskRefs].sort().join(',') !== [...fixRefs].sort().join(',')) {
        errors.push(`Task "${cid}": referenceIds mismatch. Expected: ${JSON.stringify(fixture.referenceIds)}. Actual: ${JSON.stringify(task.referenceIds)}`);
      }
    }
  }

  // ---- H/I: Immutable factual assertions ----
  const RUBRIC_TASKS = new Set(['read_aloud', 'repeat_sentence', 'describe_image', 'retell_lecture',
    'answer_short_question', 'summarize_group_discussion', 'respond_to_situation',
    'summarize_written_text', 'write_essay', 'summarize_spoken_text']);

  const OBJECTIVE_NO_RUBRIC_TASKS = new Set(['reading_writing_fill_blanks', 'reading_multiple_answers',
    'reorder_paragraph', 'reading_fill_blanks', 'reading_single_answer',
    'listening_multiple_answers', 'listening_fill_blanks', 'highlight_correct_summary',
    'listening_single_answer', 'select_missing_word', 'highlight_incorrect_words', 'write_from_dictation']);

  for (const task of manifest) {
    const cid = task.canonicalId;

    // Reorder Paragraph: 0-150 words
    if (cid === 'reorder_paragraph' && task.promptLength) {
      if (task.promptLength.minimum !== 0 || task.promptLength.maximum !== 150 || task.promptLength.unit !== 'words') {
        errors.push(`${manifestPath}: task "${cid}" promptLength must be 0-150 words (range)`);
      }
    }

    // Summarize Written Text: 0-300 words
    if (cid === 'summarize_written_text' && task.promptLength) {
      if (task.promptLength.minimum !== 0 || task.promptLength.maximum !== 300 || task.promptLength.unit !== 'words') {
        errors.push(`${manifestPath}: task "${cid}" promptLength must be 0-300 words (range)`);
      }
    }

    // Write From Dictation: 3-5 seconds
    if (cid === 'write_from_dictation' && task.promptLength) {
      if (task.promptLength.minimum !== 3 || task.promptLength.maximum !== 5) {
        errors.push(`${manifestPath}: task "${cid}" promptLength must be 3-5 seconds`);
      }
    }

    // Write From Dictation: assessed Listening+Writing, contributes Listening+Writing, no rubric traits
    if (cid === 'write_from_dictation') {
      const expSkills = ['Listening', 'Writing'];
      const expContrib = ['Listening', 'Writing'];
      if (JSON.stringify(task.officialSkillsAssessed) !== JSON.stringify(expSkills)) {
        errors.push(`${manifestPath}: task "${cid}" officialSkillsAssessed must be ${JSON.stringify(expSkills)}`);
      }
      if (JSON.stringify(task.scoreContributions) !== JSON.stringify(expContrib)) {
        errors.push(`${manifestPath}: task "${cid}" scoreContributions must be ${JSON.stringify(expContrib)}`);
      }
      if (task.officialRubricTraits.length !== 0) {
        errors.push(`${manifestPath}: task "${cid}" must have empty officialRubricTraits (objective scoring)`);
      }
    }

    // Summarize Spoken Text: 60-90 seconds, includes Spelling
    if (cid === 'summarize_spoken_text') {
      if (task.promptLength) {
        if (task.promptLength.minimum !== 60 || task.promptLength.maximum !== 90) {
          errors.push(`${manifestPath}: task "${cid}" promptLength must be 60-90 seconds`);
        }
      }
      if (task.officialRubricTraits && !task.officialRubricTraits.includes('Spelling')) {
        errors.push(`${manifestPath}: task "${cid}" must include Spelling in officialRubricTraits`);
      }
      // Timing description must say total task timer includes listening and writing
      if (task.responseTimingDescription && task.responseTimingDescription.includes('begins after the audio ends')) {
        errors.push(`${manifestPath}: task "${cid}" timer wording "begins after the audio ends" is invalid; must state "total task timer includes audio playback and writing time"`);
      }
    }

    // Write Essay: 2-3 sentence prompt
    if (cid === 'write_essay') {
      if (task.promptLength) {
        if (task.promptLength.minimum !== 2 || task.promptLength.maximum !== 3 || task.promptLength.unit !== 'sentences') {
          errors.push(`${manifestPath}: task "${cid}" promptLength must be 2-3 sentences`);
        }
      }
      if (task.officialRubricTraits) {
        if (task.officialRubricTraits.includes('Structure') || task.officialRubricTraits.includes('Coherence')) {
          errors.push(`${manifestPath}: task "${cid}" must not split "Development, Structure and Coherence" into separate traits`);
        }
      }
    }

    // Respond to a Situation: promptType must be text-and-audio
    if (cid === 'respond_to_situation' && task.promptType !== 'text-and-audio') {
      errors.push(`${manifestPath}: task "${cid}" promptType must be text-and-audio`);
    }

    // Listening Fill in the Blanks: transcript required
    if (cid === 'listening_fill_blanks' && task.promptTranscriptRequired !== true) {
      errors.push(`${manifestPath}: task "${cid}" promptTranscriptRequired must be true`);
    }

    // Highlight Incorrect Words: transcript required
    if (cid === 'highlight_incorrect_words' && task.promptTranscriptRequired !== true) {
      errors.push(`${manifestPath}: task "${cid}" promptTranscriptRequired must be true`);
    }

    // Listening Fill in the Blanks: assessed Listening, contributes Listening+Writing, no rubric traits
    if (cid === 'listening_fill_blanks') {
      if (JSON.stringify(task.officialSkillsAssessed) !== JSON.stringify(['Listening'])) {
        errors.push(`${manifestPath}: task "${cid}" officialSkillsAssessed must be ["Listening"]`);
      }
      if (JSON.stringify(task.scoreContributions) !== JSON.stringify(['Listening', 'Writing'])) {
        errors.push(`${manifestPath}: task "${cid}" scoreContributions must be ["Listening","Writing"]`);
      }
      if (task.officialRubricTraits.length !== 0) {
        errors.push(`${manifestPath}: task "${cid}" must have empty officialRubricTraits`);
      }
    }

    // Highlight Correct Summary: assessed Listening+Reading, no rubric traits
    if (cid === 'highlight_correct_summary') {
      if (JSON.stringify(task.officialSkillsAssessed) !== JSON.stringify(['Listening', 'Reading'])) {
        errors.push(`${manifestPath}: task "${cid}" officialSkillsAssessed must be ["Listening","Reading"]`);
      }
      if (task.officialRubricTraits.length !== 0) {
        errors.push(`${manifestPath}: task "${cid}" must have empty officialRubricTraits`);
      }
    }

    // Reading Dropdown: assessed Reading, contributes Reading, no rubric traits
    if (cid === 'reading_writing_fill_blanks') {
      if (JSON.stringify(task.officialSkillsAssessed) !== JSON.stringify(['Reading'])) {
        errors.push(`${manifestPath}: task "${cid}" officialSkillsAssessed must be ["Reading"]`);
      }
      if (JSON.stringify(task.scoreContributions) !== JSON.stringify(['Reading'])) {
        errors.push(`${manifestPath}: task "${cid}" scoreContributions must be ["Reading"]`);
      }
      if (task.officialRubricTraits.length !== 0) {
        errors.push(`${manifestPath}: task "${cid}" must have empty officialRubricTraits`);
      }
    }

    // Listening Multiple Answers: 7-second preparation
    if (cid === 'listening_multiple_answers' && task.preparationTiming) {
      if (task.preparationTiming.minimum !== 7 || task.preparationTiming.maximum !== 7) {
        errors.push(`${manifestPath}: task "${cid}" preparationTiming must be 7 seconds fixed`);
      }
    }

    // Listening Fill in the Blanks: 7-second preparation
    if (cid === 'listening_fill_blanks' && task.preparationTiming) {
      if (task.preparationTiming.minimum !== 7 || task.preparationTiming.maximum !== 7) {
        errors.push(`${manifestPath}: task "${cid}" preparationTiming must be 7 seconds fixed`);
      }
    }

    // Listening Single Answer: 5-second preparation
    if (cid === 'listening_single_answer' && task.preparationTiming) {
      if (task.preparationTiming.minimum !== 5 || task.preparationTiming.maximum !== 5) {
        errors.push(`${manifestPath}: task "${cid}" preparationTiming must be 5 seconds fixed`);
      }
    }

    // Highlight Incorrect Words: 10-second preparation
    if (cid === 'highlight_incorrect_words' && task.preparationTiming) {
      if (task.preparationTiming.minimum !== 10 || task.preparationTiming.maximum !== 10) {
        errors.push(`${manifestPath}: task "${cid}" preparationTiming must be 10 seconds fixed`);
      }
    }

    // Rubric-scored tasks must have named rubric traits
    if (RUBRIC_TASKS.has(cid) && task.officialRubricTraits && task.officialRubricTraits.length === 0) {
      errors.push(`${manifestPath}: task "${cid}" is rubric-scored but officialRubricTraits is empty`);
    }

    // Objective tasks must not have named rubric traits
    if (OBJECTIVE_NO_RUBRIC_TASKS.has(cid) && task.officialRubricTraits && task.officialRubricTraits.length > 0) {
      errors.push(`${manifestPath}: task "${cid}" is objective but officialRubricTraits has named traits`);
    }

    // Describe Image: promptLength must be not-applicable
    if (cid === 'describe_image' && task.promptLength && task.promptLength.mode !== 'not-applicable') {
      errors.push(`${manifestPath}: task "${cid}" promptLength mode must be not-applicable`);
    }

    // Retell Lecture: must support audiovisual
    if (cid === 'retell_lecture' && task.supportsAudiovisualInput !== true) {
      errors.push(`${manifestPath}: task "${cid}" supportsAudiovisualInput must be true`);
    }

    // Answer Short Question: optional image
    if (cid === 'answer_short_question' && task.optionalAccompanyingImage !== true) {
      errors.push(`${manifestPath}: task "${cid}" optionalAccompanyingImage must be true`);
    }

    // officialHumanReviewTraits checks
    const expectedHumanReviewTraits = {
      describe_image: ['Content'],
      retell_lecture: ['Content'],
      summarize_group_discussion: ['Content'],
      respond_to_situation: ['Content'],
      summarize_written_text: ['Content'],
      summarize_spoken_text: ['Content'],
      write_essay: ['Content', 'Development, Structure and Coherence', 'General Linguistic Range'],
    };
    if (expectedHumanReviewTraits[cid]) {
      const expected = JSON.stringify(expectedHumanReviewTraits[cid]);
      const actual = JSON.stringify(task.officialHumanReviewTraits || []);
      if (expected !== actual) {
        errors.push(`${manifestPath}: task "${cid}" officialHumanReviewTraits mismatch. Expected: ${expected}, Actual: ${actual}`);
      }
    } else if (task.officialHumanReviewTraits && task.officialHumanReviewTraits.length > 0) {
      errors.push(`${manifestPath}: task "${cid}" must have empty officialHumanReviewTraits`);
    }

    // No transcript tasks
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

  if (content.includes('Internal reviewer | Heidi Dang') || content.includes('Internal reviewer|Heidi')) {
    errors.push(`${registerPath}: must not list Heidi Dang as Internal reviewer without explicit evidence`);
  }
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

// ---- F: Scoring-principles table validation ----

export function validateScoringPrinciplesTable(principlesPath) {
  const content = requiredFile(principlesPath);
  if (!content) return;

  const manifestPath = 'docs/content/pte-task-manifest.json';
  const manifestContent = requiredFile(manifestPath);
  if (!manifestContent) return;

  let manifest;
  try { manifest = JSON.parse(manifestContent); } catch { return; }
  if (!Array.isArray(manifest)) return;

  // Find the integrated-skill table in scoring-principles.md
  const tableStart = content.indexOf('| Task | Skills Assessed | Contribution |');
  if (tableStart === -1) {
    errors.push(`${principlesPath}: missing integrated-skill contribution table`);
    return;
  }

  const tableEnd = content.indexOf('## Result Storage', tableStart);
  const tableSection = tableEnd === -1 ? content.slice(tableStart) : content.slice(tableStart, tableEnd);
  const tableLines = tableSection.split('\n').filter(l => l.startsWith('|') && !l.includes('---'));

  for (const task of manifest) {
    const cid = task.canonicalId;
    const displayName = task.displayName;
    const expectedSkills = (task.officialSkillsAssessed || []).join(', ');
    const expectedContrib = (task.scoreContributions || []).join(', ');

    // Find the matching row by display name
    const row = tableLines.find(l => l.includes(displayName));
    if (!row) {
      errors.push(`${principlesPath}: missing row for "${displayName}" in integrated-skill table`);
      continue;
    }

    const cells = row.split('|').filter(c => c.trim().length > 0);
    if (cells.length < 3) {
      errors.push(`${principlesPath}: row for "${displayName}" has fewer than 3 cells`);
      continue;
    }

    const rowSkills = cells[1].trim();
    const rowContrib = cells[2].trim();

    // Normalize for comparison
    const normalize = s => s.trim().split(/\s*,\s*/).sort().join(', ').toLowerCase();
    if (normalize(rowSkills) !== normalize(expectedSkills)) {
      errors.push(`${principlesPath}: "${displayName}" skills mismatch. Table says "${rowSkills}", manifest says "${expectedSkills}"`);
    }
    if (normalize(rowContrib) !== normalize(expectedContrib)) {
      errors.push(`${principlesPath}: "${displayName}" contribution mismatch. Table says "${rowContrib}", manifest says "${expectedContrib}"`);
    }
  }
}

export function validateAssessmentAcceptanceConsistency(acceptancePath) {
  const content = requiredFile(acceptancePath);
  if (!content) return;

  // Reject forbidden patterns
  const forbiddenPatterns = [
    'A writing response of 0 words cannot be submitted',
    'In mock mode, no transcript is visible before submission',
    'All blanks must be completed',
    'Exactly one answer is required before submission',
  ];
  for (const pattern of forbiddenPatterns) {
    if (content.includes(pattern)) {
      errors.push(`${acceptancePath}: contains forbidden pattern "${pattern}"`);
    }
  }

  // Require essential concepts
  const requiredConcepts = [
    'empty response',
    'no-response score',
    'prompt transcript',
    'Listening Fill in the Blanks',
    'Highlight Incorrect Words',
  ];
  for (const concept of requiredConcepts) {
    if (!content.toLowerCase().includes(concept.toLowerCase())) {
      errors.push(`${acceptancePath}: missing required concept "${concept}"`);
    }
  }
}

// ---- E: Scoring narrative consistency ----

export function validateScoringNarrativeConsistency(principlesPath) {
  const content = requiredFile(principlesPath);
  if (!content) return;

  // Locate the constrained-response section
  const sectionStart = content.indexOf('### Constrained-Response Speaking Tasks');
  if (sectionStart === -1) {
    errors.push(`${principlesPath}: missing Constrained-Response Speaking Tasks section`);
    return;
  }
  const sectionEnd = content.indexOf('### ', sectionStart + 10);
  const section = sectionEnd === -1 ? content.slice(sectionStart) : content.slice(sectionStart, sectionEnd);

  // Answer Short Question must exist (without depending on bold formatting)
  if (!section.includes('Answer Short Question')) {
    errors.push(`${principlesPath}: Answer Short Question must be mentioned in scoring narrative`);
    return;
  }

  // Find ASQ narrative block: try bold first, then fall back to plain text
  let boldAsqIdx = section.indexOf('\n**Answer Short Question**');
  if (boldAsqIdx === -1) {
    // Fallback: find the last occurrence (the actual narrative, not the task list)
    const lastAsqIdx = section.lastIndexOf('Answer Short Question');
    boldAsqIdx = lastAsqIdx > 0 ? lastAsqIdx - 1 : -1;
    // If still not found, use the first occurrence after the task list
    if (boldAsqIdx === -2) {
      errors.push(`${principlesPath}: Answer Short Question must have a separate scoring narrative entry`);
      return;
    }
  }
  const afterAsq = section.slice(boldAsqIdx);
  // Split at next "**" block boundary
  const nextBoldIdx = afterAsq.search(/\n\*\*/);
  const asqBlock = nextBoldIdx > 0 ? afterAsq.slice(0, nextBoldIdx) : afterAsq;
  const asqLower = asqBlock.toLowerCase();

  // ASQ scoring must be correct/incorrect with vocabulary matching
  if (!asqLower.includes('correct/incorrect') && !asqLower.includes('correct-incorrect')) {
    errors.push(`${principlesPath}: Answer Short Question must state Correct/Incorrect scoring type`);
  }
  if (!asqLower.includes('vocabulary') && !asqLower.includes('accepted-answer')) {
    errors.push(`${principlesPath}: Answer Short Question must mention vocabulary or accepted-answer matching`);
  }

  // ASQ must reference Listening as assessed/contributing skill
  if (!asqLower.includes('listening')) {
    errors.push(`${principlesPath}: Answer Short Question must assess and contribute to Listening`);
  }

  // Check for scoring claims about pronunciation or oral fluency in the ASQ block
  // Reject any statement that says pronunciation/fluency:
  //   - is scored, contributes, changes the score, is used as scoring evidence, or forms part of the scored rubric
  // Exclude statements that explicitly say "do not affect" or "excluded" (negation clauses)

  function hasScoringClaim(text, term) {
    // Check for scoring claims about `term` that are not negated
    const termEscaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Pattern: term followed by scoring-related words within the same sentence, excluding negations
    const scoringClaimPattern = new RegExp(
      termEscaped + '[^.]*?(?:scor|evidenc|contribut|rubric|calculated|forms part of)',
      'i'
    );
    if (!scoringClaimPattern.test(text)) return false;
    // Check if the sentence containing the match has a negation
    const match = text.match(new RegExp('[^.]*?' + termEscaped + '[^.]*\\.', 'i'));
    if (match) {
      const sentence = match[0].toLowerCase();
      if (sentence.includes('do not affect') || sentence.includes('excluded') ||
          sentence.includes('non-scored') || sentence.includes('not affect') ||
          sentence.includes('does not')) {
        return false;
      }
    }
    return true;
  }

  let asqHasScoringClaim = false;
  if (hasScoringClaim(asqBlock, 'pronunciation')) {
    asqHasScoringClaim = true;
  }
  if (hasScoringClaim(asqBlock, 'oral fluency')) {
    asqHasScoringClaim = true;
  }
  if (asqHasScoringClaim) {
    errors.push(`${principlesPath}: Answer Short Question must not assign pronunciation or oral fluency to the item score`);
  }

  // Also reject broader ASQ section if it contains pronunciation as scoring without clear exclusion
  // Handle: "Pronunciation evidence is also used to calculate the item score"
  if (/Pronunciation evidence.*item score/i.test(asqBlock) || /Pronunciation[^.]*?item score/i.test(asqBlock)) {
    const pronSentence = asqBlock.match(/[^.]*?[Pp]ronunciation[^.]*\./);
    if (pronSentence && !pronSentence[0].toLowerCase().includes('do not affect')) {
      errors.push(`${principlesPath}: Answer Short Question must exclude pronunciation from item scoring`);
    }
  }
  if (/oral fluency[^.]*?item score/i.test(asqBlock) || /oral fluency[^.]*?scoring evidence/i.test(asqBlock)) {
    const fluencySentence = asqBlock.match(/[^.]*?oral fluency[^.]*\./);
    if (fluencySentence && !fluencySentence[0].toLowerCase().includes('do not affect')) {
      errors.push(`${principlesPath}: Answer Short Question must exclude oral fluency from item scoring`);
    }
  }

  // Check "Answer Short Question uses X as scoring evidence" without bold
  if (/Answer Short Question uses.*(?:pronunciation|oral fluency).*scoring/i.test(asqBlock)) {
    errors.push(`${principlesPath}: Answer Short Question must not use pronunciation or oral fluency as scoring evidence`);
  }
}

// ---- D: Exact route-table parser ----

function parseMarkdownRouteTable(content) {
  const lines = content.split('\n');
  const routes = [];
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith('|') && line.includes('| `') && (line.includes('/app/') || line.includes('/content/') || line.includes('/teacher/'))) {
      inTable = true;
      const cells = line.split('|').map(c => c.trim());
      // Route is the first data cell (usually index 1 after splitting, but may contain backticks)
      if (cells.length >= 2) {
        const routeMatch = cells[1].match(/`([^`]+)`/);
        if (routeMatch) {
          const route = routeMatch[1];
          const roles = cells[2] || '';
          const purpose = cells[3] || '';
          routes.push({ route, roles, purpose, raw: line });
        }
      }
    } else if (inTable && !line.startsWith('|')) {
      inTable = false;
    }
  }
  return routes;
}

// ---- H/C: Role-route consistency (cross-document) ----

export function validateRoleRouteConsistency(routeMapPath, userRolesPath) {
  const routeContent = requiredFile(routeMapPath);
  if (!routeContent) return;
  const rolesContent = requiredFile(userRolesPath || 'docs/product/user-roles.md');
  if (!rolesContent) return;

  // Parse permission matrix from user-roles.md
  const roleRows = rolesContent.split('\n').filter(l => l.startsWith('|') && l.includes('Content Reviewer'));
  if (roleRows.length === 0) {
    errors.push(`${userRolesPath}: missing Content Reviewer row in permission matrix`);
    return;
  }

  // Parse the header to find column positions by name
  const headerLines = rolesContent.split('\n').filter(l => l.startsWith('|') && l.includes('Role') && l.includes('Edit'));
  let editCol = -1, publishCol = -1, retireCol = -1;
  if (headerLines.length > 0) {
    const headers = headerLines[0].split('|').map(h => h.trim().toLowerCase());
    editCol = headers.indexOf('edit');
    publishCol = headers.indexOf('publish');
    retireCol = headers.indexOf('retire');
  }

  if (editCol === -1) {
    errors.push(`${userRolesPath}: cannot find Edit column in permission matrix header`);
  }

  const reviewRow = roleRows[0].split('|').map(c => c.trim());
  const editVal = editCol >= 0 && editCol < reviewRow.length ? reviewRow[editCol] : '';
  const publishVal = publishCol >= 0 && publishCol < reviewRow.length ? reviewRow[publishCol] : '';
  const retireVal = retireCol >= 0 && retireCol < reviewRow.length ? reviewRow[retireCol] : '';

  if (editVal !== 'No') {
    errors.push(`${userRolesPath}: Content Reviewer Edit permission must be No, found "${editVal}"`);
  }
  if (publishVal !== 'No') {
    errors.push(`${userRolesPath}: Content Reviewer Publish permission must be No, found "${publishVal}"`);
  }
  if (retireVal !== 'No') {
    errors.push(`${userRolesPath}: Content Reviewer Retire permission must be No, found "${retireVal}"`);
  }

  // Parse route map for exact route validation
  const routes = parseMarkdownRouteTable(routeContent);

  // Check /content/questions/[questionId] must state read-only
  const questionRoute = routes.find(r => r.route === '/content/questions/[questionId]');
  if (!questionRoute) {
    errors.push(`${routeMapPath}: missing required route /content/questions/[questionId]`);
  } else if (!questionRoute.purpose.toLowerCase().includes('read-only') &&
             !questionRoute.purpose.toLowerCase().includes('read only')) {
    errors.push(`${routeMapPath}: /content/questions/[questionId] must specify read-only access for Content reviewer`);
  }

  // Check /content/reviews/[reviewId] exists
  const reviewRoute = routes.find(r => r.route === '/content/reviews/[reviewId]');
  if (!reviewRoute) {
    errors.push(`${routeMapPath}: missing required route /content/reviews/[reviewId]`);
  } else if (!reviewRoute.purpose.includes('cannot publish')) {
    errors.push(`${routeMapPath}: /content/reviews/[reviewId] must state it cannot publish or retire content`);
  }
}

// ---- F: Content publication and retirement authority (cross-document) ----

export function validateContentPublicationAuthority(workflowPath, routeMapPath, acceptancePath, userRolesPath) {
  const workflow = requiredFile(workflowPath);
  const routeMap = routeMapPath ? requiredFile(routeMapPath) : '';
  const acceptContent = acceptancePath ? requiredFile(acceptancePath) : '';
  const rolesContent = userRolesPath ? requiredFile(userRolesPath) : '';
  if (!workflow) return;

  // 1. Quality Approval must exist (reviewer approval is NOT publication)
  if (!workflow.includes('Quality Approval')) {
    errors.push(`${workflowPath}: missing Quality Approval stage`);
  }

  // 2. Administrator Publication Authorisation must exist
  if (!workflow.includes('Administrator Publication Authorisation')) {
    errors.push(`${workflowPath}: missing Administrator Publication Authorisation stage`);
  }

  // 3. No reviewer action can directly or automatically publish
  if (workflow.includes('triggered by approval') && !workflow.includes('triggered by Administrator authorisation')) {
    errors.push(`${workflowPath}: publication must not be triggered by approval; must require Administrator authorisation`);
  }
  // Check for synonyms or equivalent contradictions
  const pubStages = workflow.split('\n### ').filter(s => s.toLowerCase().includes('public'));
  for (const stage of pubStages) {
    if (stage.includes('reviewer') && stage.includes('publication') && !stage.includes('cannot publish')) {
      errors.push(`${workflowPath}: Content Reviewer must not be able to publish content`);
    }
  }

  // 4. System publication requires prior Administrator authorisation
  const systemPubStage = workflow.split('\n### ').find(s => s.startsWith('System Publication'));
  if (systemPubStage) {
    if (!systemPubStage.toLowerCase().includes('administrator authorisation')) {
      errors.push(`${workflowPath}: System Publication must require Administrator authorisation`);
    }
  }

  // 5. Content Reviewer may recommend revision or retirement but cannot execute
  const recStage = workflow.split('\n### ').find(s => s.startsWith('Revision or Retirement Recommendation'));
  if (recStage) {
    if (!recStage.includes('Content reviewer')) {
      errors.push(`${workflowPath}: Revision or Retirement Recommendation must be by Content reviewer`);
    }
    if (!recStage.includes('cannot retire')) {
      errors.push(`${workflowPath}: must state Content Reviewer cannot retire content`);
    }
  }

  // 6. Administrator Retirement Authorisation must exist
  if (!workflow.includes('Administrator Retirement Authorisation')) {
    errors.push(`${workflowPath}: missing Administrator Retirement Authorisation stage`);
  }

  // 7. System Retirement requires Administrator authorisation
  const systemRetStage = workflow.split('\n### ').find(s => s.startsWith('System Retirement'));
  if (systemRetStage && !systemRetStage.toLowerCase().includes('administrator authorisation')) {
    errors.push(`${workflowPath}: System Retirement must require Administrator authorisation`);
  }

  // 8. Content Writer cannot approve or publish their own content
  if (!workflow.includes('Content Writer cannot approve')) {
    errors.push(`${workflowPath}: must state Content Writer cannot approve or publish their own content`);
  }

  // 9. User roles matrix check
  if (rolesContent) {
    const revRows = rolesContent.split('\n').filter(l => l.startsWith('|') && l.includes('Content Reviewer'));
    if (revRows.length === 0) {
      errors.push(`${userRolesPath}: missing Content Reviewer row`);
    } else {
      const cells = revRows[0].split('|').map(c => c.trim());
      const headers = rolesContent.split('\n').filter(l => l.startsWith('|') && l.includes('Role'))[0];
      if (headers) {
        const hdrs = headers.split('|').map(h => h.trim().toLowerCase());
        const pubIdx = hdrs.indexOf('publish');
        const retIdx = hdrs.indexOf('retire');
        if (pubIdx >= 0 && pubIdx < cells.length && cells[pubIdx] !== 'No') {
          errors.push(`${userRolesPath}: Content Reviewer Publish must be No, found "${cells[pubIdx]}"`);
        }
        if (retIdx >= 0 && retIdx < cells.length && cells[retIdx] !== 'No') {
          errors.push(`${userRolesPath}: Content Reviewer Retire must be No, found "${cells[retIdx]}"`);
        }
      }
    }
  }

  // 10. Route map check
  if (routeMap) {
    const reviewRouteLine = routeMap.split('\n').find(l => l.includes('/content/reviews/[reviewId]'));
    if (reviewRouteLine && !reviewRouteLine.includes('cannot publish')) {
      errors.push(`${routeMapPath}: /content/reviews/[reviewId] must state it cannot publish or retire content`);
    }
  }

  // 11. Acceptance criteria alignment
  if (acceptContent) {
    if (!acceptContent.includes('reviewer cannot publish') && !acceptContent.includes('cannot publish content')) {
      errors.push(`${acceptancePath}: must state that content reviewer cannot publish`);
    }
    if (!acceptContent.includes('Only an Administrator can authorise publication') &&
        !acceptContent.toLowerCase().includes('administrator can authorise')) {
      errors.push(`${acceptancePath}: must state that only Administrator can authorise publication`);
    }
  }
}

// ---- H: Student assessment routes ----

export function validateStudentAssessmentRoutes(routeMapPath) {
  const content = requiredFile(routeMapPath);
  if (!content) return;

  const routes = parseMarkdownRouteTable(content);

  // Helper: find route by exact match
  function findExactRoute(routes, path) {
    return routes.find(r => r.route === path);
  }

  // Diagnostic routes (exact match only)
  const diagnosticRoutes = [
    '/app/diagnostic',
    '/app/diagnostic/attempts/[attemptId]',
    '/app/diagnostic/results/[reportId]',
  ];
  for (const route of diagnosticRoutes) {
    const found = findExactRoute(routes, route);
    if (!found) {
      errors.push(`${routeMapPath}: missing exact diagnostic route ${route}`);
    } else {
      if (!found.roles.includes('Free student') || !found.roles.includes('Paid student')) {
        errors.push(`${routeMapPath}: route ${route} must permit both Free student and Paid student`);
      }
      if (route.includes('/results/') && !found.roles.includes('Free student')) {
        errors.push(`${routeMapPath}: route ${route} must be accessible to Free Student`);
      }
    }
  }

  // Section-test routes (exact match only)
  const sectionTestRoutes = [
    '/app/section-tests',
    '/app/section-tests/[testId]',
    '/app/section-attempts/[attemptId]',
  ];
  for (const route of sectionTestRoutes) {
    const found = findExactRoute(routes, route);
    if (!found) {
      errors.push(`${routeMapPath}: missing exact section-test route ${route}`);
    } else if (!found.roles.includes('Paid student')) {
      errors.push(`${routeMapPath}: route ${route} must permit Paid student`);
    }
  }
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
  validateReferenceRegisterJson('docs/content/official-pte-reference-register.json');
  validateTaskReferences();
  validateScoringPrinciplesTable('docs/scoring/scoring-principles.md');
  validateAssessmentAcceptanceConsistency('docs/product/acceptance-criteria.md');

  // Scorecard
  const scorecard = requiredFile('docs/testing/audit-scorecard.md');
  if (scorecard) {
    checkContent('docs/testing/audit-scorecard.md', scorecard, [
      ['98/100 acceptance threshold', '98/100', false],
      ['Repository and structure section', 'Repository and Structure', false],
      ['Requirements completeness section', 'Requirements Completeness', false],
      ['PTE coverage section', 'PTE Coverage and Accuracy', false],
      ['Content system section', 'Content System', false],
      ['Scoring and calibration section', 'Scoring and Calibration', false],
      ['UX and recovery section', 'UX and Recovery', false],
      ['Testing and release gates section', 'Testing and Release Gates', false],
      ['Documentation quality section', 'Documentation Quality', false],
    ]);
    validateScorecard('docs/testing/audit-scorecard.md');
  }

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
  validateScoringNarrativeConsistency('docs/scoring/scoring-principles.md');
  validateRoleRouteConsistency('docs/product/route-map.md', 'docs/product/user-roles.md');
  validateContentPublicationAuthority(
    'docs/content/content-workflow.md',
    'docs/product/route-map.md',
    'docs/product/acceptance-criteria.md',
    'docs/product/user-roles.md'
  );
  validateStudentAssessmentRoutes('docs/product/route-map.md');

  const workflow = requiredFile('docs/content/content-workflow.md');
  if (workflow) {
    checkContent('docs/content/content-workflow.md', workflow, [
      ['Workflow stages', 'Idea', false],
      ['Quality Approval stage', 'Quality Approval', false],
      ['Administrator Publication Authorisation stage', 'Administrator Publication Authorisation', false],
      ['System Publication stage', 'System Publication', false],
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
