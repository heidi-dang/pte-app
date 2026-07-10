import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const root = resolve(import.meta.dirname, '..');

let errors = [];
let warnings = [];

function requiredFile(relativePath) {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) {
    errors.push(`Missing required file: ${relativePath}`);
    return null;
  }
  const content = readFileSync(fullPath, 'utf-8');
  if (content.trim().length === 0) {
    errors.push(`Empty file: ${relativePath}`);
    return null;
  }
  return content;
}

function checkUnresolvedMarkers(relativePath, content) {
  // Skip files that inherently reference these markers
  const skipFiles = [
    'scripts/validate-docs.mjs',
    'docs/testing/audit-scorecard.md',
  ];
  if (skipFiles.includes(relativePath)) return;
  const markers = ['TODO', 'TBD', 'FIXME', 'INSERT HERE', 'COMING SOON'];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const marker of markers) {
      const regex = new RegExp(`\\b${marker}\\b`, 'i');
      if (regex.test(lines[i])) {
        errors.push(`Unresolved marker "${marker}" found in ${relativePath} at line ${i + 1}`);
      }
    }
  }
}

function checkContent(relativePath, content, checks) {
  for (const [description, pattern, caseSensitive] of checks) {
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = typeof pattern === 'string' ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags) : pattern;
    if (!regex.test(content)) {
      errors.push(`Missing content in ${relativePath}: ${description}`);
    }
  }
}

// Required Phase A files
const requiredFiles = [
  '.editorconfig',
  '.gitattributes',
  '.gitignore',
  '.nvmrc',
  '.node-version',
  'LICENSE',
  'README.md',
  'package.json',
  'docs/product/product-requirements.md',
  'docs/product/user-roles.md',
  'docs/product/student-journey.md',
  'docs/product/route-map.md',
  'docs/product/feature-priority.md',
  'docs/product/acceptance-criteria.md',
  'docs/content/pte-task-blueprints.md',
  'docs/content/content-policy.md',
  'docs/content/content-workflow.md',
  'docs/scoring/scoring-principles.md',
  'docs/scoring/calibration-plan.md',
  'docs/testing/test-strategy.md',
  'docs/testing/audit-scorecard.md',
  'docs/operations/development-workflow.md',
  'docs/operations/release-criteria.md',
  'docs/architecture-decisions/0001-monorepo.md',
  'docs/architecture-decisions/0002-provider-adapters.md',
  'docs/architecture-decisions/0003-versioned-content-and-scoring.md',
  'docs/architecture-decisions/0004-recoverable-assessment-state.md',
  'scripts/validate-docs.mjs',
  'apps/.gitkeep',
  'services/.gitkeep',
  'packages/.gitkeep',
  'content/.gitkeep',
  'infrastructure/.gitkeep',
  'scripts/.gitkeep',
];

// Check all required files exist and are non-empty
for (const file of requiredFiles) {
  const content = requiredFile(file);
  if (content !== null) {
    checkUnresolvedMarkers(file, content);
  }
}

// Check README for independent-platform disclaimer
const readme = requiredFile('README.md');
if (readme) {
  checkContent('README.md', readme, [
    ['Independent platform disclaimer', 'not affiliated with, endorsed by or operated by Pearson', false],
    ['80/98/100 audit gate', '98/100', false],
    ['Estimated training scores', 'estimated training scores', false],
    ['Recovery requirement', 'recoverable', false],
    ['No hardcoded values statement', 'hardcoded', false],
    ['Progress exposure requirement', 'progress', false],
  ]);
}

