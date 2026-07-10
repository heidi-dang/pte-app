import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, resolve } from 'path';

const fixturesDir = resolve(import.meta.dirname, 'fixtures');
const testRoot = resolve(import.meta.dirname, '../../');

// Import validator functions
import {
  resetValidation, getAllErrors, getAllWarnings,
  requiredFile, checkUnresolvedMarkers, checkContent,
  validateTaskManifest, validateOfficialReferenceRegister,
  validateFreeStudentRoutes, validateRekadPhases,
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

// Helper to run a test with a fixture manifest
async function withFixtureManifest(content, fn) {
  const path = join(fixturesDir, 'pte-task-manifest.json');
  writeFixture('pte-task-manifest.json', content);
  try {
    await fn(path);
  } finally {
    try { rmSync(path); } catch {}
  }
}

describe('Documentation Validator', () => {

  describe('validateTaskManifest', () => {
    it('passes valid contract with 22 tasks', async () => {
      const tasks = [];
      const speakingWriting = [
        'read_aloud', 'repeat_sentence', 'describe_image', 'retell_lecture',
        'answer_short_question', 'summarize_group_discussion', 'respond_to_situation',
        'summarize_written_text', 'write_essay'
      ];
      const reading = [
        'reading_writing_fill_blanks', 'reading_multiple_answers', 'reorder_paragraph',
        'reading_fill_blanks', 'reading_single_answer'
      ];
      const listening = [
        'summarize_spoken_text', 'listening_multiple_answers', 'listening_fill_blanks',
        'highlight_correct_summary', 'listening_single_answer', 'select_missing_word',
        'highlight_incorrect_words', 'write_from_dictation'
      ];

      for (const id of speakingWriting) {
        tasks.push({
          canonicalId: id, displayName: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          section: 'Speaking and Writing', currentOfficialTask: true, skillsAssessed: ['Speaking'],
          promptType: 'text', responseType: 'audio', promptLength: 'varies',
          preparationSeconds: 0, responseSeconds: 30, responseTimingMode: 'fixed',
          playbackLimit: 0, recordingLimit: 1, officialScoringType: 'partial-credit',
          officialScoringTraits: ['Content', 'Pronunciation'], practiceMode: 'hints',
          mockMode: 'official', referenceIds: ['source-1'], lastVerifiedAt: '2026-07-10'
        });
      }
      for (const id of reading) {
        tasks.push({
          canonicalId: id, displayName: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          section: 'Reading', currentOfficialTask: true, skillsAssessed: ['Reading'],
          promptType: 'text', responseType: 'text', promptLength: 'varies',
          preparationSeconds: 0, responseSeconds: 0, responseTimingMode: 'section-timed',
          playbackLimit: 0, recordingLimit: 0, officialScoringType: 'partial-credit',
          officialScoringTraits: ['Reading'], practiceMode: 'hints', mockMode: 'official',
          referenceIds: ['source-1'], lastVerifiedAt: '2026-07-10'
        });
      }
      for (const id of listening) {
        tasks.push({
          canonicalId: id, displayName: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          section: 'Listening', currentOfficialTask: true, skillsAssessed: ['Listening'],
          promptType: 'audio', responseType: 'text', promptLength: 'varies',
          preparationSeconds: 0, responseSeconds: 0, responseTimingMode: 'section-timed',
          playbackLimit: 1, recordingLimit: 0, officialScoringType: 'correct-incorrect',
          officialScoringTraits: ['Listening'], practiceMode: 'hints', mockMode: 'official',
          referenceIds: ['source-1'], lastVerifiedAt: '2026-07-10'
        });
      }

      await withFixtureManifest(JSON.stringify(tasks, null, 2), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.equal(getAllErrors().length, 0);
      });
    });

    it('fails when manifest has fewer than 22 tasks', async () => {
      await withFixtureManifest(JSON.stringify([{
        canonicalId: 'read_aloud', displayName: 'Read Aloud', section: 'Speaking and Writing',
        currentOfficialTask: true, skillsAssessed: ['Reading', 'Speaking'],
        promptType: 'text', responseType: 'audio', promptLength: 'up to 60 words',
        preparationSeconds: 30, responseSeconds: 40, responseTimingMode: 'fixed',
        playbackLimit: 0, recordingLimit: 1, officialScoringType: 'partial-credit',
        officialScoringTraits: ['Content', 'Pronunciation', 'Oral fluency'],
        practiceMode: 'hints', mockMode: 'official', referenceIds: ['source-1'],
        lastVerifiedAt: '2026-07-10'
      }]), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().length > 0);
        assert.ok(getAllErrors().some(e => e.includes('22 task records')));
      });
    });

    it('fails on duplicate canonical IDs', async () => {
      const tasks = [];
      for (let i = 0; i < 22; i++) {
        tasks.push({
          canonicalId: i < 2 ? 'duplicate_id' : `task_${i}`,
          displayName: `Task ${i}`, section: 'Listening', currentOfficialTask: true,
          skillsAssessed: ['Listening'], promptType: 'audio', responseType: 'text',
          promptLength: 'varies', preparationSeconds: 0, responseSeconds: 0,
          responseTimingMode: 'section-timed', playbackLimit: 1, recordingLimit: 0,
          officialScoringType: 'correct-incorrect', officialScoringTraits: ['Listening'],
          practiceMode: 'hints', mockMode: 'official', referenceIds: ['source-1'],
          lastVerifiedAt: '2026-07-10'
        });
      }
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('duplicate')));
      });
    });

    it('fails on wrong section count', async () => {
      const tasks = [];
      const allIds = [
        'read_aloud', 'repeat_sentence', 'describe_image', 'retell_lecture',
        'answer_short_question', 'summarize_group_discussion', 'respond_to_situation',
        'summarize_written_text', 'write_essay',
        'reading_writing_fill_blanks', 'reading_multiple_answers', 'reorder_paragraph',
        'reading_fill_blanks', 'reading_single_answer',
        'summarize_spoken_text', 'listening_multiple_answers', 'listening_fill_blanks',
        'highlight_correct_summary', 'listening_single_answer', 'select_missing_word',
        'highlight_incorrect_words', 'write_from_dictation'
      ];
      for (let i = 0; i < 22; i++) {
        tasks.push({
          canonicalId: allIds[i], displayName: `Task ${i}`, section: 'Listening',
          currentOfficialTask: true, skillsAssessed: ['Listening'], promptType: 'audio',
          responseType: 'text', promptLength: 'varies', preparationSeconds: 0,
          responseSeconds: 0, responseTimingMode: 'section-timed', playbackLimit: 1,
          recordingLimit: 0, officialScoringType: 'correct-incorrect',
          officialScoringTraits: ['Listening'], practiceMode: 'hints', mockMode: 'official',
          referenceIds: ['source-1'], lastVerifiedAt: '2026-07-10'
        });
      }
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('Speaking and Writing')));
        assert.ok(getAllErrors().some(e => e.includes('Reading')));
      });
    });

    it('fails on future task wording', async () => {
      const tasks = [];
      const allIds = [
        'read_aloud', 'repeat_sentence', 'describe_image', 'retell_lecture',
        'answer_short_question', 'summarize_group_discussion', 'respond_to_situation',
        'summarize_written_text', 'write_essay',
        'reading_writing_fill_blanks', 'reading_multiple_answers', 'reorder_paragraph',
        'reading_fill_blanks', 'reading_single_answer',
        'summarize_spoken_text', 'listening_multiple_answers', 'listening_fill_blanks',
        'highlight_correct_summary', 'listening_single_answer', 'select_missing_word',
        'highlight_incorrect_words', 'write_from_dictation'
      ];
      for (let i = 0; i < 22; i++) {
        tasks.push({
          canonicalId: allIds[i], displayName: `Task ${i}`, section: 'Listening',
          currentOfficialTask: true, skillsAssessed: ['Listening'], promptType: 'audio',
          responseType: 'text', promptLength: 'varies', preparationSeconds: 0,
          responseSeconds: 0, responseTimingMode: 'section-timed', playbackLimit: 1,
          recordingLimit: 0, officialScoringType: 'correct-incorrect',
          officialScoringTraits: ['Listening'], practiceMode: 'hints', mockMode: 'official',
          referenceIds: ['source-1'], lastVerifiedAt: '2026-07-10',
          extra: 'not yet official'  // should be caught
        });
      }
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('not yet official') || e.includes('future')), `Errors: ${getAllErrors().join(', ')}`);
      });
    });

    it('fails on missing required field', async () => {
      await withFixtureManifest(JSON.stringify([{
        canonicalId: 'read_aloud',
        // missing displayName, section, etc
      }]), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().length > 0);
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
      checkUnresolvedMarkers('test.md', 'This is clean content with no markers');
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
    const validRouteMap = `| /app | Free student, Paid student | App entry |
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
      writeFixture('route-map.md', validRouteMap);
      validateFreeStudentRoutes(path);
      try { rmSync(path); } catch {}
      assert.equal(getAllErrors().length, 0);
    });

    it('fails when free student route is missing', () => {
      resetValidation();
      const path = join(fixturesDir, 'route-map.md');
      writeFixture('route-map.md', `| /app | Paid student only | App |`);
      validateFreeStudentRoutes(path);
      try { rmSync(path); } catch {}
      assert.ok(getAllErrors().length > 0);
    });
  });

  describe('validateAtoZPhases', () => {
    const validTable = `| Phase | Description |
| A | Product contract |
| B | Monorepo, tooling |
| C | Shared contracts |
| D | Database |
| E | Auth |
| F | Design system |
| G | Content |
| H | Course engine |
| I | Question engine |
| J | Reading tasks |
| K | Listening tasks |
| L | Speaking recorder |
| M | Writing tasks |
| N | Scoring engine |
| O | AI evaluation |
| P | Diagnostic |
| Q | Mock engine |
| R | Dashboard |
| S | Portals |
| T | Payments |
| U | Content factory |
| V | Calibration |
| W | Notifications |
| X | QA gate |
| Y | Deployment |
| Z | Launch |`;

    it('passes with all A-Z phases', () => {
      resetValidation();
      const path = join(fixturesDir, 'README.md');
      writeFixture('README.md', validTable);
      validateRekadPhases(path);
      try { rmSync(path); } catch {}
      assert.equal(getAllErrors().length, 0);
    });

    it('fails when phase Z is missing', () => {
      resetValidation();
      const path = join(fixturesDir, 'README.md');
      writeFixture('README.md', `| Phase | Description |
| A | Product contract |
| B | Monorepo |`);
      validateRekadPhases(path);
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
      // No error should be added for .gitkeep
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
    const validRegister = `### Source 1
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
- Content covered: score guide`;

    it('passes with all required source URLs', () => {
      resetValidation();
      const path = join(fixturesDir, 'register.md');
      writeFixture('register.md', validRegister);
      validateOfficialReferenceRegister(path);
      try { rmSync(path); } catch {}
      assert.equal(getAllErrors().length, 0);
    });

    it('fails when required source URL is missing', () => {
      resetValidation();
      const path = join(fixturesDir, 'register.md');
      writeFixture('register.md', `### Source
- Source URL: https://example.com
- Publisher: Unknown
- Last verified date: 2026-07-10
- Content covered: nothing`);
      validateOfficialReferenceRegister(path);
      try { rmSync(path); } catch {}
      assert.ok(getAllErrors().length > 0);
    });
  });
});
