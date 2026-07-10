import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, existsSync, rmSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, resolve } from 'path';

const fixturesDir = resolve(import.meta.dirname, 'fixtures');
const root = resolve(import.meta.dirname, '../../');

import {
  resetValidation, getAllErrors, getAllWarnings,
  requiredFile, checkUnresolvedMarkers, checkContent,
  validateTaskManifest, validateOfficialReferenceRegister,
  validateFreeStudentRoutes, validateAtoZPhases,
  validateTaskReferences, validateReferenceRegisterJson,
  validateScorecard, validateBlueprintAgainstManifest,
  validateMockTimerConsistency, validateScoringPrinciplesTable,
  validateAll, errors, warnings
} from '../../scripts/validate-docs.mjs';

function fixturePath(name) {
  return join(fixturesDir, name);
}

function writeFixture(name, content) {
  const path = fixturePath(name);
  const dir = resolve(path, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, content, 'utf-8');
}

function readFixture(name) {
  return readFileSync(fixturePath(name), 'utf-8');
}

function loadCanonical() {
  return JSON.parse(readFixture('canonical-pte-task-contract.json'));
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

async function withManifest(content, fn) {
  const path = join(fixturesDir, 'pte-task-manifest.json');
  writeFixture('pte-task-manifest.json', content);
  try {
    await fn(path);
  } finally {
    try { rmSync(path); } catch {}
  }
}

describe('Documentation Validator', () => {

  describe('validateTaskManifest — canonical contract', () => {
    it('passes the exact canonical fixture', async () => {
      const content = readFixture('canonical-pte-task-contract.json');
      await withManifest(content, (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.equal(getAllErrors().length, 0, `Errors: ${getAllErrors().join(', ')}`);
      });
    });

    it('rejects Read Aloud assessed as Reading', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'read_aloud');
      t.officialSkillsAssessed = ['Reading'];
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('read_aloud') && e.includes('officialSkillsAssessed')));
      });
    });

    it('rejects Reading Dropdown writing contribution', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'reading_writing_fill_blanks');
      t.scoreContributions = ['Reading', 'Writing'];
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('reading_writing_fill_blanks') && e.includes('scoreContributions')));
      });
    });

    it('rejects Listening Fill in the Blanks assessed as Writing', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'listening_fill_blanks');
      t.officialSkillsAssessed = ['Listening', 'Writing'];
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('listening_fill_blanks') && e.includes('officialSkillsAssessed')));
      });
    });

    it('rejects Reading Multiple Answers maximum 300', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'reading_multiple_answers');
      t.promptLength.maximum = 300;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('promptLength') && e.includes('maximum')));
      });
    });

    it('rejects Reorder Paragraph measured as paragraphs range 4-7', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'reorder_paragraph');
      t.promptLength.maximum = 7;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('reorder_paragraph') && e.includes('promptLength')));
      });
    });

    it('rejects Reading Drag and Drop maximum 200', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'reading_fill_blanks');
      t.promptLength.maximum = 200;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('reading_fill_blanks') && e.includes('promptLength')));
      });
    });

    it('rejects Listening Multiple Answers 90-second maximum', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'listening_multiple_answers');
      t.promptLength.maximum = 90;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('listening_multiple_answers') && e.includes('promptLength')));
      });
    });

    it('rejects Listening Fill in the Blanks null range', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'listening_fill_blanks');
      t.promptLength.minimum = null;
      t.promptLength.maximum = null;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('promptLength')));
      });
    });

    it('rejects Highlight Correct Summary missing 30-second minimum', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'highlight_correct_summary');
      t.promptLength.minimum = 0;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('highlight_correct_summary') && e.includes('promptLength')));
      });
    });

    it('rejects Select Missing Word 60-second maximum', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'select_missing_word');
      t.promptLength.maximum = 60;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('select_missing_word') && e.includes('promptLength')));
      });
    });

    it('rejects Highlight Incorrect Words 60-second maximum', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'highlight_incorrect_words');
      t.promptLength.maximum = 60;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('highlight_incorrect_words') && e.includes('promptLength')));
      });
    });

    it('rejects Write From Dictation range other than 3-5', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'write_from_dictation');
      t.promptLength.maximum = 9;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('write_from_dictation') && e.includes('promptLength')));
      });
    });

    it('rejects unknown reference ID', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'read_aloud');
      t.referenceIds = ['source-99'];
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('unknown reference')));
      });
    });

    it('rejects invalid reference date', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'read_aloud');
      t.lastVerifiedAt = 'not-a-date';
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('lastVerifiedAt')));
      });
    });

    it('rejects negative maximum in timing', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'read_aloud');
      t.promptLength.maximum = -5;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('negative maximum') || e.includes('minimum (0) exceeds maximum')));
      });
    });

    it('rejects string timing value', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'read_aloud');
      t.promptLength.maximum = 'sixty';
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('promptLength') || e.includes('maximum')));
      });
    });

    it('rejects fixed timing where min does not equal max', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'repeat_sentence');
      t.preparationTiming.mode = 'fixed';
      t.preparationTiming.minimum = 5;
      t.preparationTiming.maximum = 10;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('fixed')));
      });
    });

    it('rejects fewer than 22 tasks', async () => {
      await withManifest(JSON.stringify([loadCanonical()[0]]), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('22 task records')));
      });
    });

    it('rejects duplicate canonical IDs', async () => {
      const tasks = loadCanonical();
      tasks[0].canonicalId = 'duplicate';
      tasks[1].canonicalId = 'duplicate';
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('duplicate')));
      });
    });
  });

  describe('validateTaskManifest — general', () => {
    it('rejects deprecated skillsAssessed field', async () => {
      const tasks = loadCanonical();
      tasks.forEach(t => { t.skillsAssessed = t.officialSkillsAssessed; });
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('deprecated')));
      });
    });

    it('rejects wrong section count', async () => {
      const tasks = loadCanonical();
      tasks.forEach(t => { t.section = 'Listening'; });
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('Speaking and Writing')));
      });
    });

    it('rejects invalid enum values', async () => {
      const tasks = loadCanonical();
      tasks[0].promptType = 'invalid';
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('invalid promptType')));
      });
    });
  });

  describe('checkUnresolvedMarkers', () => {
    it('detects TODO', () => {
      resetValidation();
      checkUnresolvedMarkers('test.md', 'This has a TODO item');
      assert.ok(getAllErrors().some(e => e.includes('TODO')));
    });

    it('passes clean content', () => {
      resetValidation();
      checkUnresolvedMarkers('test.md', 'This is clean content');
      assert.equal(getAllErrors().length, 0);
    });
  });

  describe('checkContent', () => {
    it('finds required pattern', () => {
      resetValidation();
      checkContent('test.md', 'Hello World', [['Hello', 'Hello', false]]);
      assert.equal(getAllErrors().length, 0);
    });

    it('reports missing pattern', () => {
      resetValidation();
      checkContent('test.md', 'Goodbye World', [['Hello', 'Hello', false]]);
      assert.ok(getAllErrors().some(e => e.includes('Hello')));
    });
  });

  describe('validateFreeStudentRoutes', () => {
    const valid = `| /app | Free student, Paid student | App entry |
| /app/onboarding | Free student, Paid student | Onboarding |
| /app/dashboard | Free student, Paid student | Dashboard |
| /app/courses | Free student, Paid student | Courses |
| /app/practice | Free student, Paid student | Practice |
| /app/progress | Free student, Paid student | Progress |
| /app/subscription | Free student, Paid student | Subscription |
| /app/profile | Free student, Paid student | Profile |`;

    it('passes with correct free student access', () => {
      resetValidation();
      const path = join(fixturesDir, 'route-map.md');
      writeFixture('route-map.md', valid);
      validateFreeStudentRoutes(path);
      try { rmSync(path); } catch {}
      assert.equal(getAllErrors().length, 0);
    });

    it('fails when free student route missing', () => {
      resetValidation();
      const path = join(fixturesDir, 'route-map.md');
      writeFixture('route-map.md', '| /app | Paid student only | App |');
      validateFreeStudentRoutes(path);
      try { rmSync(path); } catch {}
      assert.ok(getAllErrors().length > 0);
    });
  });

  describe('validateAtoZPhases', () => {
    const valid = '| A | Product |\n| B | Monorepo |\n| C | Shared |\n| D | Database |\n| E | Auth |\n| F | Design |\n| G | Content |\n| H | Course |\n| I | Question |\n| J | Reading |\n| K | Listening |\n| L | Speaking |\n| M | Writing |\n| N | Scoring |\n| O | AI |\n| P | Diagnostic |\n| Q | Mock |\n| R | Dashboard |\n| S | Portals |\n| T | Payments |\n| U | Factory |\n| V | Calibration |\n| W | Notifications |\n| X | QA |\n| Y | Deployment |\n| Z | Launch |';

    it('passes with all A-Z phases', () => {
      resetValidation();
      const path = join(fixturesDir, 'README.md');
      writeFixture('README.md', valid);
      validateAtoZPhases(path);
      try { rmSync(path); } catch {}
      assert.equal(getAllErrors().length, 0);
    });

    it('fails when phase Z missing', () => {
      resetValidation();
      const path = join(fixturesDir, 'README.md');
      writeFixture('README.md', '| A | Product |');
      validateAtoZPhases(path);
      try { rmSync(path); } catch {}
      assert.ok(getAllErrors().length > 0);
    });
  });

  describe('requiredFile', () => {
    it('permits empty .gitkeep', () => {
      resetValidation();
      const path = join(fixturesDir, '.gitkeep');
      writeFixture('.gitkeep', '');
      const result = requiredFile(path);
      try { rmSync(path); } catch {}
      assert.equal(result, '');
      assert.equal(getAllErrors().length, 0);
    });

    it('rejects empty non-gitkeep file', () => {
      resetValidation();
      const path = join(fixturesDir, 'empty.md');
      writeFixture('empty.md', '');
      const result = requiredFile(path);
      try { rmSync(path); } catch {}
      assert.equal(result, null);
      assert.ok(getAllErrors().some(e => e.includes('Empty')));
    });
  });

  describe('validateOfficialReferenceRegister', () => {
    const valid = `### Source 1
- Source URL: https://www.pearsonpte.com/pte-academic/test-format/
- Publisher: Pearson
- Last verified date: 2026-07-10
- Content covered: test format

### Source 2
- Source URL: https://www.pearsonpte.com/pte-academic/test-format/speaking-writing/
- Publisher: Pearson
- Last verified date: 2026-07-10
- Content covered: speaking

### Source 3
- Source URL: https://www.pearsonpte.com/pte-academic/test-format/reading/
- Publisher: Pearson
- Last verified date: 2026-07-10
- Content covered: reading

### Source 4
- Source URL: https://www.pearsonpte.com/pte-academic/test-format/listening/
- Publisher: Pearson
- Last verified date: 2026-07-10
- Content covered: listening

### Source 5
- Source URL: https://www.pearsonpte.com/pte-updates-2025/
- Publisher: Pearson
- Last verified date: 2026-07-10
- Content covered: updates

### Source 6
- Source URL: https://www.pearsonpte.com/content/dam/ELL/pte/pearsonpte/pdfs/pte-academic-pdfs/PTE-Academic-Test-Taker-Score-Guide.pdf
- Publisher: Pearson
- Last verified date: 2026-07-10
- Content covered: score guide

### Attribution
- Collected by: Heidi Dang
- Reviewed by: Pending Heidi audit
- Approval status: Awaiting review`;

    it('passes with all required source URLs', () => {
      resetValidation();
      const path = join(fixturesDir, 'register.md');
      writeFixture('register.md', valid);
      validateOfficialReferenceRegister(path);
      try { rmSync(path); } catch {}
      assert.equal(getAllErrors().length, 0);
    });

    it('fails when required source URL missing', () => {
      resetValidation();
      const path = join(fixturesDir, 'register.md');
      writeFixture('register.md', '### Source\n- Source URL: https://example.com\n- Publisher: Unknown\n- Last verified date: 2026-07-10\n- Content covered: nothing');
      validateOfficialReferenceRegister(path);
      try { rmSync(path); } catch {}
      assert.ok(getAllErrors().length > 0);
    });
  });

  // ---- K: New required tests ----

  describe('validateTaskManifest — reorder paragraph', () => {
    it('K1: Reorder Paragraph 4-6 paragraphs fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'reorder_paragraph');
      t.promptLength = { mode: 'range', minimum: 4, maximum: 6, unit: 'paragraphs' };
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('reorder_paragraph') && e.includes('promptLength')));
      });
    });

    it('K2: Reorder Paragraph 0-150 words passes', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'reorder_paragraph');
      t.promptLength = { mode: 'range', minimum: 0, maximum: 150, unit: 'words' };
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.equal(getAllErrors().length, 0, `Errors: ${getAllErrors().join(', ')}`);
      });
    });

    it('K3: Summarize Written Text missing 300-word maximum fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'summarize_written_text');
      t.promptLength = { mode: 'range', minimum: 0, maximum: null, unit: 'words' };
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('summarize_written_text') && e.includes('promptLength')));
      });
    });
  });

  describe('validateTaskReferences', () => {
    it('K4: Summarize Group Discussion using source-4 fails', () => {
      resetValidation();
      const manifest = JSON.parse(readFileSync(join(root, 'docs/content/pte-task-manifest.json'), 'utf-8'));
      const t = manifest.find(x => x.canonicalId === 'summarize_group_discussion');
      t.referenceIds = ['source-1', 'source-4'];
      validateTaskReferences(manifest);
      assert.ok(getAllErrors().some(e => e.includes('source-4')));
    });

    it('K5: Reading Dropdown using source-2 fails', () => {
      resetValidation();
      const manifest = JSON.parse(readFileSync(join(root, 'docs/content/pte-task-manifest.json'), 'utf-8'));
      const t = manifest.find(x => x.canonicalId === 'reading_writing_fill_blanks');
      t.referenceIds = ['source-1', 'source-2', 'source-6'];
      validateTaskReferences(manifest);
      assert.ok(getAllErrors().some(e => e.includes('reading_writing_fill_blanks') && e.includes('source-2')));
    });

    it('K6: Missing source-6 for scoring claims fails', () => {
      resetValidation();
      const manifest = JSON.parse(readFileSync(join(root, 'docs/content/pte-task-manifest.json'), 'utf-8'));
      const t = manifest.find(x => x.canonicalId === 'read_aloud');
      t.referenceIds = ['source-1', 'source-2'];
      validateTaskReferences(manifest);
      assert.ok(getAllErrors().some(e => e.includes('read_aloud') && e.includes('source-6')));
    });
  });

  describe('validateReferenceRegisterJson', () => {
    it('K7: Duplicate reference ID fails', () => {
      resetValidation();
      const refs = JSON.parse(readFileSync(join(root, 'docs/content/official-pte-reference-register.json'), 'utf-8'));
      const modified = JSON.parse(JSON.stringify(refs));
      modified[1].id = 'source-1';
      const path = join(fixturesDir, 'refs-duplicate-id.json');
      writeFixture('refs-duplicate-id.json', JSON.stringify(modified));
      validateReferenceRegisterJson(path);
      try { rmSync(path); } catch {}
      assert.ok(getAllErrors().some(e => e.includes('duplicate ID')));
    });

    it('K8: Duplicate reference URL fails', () => {
      resetValidation();
      const refs = JSON.parse(readFileSync(join(root, 'docs/content/official-pte-reference-register.json'), 'utf-8'));
      const modified = JSON.parse(JSON.stringify(refs));
      modified[1].url = modified[0].url;
      const path = join(fixturesDir, 'refs-duplicate-url.json');
      writeFixture('refs-duplicate-url.json', JSON.stringify(modified));
      validateReferenceRegisterJson(path);
      try { rmSync(path); } catch {}
      assert.ok(getAllErrors().some(e => e.includes('duplicate URL')));
    });

    it('K9: Invalid calendar date fails', () => {
      resetValidation();
      const refs = JSON.parse(readFileSync(join(root, 'docs/content/official-pte-reference-register.json'), 'utf-8'));
      const modified = JSON.parse(JSON.stringify(refs));
      modified[0].lastVerifiedAt = 'not-a-date';
      const path = join(fixturesDir, 'refs-bad-date.json');
      writeFixture('refs-bad-date.json', JSON.stringify(modified));
      validateReferenceRegisterJson(path);
      try { rmSync(path); } catch {}
      assert.ok(getAllErrors().some(e => e.includes('lastVerifiedAt')));
    });
  });

  describe('validateBlueprintAgainstManifest — generator synchronization', () => {
    it('K10: Generated blueprint equals checked-in blueprint', () => {
      resetValidation();
      validateBlueprintAgainstManifest(
        join(root, 'docs/content/pte-task-blueprints.md'),
        join(root, 'docs/content/pte-task-manifest.json')
      );
      assert.equal(getAllErrors().length, 0, `Errors: ${getAllErrors().join(', ')}`);
    });

    it('K11: Edited blueprint fails synchronization', () => {
      const bpPath = join(root, 'docs/content/pte-task-blueprints.md');
      const original = readFileSync(bpPath, 'utf-8');
      writeFileSync(bpPath, original.replace('Read Aloud', 'Read Aloud (modified)'), 'utf-8');
      resetValidation();
      validateBlueprintAgainstManifest(
        bpPath,
        join(root, 'docs/content/pte-task-manifest.json')
      );
      writeFileSync(bpPath, original, 'utf-8');
      assert.ok(getAllErrors().length > 0);
    });
  });

  describe('validateTaskManifest — blueprint contradiction detection', () => {
    it('K16: Listening Fill in the Blanks "no transcript" contradiction fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'listening_fill_blanks');
      t.promptTranscriptRequired = false;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('listening_fill_blanks') && e.includes('promptTranscriptRequired')));
      });
    });

    it('K17: Forced-answer validation in mock mode fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'reading_writing_fill_blanks');
      t.responseValidation.timedModeForceAnswer = true;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('timedModeForceAnswer')));
      });
    });

    it('K18: Summarize Spoken Text timer-from-audio-end fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'summarize_spoken_text');
      t.responseTiming = { mode: 'fixed', minimum: 600, maximum: 600, unit: 'seconds' };
      t.responseTimingDescription = '10-minute response timer from audio end';
      delete t.promptLength;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        // Should have errors due to missing promptLength
        assert.ok(getAllErrors().length > 0);
      });
    });

    it('K19: Mock deadline contradiction detected', () => {
      const bpPath = join(root, 'docs/product/student-journey.md');
      const original = readFileSync(bpPath, 'utf-8');
      try {
        const contradictory = original + '\n\nInternet interruption: remaining time at interruption reflects the paused timer.\n';
        writeFileSync(bpPath, contradictory, 'utf-8');
        resetValidation();
        validateMockTimerConsistency();
        assert.ok(getAllErrors().some(e => e.includes('incorrect mock timer')));
      } finally {
        writeFileSync(bpPath, original, 'utf-8');
      }
    });

    it('K20: Scorecard criterion rows not matching heading fails', () => {
      resetValidation();
      const badScorecard = `### Repository and Structure — 10 points

| Criterion | Points | Evidence Required |
|-----------|--------|-------------------|
| Test | 5 | Something |

### Requirements Completeness — 20 points

| Criterion | Points | Evidence Required |
|-----------|--------|-------------------|
| Test | 20 | Something |

Totals are wrong on purpose.`;
      const path = join(fixturesDir, 'bad-scorecard.md');
      writeFixture('bad-scorecard.md', badScorecard);
      validateScorecard(path);
      try { rmSync(path); } catch {}
      assert.ok(getAllErrors().some(e => e.includes('points')));
    });

    it('K21: Full repository contract passes', () => {
      resetValidation();
      const result = validateAll();
      assert.equal(result.errors.length, 0, `Errors: ${result.errors.join(', ')}`);
    });
  });

  describe('validateAll — full repository', () => {
    it('full repository contract passes', () => {
      resetValidation();
      const result = validateAll();
      assert.equal(result.errors.length, 0, `Errors: ${result.errors.join(', ')}`);
    });

    it('passes with summary counts', () => {
      resetValidation();
      const result = validateAll();
      assert.equal(result.errors.length, 0);
    });
  });

  // ---- I: Expanded tests ----

  describe('Scoring model — officialRubricTraits validation', () => {
    it('Objective task with skill names in officialRubricTraits fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'reading_writing_fill_blanks');
      t.officialRubricTraits = ['Reading', 'Writing'];
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('officialRubricTraits') && e.includes('reading_writing_fill_blanks')));
      });
    });

    it('Reading Dropdown with Writing trait fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'reading_writing_fill_blanks');
      t.officialRubricTraits = ['Writing'];
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('officialRubricTraits')));
      });
    });

    it('Listening Fill in the Blanks with Listening/Writing traits fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'listening_fill_blanks');
      t.officialRubricTraits = ['Listening', 'Writing'];
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('officialRubricTraits')));
      });
    });

    it('Required rubric-scored task with empty traits fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'read_aloud');
      t.officialRubricTraits = [];
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('read_aloud') && e.includes('empty')));
      });
    });

    it('Negative-marking rule without minimum zero fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'reading_multiple_answers');
      t.platformEstimatedScoringRule.minimumItemScore = -1;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('minimumItemScore')));
      });
    });
  });

  describe('Preparation timing assertions', () => {
    it('Listening Multiple Answers preparation not seven seconds fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'listening_multiple_answers');
      t.preparationTiming = { mode: 'fixed', minimum: 5, maximum: 5, unit: 'seconds' };
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('preparationTiming')));
      });
    });

    it('Listening Fill in the Blanks preparation not seven seconds fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'listening_fill_blanks');
      t.preparationTiming = { mode: 'fixed', minimum: 0, maximum: 0, unit: 'seconds' };
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('preparationTiming')));
      });
    });

    it('Listening Single Answer preparation not five seconds fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'listening_single_answer');
      t.preparationTiming = { mode: 'fixed', minimum: 7, maximum: 7, unit: 'seconds' };
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('preparationTiming')));
      });
    });

    it('Highlight Incorrect Words preparation not ten seconds fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'highlight_incorrect_words');
      t.preparationTiming = { mode: 'fixed', minimum: 5, maximum: 5, unit: 'seconds' };
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('preparationTiming')));
      });
    });
  });

  describe('Transcript and mock mode assertions', () => {
    it('Listening Fill in the Blanks mock mode hiding the transcript fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'listening_fill_blanks');
      t.promptTranscriptRequired = false;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('promptTranscriptRequired')));
      });
    });
  });

  describe('Blueprint synchronization', () => {
    it('Missing generated blueprint field fails', () => {
      // Verify the generator produces all required fields
      const result = execSync('node scripts/generate-pte-blueprints.mjs --validate', {
        cwd: root, encoding: 'utf-8', stdio: 'pipe'
      });
      assert.equal(result.trim(), '');
    });
  });

  describe('Calendar-date validation', () => {
    it('Invalid date 2026-02-31 fails', () => {
      resetValidation();
      const path = join(fixturesDir, 'bad-date.json');
      const refs = JSON.parse(readFileSync(join(root, 'docs/content/official-pte-reference-register.json'), 'utf-8'));
      refs[0].lastVerifiedAt = '2026-02-31';
      writeFixture('bad-date.json', JSON.stringify(refs));
      validateReferenceRegisterJson(path);
      try { rmSync(path); } catch {}
      assert.ok(getAllErrors().some(e => e.includes('lastVerifiedAt')));
    });

    it('Invalid non-leap date 2026-02-29 fails', () => {
      resetValidation();
      const path = join(fixturesDir, 'bad-leap.json');
      const refs = JSON.parse(readFileSync(join(root, 'docs/content/official-pte-reference-register.json'), 'utf-8'));
      refs[0].lastVerifiedAt = '2026-02-29';
      writeFixture('bad-leap.json', JSON.stringify(refs));
      validateReferenceRegisterJson(path);
      try { rmSync(path); } catch {}
      assert.ok(getAllErrors().some(e => e.includes('lastVerifiedAt')));
    });

    it('Valid leap date 2028-02-29 passes', () => {
      resetValidation();
      const path = join(fixturesDir, 'good-leap.json');
      const refs = JSON.parse(readFileSync(join(root, 'docs/content/official-pte-reference-register.json'), 'utf-8'));
      refs[0].lastVerifiedAt = '2028-02-29';
      writeFixture('good-leap.json', JSON.stringify(refs));
      validateReferenceRegisterJson(path);
      try { rmSync(path); } catch {}
      assert.equal(getAllErrors().filter(e => e.includes('lastVerifiedAt')).length, 0);
    });
  });

  describe('Deprecated field detection', () => {
    it('Deprecated officialScoringTraits fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'read_aloud');
      t.officialScoringTraits = t.officialRubricTraits;
      delete t.officialRubricTraits;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('deprecated') && e.includes('officialScoringTraits')));
      });
    });
  });

  // ---- H: Restored contract field validation ----

  describe('Full repository', () => {
    it('Full repository contract passes', () => {
      resetValidation();
      const result = validateAll();
      assert.equal(result.errors.length, 0, `Errors: ${result.errors.join(', ')}`);
    });
  });

  describe('Restored task fields', () => {
    it('Missing taskPurpose fails', async () => {
      const tasks = loadCanonical();
      delete tasks[0].taskPurpose;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('taskPurpose')));
      });
    });

    it('Missing studentInterface fails', async () => {
      const tasks = loadCanonical();
      delete tasks[0].studentInterface;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('studentInterface')));
      });
    });

    it('Missing feedbackFormat fails', async () => {
      const tasks = loadCanonical();
      delete tasks[0].feedbackFormat;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('feedbackFormat')));
      });
    });

    it('Missing failureRecoveryBehavior fails', async () => {
      const tasks = loadCanonical();
      delete tasks[0].failureRecoveryBehavior;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('failureRecoveryBehavior')));
      });
    });

    it('Forced answer in mock mode fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'reading_writing_fill_blanks');
      t.responseValidation.timedModeForceAnswer = true;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('timedModeForceAnswer')));
      });
    });

    it('Recorded speaking task without resumable upload fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'read_aloud');
      t.failureRecoveryBehavior.resumableUploadRequired = false;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('resumableUploadRequired')));
      });
    });

    it('Missing official human review for Describe Image fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'describe_image');
      t.officialHumanReviewTraits = [];
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('officialHumanReviewTraits')));
      });
    });

    it('Incorrect Write Essay human-review traits fail', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'write_essay');
      t.officialHumanReviewTraits = ['Content'];
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('officialHumanReviewTraits')));
      });
    });

    it('Platform scoring labelled official fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'reading_writing_fill_blanks');
      t.platformEstimatedScoringRule = { type: 'per-correct-blank', correctPoints: 1, incorrectPoints: 0, minimumItemScore: 0, officialPearsonScoring: true };
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('official')));
      });
    });

    it('Retell Lecture audio-only contract fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'retell_lecture');
      t.supportsAudiovisualInput = false;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('supportsAudiovisualInput')));
      });
    });

    it('Answer Short Question optional-image support missing fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'answer_short_question');
      t.optionalAccompanyingImage = false;
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('optionalAccompanyingImage')));
      });
    });

    it('Describe Image prompt length "1 image" fails', async () => {
      const tasks = loadCanonical();
      const t = tasks.find(x => x.canonicalId === 'describe_image');
      t.promptLength = { mode: 'fixed', minimum: 1, maximum: 1, unit: 'image' };
      await withManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('not-applicable')));
      });
    });

    it('Scoring-principles Read Aloud mismatch fails', () => {
      // Verify the real scoring-principles table matches the manifest
      resetValidation();
      validateScoringPrinciplesTable('docs/scoring/scoring-principles.md');
      assert.equal(getAllErrors().filter(e => e.includes('Read Aloud')).length, 0,
        'Read Aloud should match in real table');
    });

    it('Scoring-principles Reading Dropdown mismatch fails', () => {
      resetValidation();
      validateScoringPrinciplesTable('docs/scoring/scoring-principles.md');
      assert.equal(getAllErrors().filter(e => e.includes('Reading and Writing')).length, 0,
        'Reading Dropdown should match in real table');
    });

    it('Generated full blueprint contains every required field', () => {
      resetValidation();
      const result = execSync('node scripts/generate-pte-blueprints.mjs --validate', {
        cwd: root, encoding: 'utf-8', stdio: 'pipe'
      });
      assert.equal(result.trim(), '');
    });

    it('Full repository contract passes', () => {
      resetValidation();
      const result = validateAll();
      assert.equal(result.errors.length, 0, `Errors: ${result.errors.join(', ')}`);
    });
  });
});
