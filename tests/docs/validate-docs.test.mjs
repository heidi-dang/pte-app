import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, existsSync, rmSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const fixturesDir = resolve(import.meta.dirname, 'fixtures');
const root = resolve(import.meta.dirname, '../../');

import {
  resetValidation, getAllErrors, getAllWarnings,
  requiredFile, checkUnresolvedMarkers, checkContent,
  validateTaskManifest, validateOfficialReferenceRegister,
  validateFreeStudentRoutes, validateAtoZPhases,
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
});