// Check task blueprints for all 22 task types
const blueprints = requiredFile('docs/content/pte-task-blueprints.md');
if (blueprints) {
  const requiredTasks = [
    'Read Aloud',
    'Repeat Sentence',
    'Describe Image',
    'Retell Lecture',
    'Answer Short Question',
    'Summarize Group Discussion',
    'Respond to a Situation',
    'Summarize Written Text',
    'Write Essay',
    'Reading and Writing: Fill in the Blanks',
    'Multiple Choice, Multiple Answers',
    'Reorder Paragraph',
    'Reading: Fill in the Blanks',
    'Multiple Choice, Single Answer',
    'Summarize Spoken Text',
    'Fill in the Blanks',
    'Highlight Correct Summary',
    'Select Missing Word',
    'Highlight Incorrect Words',
    'Write From Dictation',
  ];
  // Check for listening-specific task names with careful matching
  const listeningTasks = [
    'Multiple Choice, Multiple Answers (Listening)',
    'Multiple Choice, Single Answer (Listening)',
  ];
  for (const task of requiredTasks) {
    if (!blueprints.includes(task)) {
      errors.push(`Missing task type in task blueprints: ${task}`);
    }
  }
  // Check listening variants
  if (!blueprints.includes('Multiple Choice, Multiple Answers (Listening)') && !blueprints.includes('### Multiple Choice, Multiple Answers')) {
    // Accept the title at any heading level
    const headingRegex = /Multiple Choice, Multiple Answers/g;
    const matches = blueprints.match(headingRegex);
    if (!matches || matches.length < 2) {
      errors.push('Missing task type in task blueprints: Multiple Choice, Multiple Answers (Listening)');
    }
  }
  if (!blueprints.includes('Multiple Choice, Single Answer (Listening)')) {
    const headingRegex = /Multiple Choice, Single Answer/g;
    const matches = blueprints.match(headingRegex);
    if (!matches || matches.length < 2) {
      errors.push('Missing task type in task blueprints: Multiple Choice, Single Answer (Listening)');
    }
  }
}

// Check audit scorecard for 98/100
const scorecard = requiredFile('docs/testing/audit-scorecard.md');
if (scorecard) {
  checkContent('docs/testing/audit-scorecard.md', scorecard, [
    ['98/100 acceptance threshold', '98/100', false],
    ['Repository and structure section', 'Repository and Structure', false],
    ['Requirements completeness section', 'Requirements Completeness', false],
    ['PTE coverage section', 'PTE Coverage', false],
    ['Content system section', 'Content System', false],
    ['Scoring and calibration section', 'Scoring and Calibration', false],
    ['UX and recovery section', 'UX and Recovery', false],
    ['Testing and release gates section', 'Testing and Release Gates', false],
    ['Documentation quality section', 'Documentation Quality', false],
  ]);
}

// Check scoring principles for estimated-score disclaimer
const scoring = requiredFile('docs/scoring/scoring-principles.md');
if (scoring) {
  checkContent('docs/scoring/scoring-principles.md', scoring, [
    ['Estimated training scores', 'estimated training scores', false],
    ['Component evidence requirement', 'component evidence', false],
    ['Versioning requirement', 'version', false],
    ['Confidence range requirement', 'confidence', false],
    ['Historical result integrity', 'cannot silently change', false],
  ]);
}

// Check content policy for licensing
const contentPolicy = requiredFile('docs/content/content-policy.md');
if (contentPolicy) {
  checkContent('docs/content/content-policy.md', contentPolicy, [
    ['Permitted content section', 'Permitted Content', false],
    ['Prohibited content section', 'Prohibited Content', false],
    ['Licensing', 'licence', false],
    ['Review score gate', '9/10', false],
  ]);
}

// Check recovery documentation
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

// Check acceptance criteria for mobile requirements
const criteria = requiredFile('docs/product/acceptance-criteria.md');
if (criteria) {
  checkContent('docs/product/acceptance-criteria.md', criteria, [
    ['Mobile experience criteria', 'Mobile Experience', false],
    ['Recovery criteria', 'Recovery', false],
  ]);
}

// Check test strategy
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

// Check calibration plan
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

// Check architecture decisions
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

// Output results
console.log('\n=== Phase A Documentation Validation ===\n');

if (errors.length > 0) {
  console.log(`FAILED — ${errors.length} error(s) found:\n`);
  for (const err of errors) {
    console.log(`  [ERROR] ${err}`);
  }
  console.log('');
} else {
  console.log('  All checks passed.\n');
}

if (warnings.length > 0) {
  console.log(`${warnings.length} warning(s):\n`);
  for (const warn of warnings) {
    console.log(`  [WARNING] ${warn}`);
  }
  console.log('');
}

process.exit(errors.length > 0 ? 1 : 0);
