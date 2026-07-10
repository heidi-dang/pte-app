import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, resolve } from 'path';

const fixturesDir = resolve(import.meta.dirname, 'fixtures');
const testRoot = resolve(import.meta.dirname, '../../');

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

async function withFixtureManifest(content, fn) {
  const path = join(fixturesDir, 'pte-task-manifest.json');
  writeFixture('pte-task-manifest.json', content);
  try {
    await fn(path);
  } finally {
    try { rmSync(path); } catch {}
  }
}

const defaultPrompts = {
  read_aloud: { text: 'up to 60 words' },
  repeat_sentence: { audio: '3 to 9 seconds' },
  describe_image: { image: 'single image' },
  retell_lecture: { audio: 'up to 90 seconds' },
  answer_short_question: { audio: '3 to 9 seconds' },
  summarize_group_discussion: { audio: 'up to 3 minutes' },
  respond_to_situation: { text: 'up to 60 words' },
  summarize_written_text: { text: 'reading passage' },
  write_essay: { text: '2 to 3 sentences' },
  reading_writing_fill_blanks: { text: 'passage with blanks' },
  reading_multiple_answers: { text: 'reading passage' },
  reorder_paragraph: { text: 'multiple paragraphs' },
  reading_fill_blanks: { text: 'passage with blanks' },
  reading_single_answer: { text: 'reading passage' },
  summarize_spoken_text: { audio: '60 to 90 seconds' },
  listening_multiple_answers: { audio: 'recording' },
  listening_fill_blanks: { audio: 'recording with transcript' },
  highlight_correct_summary: { audio: 'recording' },
  listening_single_answer: { audio: 'recording' },
  select_missing_word: { audio: 'recording with beep' },
  highlight_incorrect_words: { audio: 'recording with transcript' },
  write_from_dictation: { audio: '3 to 5 seconds' }
};

function makeTask(id, overrides = {}) {
  const base = {
    canonicalId: id,
    displayName: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    section: 'Listening',
    currentOfficialTask: true,
    officialSkillsAssessed: ['Listening'],
    scoreContributions: ['Listening'],
    promptType: 'audio',
    responseType: 'text',
    promptLength: { mode: 'range', minimum: null, maximum: null, unit: 'seconds' },
    preparationTiming: { mode: 'fixed', minimum: 0, maximum: 0, unit: 'seconds' },
    responseTiming: { mode: 'fixed', minimum: 30, maximum: 30, unit: 'seconds' },
    playbackLimit: 1,
    recordingLimit: 0,
    officialScoringType: 'partial-credit',
    officialScoringTraits: ['Content'],
    promptTranscriptRequired: false,
    postAttemptTranscriptAvailable: true,
    practiceMode: 'hints',
    mockMode: 'official',
    referenceIds: ['source-1'],
    lastVerifiedAt: '2026-07-10'
  };
  Object.assign(base, overrides);
  return base;
}

const ALL_IDS = [
  'read_aloud', 'repeat_sentence', 'describe_image', 'retell_lecture',
  'answer_short_question', 'summarize_group_discussion', 'respond_to_situation',
  'summarize_written_text', 'write_essay',
  'reading_writing_fill_blanks', 'reading_multiple_answers', 'reorder_paragraph',
  'reading_fill_blanks', 'reading_single_answer',
  'summarize_spoken_text', 'listening_multiple_answers', 'listening_fill_blanks',
  'highlight_correct_summary', 'listening_single_answer', 'select_missing_word',
  'highlight_incorrect_words', 'write_from_dictation'
];

