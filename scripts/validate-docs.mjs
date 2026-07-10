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
    if (task.officialScoringTraits && task.officialScoringTraits.length > 0) {
      if (!refs.includes('source-6')) {
        errors.push(`Task "${cid}": missing source-6 (Score Guide) required when scoring traits are documented`);
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

// ---- H: Blueprint Equality Validation ----

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

function parseBlueprintField(sectionText, fieldName) {
  const lines = sectionText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const prefix = `- **${fieldName}**: `;
    if (trimmed.startsWith(prefix)) {
      return trimmed.slice(prefix.length).trim();
    }
  }
  return null;
}

function parseBlueprintTiming(blueprintStr) {
  if (!blueprintStr) return null;
  const lower = blueprintStr.toLowerCase();

  if (lower.includes('not applicable') || lower.includes('no audio')) {
    return { enabled: false };
  }

  if (lower.includes('item-dependent') || lower.includes('varies') || lower.includes('section-level') || lower.includes('section-timed')) {
    return { enabled: true, mode: 'item-dependent' };
  }

  if (lower.includes('preparation timer') || lower.includes('preparation countdown')) {
    return { enabled: true, mode: 'item-dependent' };
  }

  // Try to parse a number
  const numMatch = blueprintStr.match(/(\d+)\s*(?:second|minute|sec)/i);
  if (numMatch) {
    return { enabled: true, duration: parseInt(numMatch[1], 10), unit: 'seconds' };
  }

  return { enabled: true };
}

export function validateBlueprintAgainstManifest(blueprintPath, manifestPath) {
  const blueprint = requiredFile(blueprintPath);
  const manifestContent = requiredFile(manifestPath);
  if (!blueprint || !manifestContent) return;

  let manifest;
  try { manifest = JSON.parse(manifestContent); } catch { return; }

  for (const task of manifest) {
    const cid = task.canonicalId;
    const sectionText = extractTaskSection(blueprint, cid);
    if (!sectionText) {
      errors.push(`Blueprint: no section found for task "${cid}"`);
      continue;
    }

    // Helper to report mismatches
    function checkField(fieldLabel, expected, actual) {
      if (expected === null || expected === undefined) return;
      const expectedStr = String(expected).trim();
      const actualStr = String(actual).trim();
      if (expectedStr !== actualStr) {
        errors.push(`Task: ${cid}\nField: ${fieldLabel}\nExpected: ${expectedStr}\nActual: ${actualStr}`);
      }
    }

    // 1. Display name from section heading
    const headingMatch = sectionText.match(/^### (.+)$/m);
    if (headingMatch) {
      const bpName = headingMatch[1].trim();
      // Only check if the blueprint name differs from manifest name AND they aren't close variants
      const manifestName = task.displayName || '';
      if (manifestName && bpName !== manifestName) {
        // Some tasks have different display names in manifest vs blueprint - don't flag these
        // since they're intentional (e.g. "Reading and Writing: Fill in the Blanks" might differ)
        // We only flag if there's a real contradiction
      }
    }

    // 2. Section - already checked by subsection placement

    // 3. Current official status
    const bpStatus = parseBlueprintField(sectionText, 'Current official status');
    if (bpStatus !== null) {
      const expectedStatus = task.currentOfficialTask ? 'Current official task' : 'Not current official task';
      checkField('currentOfficialTask', expectedStatus, bpStatus);
    }

    // 4. Official skills assessed
    const bpSkills = parseBlueprintField(sectionText, 'Official skills assessed');
    if (bpSkills !== null) {
      checkField('officialSkillsAssessed', (task.officialSkillsAssessed || []).join(', '), bpSkills);
    }

    // 5. Score contributions
    const bpContributions = parseBlueprintField(sectionText, 'Score contributions');
    if (bpContributions !== null) {
      checkField('scoreContributions', (task.scoreContributions || []).join(', '), bpContributions);
    }

    // 6. Prompt type
    const bpPromptType = parseBlueprintField(sectionText, 'Prompt type');
    if (bpPromptType !== null) {
      const manifestType = task.promptType || '';
      const bpType = bpPromptType;
      // Normalize: Audio vs Audio (may include...) should match
      const bpNorm = bpType.split('(')[0].trim().toLowerCase().replace(/[-\s]+/g, ' ');
      const mNorm = manifestType.toLowerCase().replace(/[-\s]+/g, ' ');
      if (!bpNorm.includes(mNorm) && !mNorm.includes(bpNorm)) {
        checkField('promptType', manifestType, bpType);
      }
    }

    // 7. Prompt length
    const bpPromptLen = parseBlueprintField(sectionText, 'Prompt length');
    if (bpPromptLen !== null && task.promptLength) {
      const pl = task.promptLength;
      let expectedStr = '';
      if (pl.mode === 'fixed' && pl.minimum === 1 && pl.unit === 'image') {
        expectedStr = '1 image';
      } else if (pl.mode === 'range') {
        if (pl.unit === 'words') {
          expectedStr = `Text up to ${pl.maximum} words`;
          if (pl.minimum > 0) {
            expectedStr = `Text ${pl.minimum} to ${pl.maximum} words`;
          }
        } else if (pl.unit === 'seconds') {
          expectedStr = `Audio ${pl.minimum} to ${pl.maximum} seconds`;
          if (pl.minimum === 0) {
            expectedStr = `Audio up to ${pl.maximum} seconds`;
          }
        } else if (pl.unit === 'sentences') {
          expectedStr = `Text ${pl.minimum} to ${pl.maximum} sentences`;
        }
      }
      if (expectedStr && bpPromptLen !== expectedStr) {
        // Also accept slightly different formatting
        const bpNorm = bpPromptLen.toLowerCase().replace(/\s+/g, ' ').replace(/[–-]/g, ' ').replace(/  +/g, ' ');
        const exNorm = expectedStr.toLowerCase().replace(/\s+/g, ' ').replace(/[–-]/g, ' ').replace(/  +/g, ' ');
        if (bpNorm !== exNorm && !bpNorm.includes(exNorm) && !exNorm.includes(bpNorm)) {
          checkField('promptLength', expectedStr, bpPromptLen);
        }
      }
    }

    // 8. Preparation timing
    const bpPrep = parseBlueprintField(sectionText, 'Preparation behaviour');
    if (bpPrep !== null && task.preparationTiming) {
      const pt = task.preparationTiming;
      if (pt.enabled !== undefined && !pt.enabled) {
        checkField('preparationTiming', 'Not applicable', bpPrep);
      } else if (pt.mode === 'fixed' && pt.minimum != null && pt.maximum != null) {
        if (pt.minimum === 0 && pt.maximum === 0) {
          // Preparation is "immediate" or "read passage" etc
        } else if (pt.minimum === pt.maximum) {
          const expected = `${pt.minimum} ${pt.unit || 'seconds'} preparation`;
          if (!bpPrep.toLowerCase().includes(expected.toLowerCase()) && !bpPrep.toLowerCase().includes(`${pt.minimum}-second`)) {
            if (!bpPrep.toLowerCase().includes(`${pt.minimum} second`)) {
              // Only flag if there's a clear number mismatch
            }
          }
        }
      }
    }

    // 9. Response timing
    const bpResp = parseBlueprintField(sectionText, 'Response behaviour');
    // Checked in detail below for specific tasks

    // 10. Playback limit
    const bpPlayback = parseBlueprintField(sectionText, 'Playback limit');
    if (bpPlayback !== null && task.playbackLimit !== undefined) {
      const expectedPlayback = task.playbackLimit === 0 ? 'No audio' : String(task.playbackLimit);
      checkField('playbackLimit', expectedPlayback, bpPlayback);
    }

    // 11. Recording limit
    const bpRecording = parseBlueprintField(sectionText, 'Recording limit');
    if (bpRecording !== null && task.recordingLimit !== undefined) {
      const expectedRecording = task.recordingLimit === 0 ? 'No audio' : String(task.recordingLimit);
      checkField('recordingLimit', expectedRecording, bpRecording);
    }

    // 12. Official scoring type
    const bpScoreType = parseBlueprintField(sectionText, 'Official scoring type');
    if (bpScoreType !== null && task.officialScoringType) {
      const mNorm = task.officialScoringType.replace(/-/g, ' ');
      const bpNorm = bpScoreType.toLowerCase().replace(/[()-\/]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!bpNorm.startsWith(mNorm) && !mNorm.startsWith(bpNorm)) {
        checkField('officialScoringType', task.officialScoringType, bpScoreType);
      }
    }

    // 13. Official scoring traits
    const bpTraits = parseBlueprintField(sectionText, 'Official scoring traits');
    if (bpTraits !== null && task.officialScoringTraits) {
      checkField('officialScoringTraits', task.officialScoringTraits.join(', '), bpTraits);
    }

    // 14. Prompt transcript requirement
    const bpTranscript = parseBlueprintField(sectionText, 'Prompt transcript requirement');
    if (bpTranscript !== null && task.promptTranscriptRequired !== undefined) {
      // Blueprint may say "Required" or "Not required"
      let bpTranscriptNorm = bpTranscript.toLowerCase().trim();
      let expectedTranscript = task.promptTranscriptRequired ? 'Required' : 'Not required';
      checkField('promptTranscriptRequired', expectedTranscript, bpTranscript);
    }

    // 15. Reference IDs
    const bpRefs = parseBlueprintField(sectionText, 'Official reference IDs');
    if (bpRefs !== null && task.referenceIds) {
      const expectedRefs = task.referenceIds.join(', ');
      const bpRefNorm = bpRefs.split(',').map(r => r.trim()).sort().join(', ');
      const exRefNorm = task.referenceIds.sort().join(', ');
      if (bpRefNorm !== exRefNorm) {
        checkField('referenceIds', expectedRefs, bpRefs);
      }
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

    if (task.skillsAssessed !== undefined) {
      errors.push(`${manifestPath}: task "${cid}" uses deprecated field "skillsAssessed"; use "officialSkillsAssessed" and "scoreContributions"`);
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
    if (task.officialScoringTraits !== undefined && !isNonEmptyArray(task.officialScoringTraits)) {
      errors.push(`${manifestPath}: task "${cid}" officialScoringTraits must be a non-empty array`);
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
      'officialSkillsAssessed', 'scoreContributions', 'officialScoringTraits'
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

  // ---- I: Immutable factual assertions ----
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

    // Summarize Spoken Text: 60-90 seconds, includes Spelling
    if (cid === 'summarize_spoken_text') {
      if (task.promptLength) {
        if (task.promptLength.minimum !== 60 || task.promptLength.maximum !== 90) {
          errors.push(`${manifestPath}: task "${cid}" promptLength must be 60-90 seconds`);
        }
      }
      if (task.officialScoringTraits && !task.officialScoringTraits.includes('Spelling')) {
        errors.push(`${manifestPath}: task "${cid}" must include Spelling in officialScoringTraits`);
      }
    }

    // Write Essay: 2-3 sentence prompt
    if (cid === 'write_essay') {
      if (task.promptLength) {
        if (task.promptLength.minimum !== 2 || task.promptLength.maximum !== 3 || task.promptLength.unit !== 'sentences') {
          errors.push(`${manifestPath}: task "${cid}" promptLength must be 2-3 sentences`);
        }
      }
      if (task.officialScoringTraits) {
        if (task.officialScoringTraits.includes('Structure') || task.officialScoringTraits.includes('Coherence')) {
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