function makeValidTask(id) {
  const defaults = {
    section: 'Listening',
    officialSkillsAssessed: ['Listening'],
    scoreContributions: ['Listening'],
    promptType: 'audio',
    responseType: 'text',
    promptLength: { mode: 'range', minimum: null, maximum: null, unit: 'seconds' },
    responseTiming: { mode: 'section-timed', minimum: null, maximum: null, unit: 'seconds' },
    officialScoringTraits: ['Listening'],
    promptTranscriptRequired: false,
    mockMode: 'official'
  };
  if (['read_aloud', 'repeat_sentence', 'describe_image', 'retell_lecture',
    'answer_short_question', 'summarize_group_discussion', 'respond_to_situation',
    'summarize_written_text', 'write_essay'].includes(id)) {
    defaults.section = 'Speaking and Writing';
    defaults.officialSkillsAssessed = ['Reading', 'Speaking'];
    defaults.scoreContributions = ['Reading', 'Speaking'];
    defaults.promptType = 'text';
    defaults.responseType = 'audio';
    defaults.responseTiming = { mode: 'fixed', minimum: 40, maximum: 40, unit: 'seconds' };
    defaults.recordingLimit = 1;
    defaults.playbackLimit = 0;
    defaults.officialScoringTraits = ['Content', 'Pronunciation'];
  }
  if (['reading_writing_fill_blanks', 'reading_multiple_answers', 'reorder_paragraph',
    'reading_fill_blanks', 'reading_single_answer'].includes(id)) {
    defaults.section = 'Reading';
    defaults.officialSkillsAssessed = ['Reading'];
    defaults.scoreContributions = ['Reading'];
    defaults.promptType = 'text';
    defaults.responseType = 'text';
    defaults.officialScoringTraits = ['Reading'];
  }
  if (id === 'write_essay') {
    defaults.officialSkillsAssessed = ['Writing'];
    defaults.scoreContributions = ['Writing'];
    defaults.promptLength = { mode: 'range', minimum: 2, maximum: 3, unit: 'sentences' };
    defaults.officialScoringTraits = ['Content', 'Form', 'Development, Structure and Coherence', 'Grammar', 'General Linguistic Range', 'Vocabulary Range', 'Spelling'];
  }
  if (id === 'respond_to_situation') {
    defaults.promptType = 'text-and-audio';
    defaults.mockMode = 'text and audio both required';
  }
  if (id === 'summarize_spoken_text') {
    defaults.promptLength = { mode: 'range', minimum: 60, maximum: 90, unit: 'seconds' };
    defaults.responseTiming = { mode: 'fixed', minimum: 600, maximum: 600, unit: 'seconds' };
    defaults.responseTimingDescription = 'Ten minutes total includes listening and writing';
    defaults.officialScoringTraits = ['Content', 'Form', 'Grammar', 'Vocabulary', 'Spelling'];
  }
  if (id === 'listening_fill_blanks') {
    defaults.promptTranscriptRequired = true;
  }
  if (id === 'highlight_incorrect_words') {
    defaults.promptTranscriptRequired = true;
  }
  if (id === 'write_from_dictation') {
    defaults.promptLength = { mode: 'range', minimum: 3, maximum: 5, unit: 'seconds' };
  }
  return makeTask(id, defaults);
}

describe('Documentation Validator', () => {

  describe('validateTaskManifest', () => {
    it('passes valid contract with 22 tasks', async () => {
      const tasks = ALL_IDS.map(makeValidTask);
      await withFixtureManifest(JSON.stringify(tasks, null, 2), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.equal(getAllErrors().length, 0, `Errors: ${getAllErrors().join(', ')}`);
      });
    });

    it('fails when manifest has fewer than 22 tasks', async () => {
      await withFixtureManifest(JSON.stringify([makeTask('read_aloud')]), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().length > 0);
        assert.ok(getAllErrors().some(e => e.includes('22 task records')));
      });
    });

    it('fails on duplicate canonical IDs', async () => {
      const tasks = [];
      for (let i = 0; i < 22; i++) {
        tasks.push(makeTask(i < 2 ? 'duplicate_id' : `task_${i}`));
      }
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('duplicate')));
      });
    });

    it('fails on wrong section count', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id, { section: 'Listening' }));
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('Speaking and Writing')));
        assert.ok(getAllErrors().some(e => e.includes('Reading')));
      });
    });

    it('rejects deprecated skillsAssessed field', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id, { skillsAssessed: ['Listening'] }));
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('deprecated')));
      });
    });

    it('fails on missing required field', async () => {
      await withFixtureManifest(JSON.stringify([{ canonicalId: 'read_aloud' }]), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().length > 0);
      });
    });

    it('fails on future task wording', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id, { extra: 'not yet official' }));
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('not yet official')));
      });
    });

    it('fails on invalid promptType enum', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id, { promptType: 'invalid' }));
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('invalid promptType')));
      });
    });

    it('fails on invalid responseType enum', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id, { responseType: 'invalid' }));
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('invalid responseType')));
      });
    });

    it('fails on invalid officialScoringType enum', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id, { officialScoringType: 'invalid' }));
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('invalid officialScoringType')));
      });
    });

    it('fails on boolean fields with non-boolean values', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id, { promptTranscriptRequired: 'yes' }));
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('promptTranscriptRequired')));
      });
    });
  });

  describe('factual contract assertions', () => {
    it('enforces Write From Dictation prompt max 5 seconds', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id));
      const wfd = tasks.find(t => t.canonicalId === 'write_from_dictation');
      wfd.promptLength.maximum = 9;
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('maximum must be 5')));
      });
    });

    it('enforces Summarize Spoken Text includes Spelling', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id));
      const sst = tasks.find(t => t.canonicalId === 'summarize_spoken_text');
      sst.officialScoringTraits = ['Content', 'Form', 'Grammar', 'Vocabulary'];
      sst.responseTimingDescription = 'Ten minutes total includes listening and writing';
      sst.promptLength = { mode: 'range', minimum: 60, maximum: 90, unit: 'seconds' };
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('Spelling')));
      });
    });

    it('enforces Summarize Spoken Text responseTimingDescription', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id));
      const sst = tasks.find(t => t.canonicalId === 'summarize_spoken_text');
      sst.officialScoringTraits = ['Content', 'Form', 'Grammar', 'Vocabulary', 'Spelling'];
      sst.promptLength = { mode: 'range', minimum: 60, maximum: 90, unit: 'seconds' };
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('10 minutes')));
      });
    });

    it('enforces Write Essay exact official traits', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id));
      const ess = tasks.find(t => t.canonicalId === 'write_essay');
      ess.officialScoringTraits = ['Content', 'Form', 'Grammar', 'Vocabulary'];
      ess.promptLength = { mode: 'range', minimum: 2, maximum: 3, unit: 'sentences' };
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('Development')));
      });
    });

    it('rejects Write Essay with split Structure/Coherence', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id));
      const ess = tasks.find(t => t.canonicalId === 'write_essay');
      ess.officialScoringTraits = ['Content', 'Form', 'Structure', 'Coherence', 'Grammar', 'General Linguistic Range', 'Vocabulary Range', 'Spelling'];
      ess.promptLength = { mode: 'range', minimum: 2, maximum: 3, unit: 'sentences' };
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('must not split')));
      });
    });

    it('enforces Write Essay prompt 2-3 sentences', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id));
      const ess = tasks.find(t => t.canonicalId === 'write_essay');
      ess.promptLength = { mode: 'range', minimum: 1, maximum: 2, unit: 'sentences' };
      ess.officialScoringTraits = ['Content', 'Form', 'Development, Structure and Coherence', 'Grammar', 'General Linguistic Range', 'Vocabulary Range', 'Spelling'];
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('2-3 sentences')));
      });
    });

    it('enforces Respond to a Situation promptType text-and-audio', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id));
      const rts = tasks.find(t => t.canonicalId === 'respond_to_situation');
      rts.promptType = 'text';
      rts.mockMode = 'single playback, 10-second preparation, 40-second response';
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('text-and-audio')));
      });
    });

    it('enforces Listening Fill in the Blanks transcript required', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id));
      const lfb = tasks.find(t => t.canonicalId === 'listening_fill_blanks');
      lfb.promptTranscriptRequired = false;
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('promptTranscriptRequired')));
      });
    });

    it('enforces Highlight Incorrect Words transcript required', async () => {
      const tasks = ALL_IDS.map(id => makeTask(id));
      const hiw = tasks.find(t => t.canonicalId === 'highlight_incorrect_words');
      hiw.promptTranscriptRequired = false;
      await withFixtureManifest(JSON.stringify(tasks), (path) => {
        resetValidation();
        validateTaskManifest(path);
        assert.ok(getAllErrors().some(e => e.includes('promptTranscriptRequired')));
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
      validateAtoZPhases(path);
      try { rmSync(path); } catch {}
      assert.equal(getAllErrors().length, 0);
    });

    it('fails when phase Z is missing', () => {
      resetValidation();
      const path = join(fixturesDir, 'README.md');
      writeFixture('README.md', `| Phase | Description |
| A | Product contract |
| B | Monorepo |`);
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
- Content covered: score guide

### Attribution
- Collected by: Heidi Dang
- Reviewed by: Pending Heidi audit
- Approval status: Awaiting review`;

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
