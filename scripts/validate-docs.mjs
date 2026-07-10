import { readFileSync, existsSync, readdirSync } from 'fs';
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

export function requiredFile(relativePath) {
  const fullPath = relativePath.startsWith('/') ? relativePath : join(root, relativePath);
  const displayPath = relativePath.startsWith('/') ? relativePath.replace(root + '/', '') : relativePath;
  if (!existsSync(fullPath)) {
    errors.push(`Missing required file: ${displayPath}`);
    return null;
  }
  const content = readFileSync(fullPath, 'utf-8');
  // Allow zero-byte .gitkeep files
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

export function checkContent(relativePath, content, checks) {
  for (const [description, pattern, caseSensitive] of checks) {
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = typeof pattern === 'string' ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags) : pattern;
    if (!regex.test(content)) {
      errors.push(`Missing content in ${relativePath}: ${description}`);
    }
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

  const requiredFields = [
    'canonicalId', 'displayName', 'section', 'currentOfficialTask',
    'skillsAssessed', 'promptType', 'responseType', 'promptLength',
    'preparationSeconds', 'responseSeconds', 'responseTimingMode',
    'playbackLimit', 'recordingLimit', 'officialScoringType',
    'officialScoringTraits', 'practiceMode', 'mockMode',
    'referenceIds', 'lastVerifiedAt'
  ];

  for (const task of manifest) {
    for (const field of requiredFields) {
      if (task[field] === undefined || task[field] === null) {
        errors.push(`${manifestPath}: task "${task.canonicalId || 'unknown'}" missing field: ${field}`);
      }
    }
    if (task.currentOfficialTask === false || task.currentOfficialTask === undefined) {
      errors.push(`${manifestPath}: task "${task.canonicalId}" must be marked as current official task`);
    }
    if (task.officialScoringTraits && !Array.isArray(task.officialScoringTraits)) {
      errors.push(`${manifestPath}: task "${task.canonicalId}" officialScoringTraits must be an array`);
    }
    if (task.referenceIds && !Array.isArray(task.referenceIds)) {
      errors.push(`${manifestPath}: task "${task.canonicalId}" referenceIds must be an array`);
    }
  }

  const validSections = ['Speaking and Writing', 'Reading', 'Listening'];
  const sectionCounts = { 'Speaking and Writing': 0, 'Reading': 0, 'Listening': 0 };

  for (const task of manifest) {
    if (!validSections.includes(task.section)) {
      errors.push(`${manifestPath}: task "${task.canonicalId}" has invalid section: ${task.section}`);
    } else {
      sectionCounts[task.section]++;
    }
  }

  if (sectionCounts['Speaking and Writing'] !== 9) {
    errors.push(`${manifestPath}: expected 9 Speaking and Writing tasks, found ${sectionCounts['Speaking and Writing']}`);
  }
  if (sectionCounts['Reading'] !== 5) {
    errors.push(`${manifestPath}: expected 5 Reading tasks, found ${sectionCounts['Reading']}`);
  }
  if (sectionCounts['Listening'] !== 8) {
    errors.push(`${manifestPath}: expected 8 Listening tasks, found ${sectionCounts['Listening']}`);
  }

  const futureLabels = ['future task', 'not yet official', 'future', 'unofficial'];
  const contentStr = JSON.stringify(manifest).toLowerCase();
  for (const label of futureLabels) {
    if (contentStr.includes(label)) {
      errors.push(`${manifestPath}: task manifest contains prohibited label: "${label}"`);
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
  ]);
}

export function validateBlueprintAgainstManifest(blueprintPath, manifestPath) {
  const blueprint = requiredFile(blueprintPath);
  const manifestContent = requiredFile(manifestPath);
  if (!blueprint || !manifestContent) return;

  let manifest;
  try {
    manifest = JSON.parse(manifestContent);
  } catch (e) {
    return;
  }

  for (const task of manifest) {
    const id = task.canonicalId;
    if (!blueprint.includes(id)) {
      errors.push(`${blueprintPath}: missing canonical ID "${id}" from manifest`);
    }
    const displayName = task.displayName;
    if (!blueprint.includes(displayName)) {
      errors.push(`${blueprintPath}: missing task display name "${displayName}" from manifest`);
    }
  }

  if (blueprint.includes('future task') || blueprint.includes('not yet official')) {
    errors.push(`${blueprintPath}: contains prohibited label "future task" or "not yet official"`);
  }
}

export function validateFreeStudentRoutes(routeMapPath) {
  const content = requiredFile(routeMapPath);
  if (!content) return;

  const freeAccessRoutes = [
    '/app',
    '/app/onboarding',
    '/app/dashboard',
    '/app/courses',
    '/app/practice',
    '/app/progress',
    '/app/subscription',
    '/app/profile',
  ];

  for (const route of freeAccessRoutes) {
    const escapedRoute = route.replace(/\//g, '\\/');
    const regex = new RegExp(`\\|\\s*\`?${escapedRoute}\`?\\s*\\|\\s*Free student`, 'i');
    if (!regex.test(content)) {
      errors.push(`${routeMapPath}: route ${route} must be accessible to Free student`);
    }
  }
}

export function validateRekadPhases(readmePath) {
  const content = requiredFile(readmePath);
  if (!content) return;

  const phasesAZ = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z'
  ];

  for (const phase of phasesAZ) {
    const regex = new RegExp(`\\|\\s*${phase}\\s*\\|`, 'i');
    if (!regex.test(content)) {
      errors.push(`${readmePath}: missing phase ${phase} in development phases table`);
    }
  }
}

export function validateMockTimerConsistency(docs) {
  // Check that mock timer policy is consistent: deadline continues,
  // remaining time recalculated on reconnection (NOT restored to amount at interruption)
  const mockDocs = ['docs/product/student-journey.md', 'docs/product/acceptance-criteria.md', 'docs/architecture-decisions/0004-recoverable-assessment-state.md'];
  for (const docPath of mockDocs) {
    const content = requiredFile(docPath);
    if (!content) continue;
    if (content.includes('remaining time at interruption') || content.includes('reflects the remaining time at the point')) {
      errors.push(`${docPath}: contains incorrect mock timer policy (remaining time restored to interruption point instead of recalculated from server deadline)`);
    }
  }
  for (const docPath of mockDocs) {
    const content = requiredFile(docPath);
    if (!content) continue;
    checkContent(docPath, content, [
      ['Mock deadline continues during interruption', 'deadline continue', false],
    ]);
  }
}

export function validateBlueprintReferences(blueprintPath) {
  const content = requiredFile(blueprintPath);
  if (!content) return;

  const requiredRefs = [
    '**Official reference IDs**: source-1, source-2',
    'source-3',
    'source-4',
    'source-5',
    'source-6',
  ];

  for (const ref of requiredRefs) {
    // Just check that each source number appears
    const match = ref.match(/source-(\d)/);
    if (match) {
      if (!content.includes(`source-${match[1]}`)) {
        errors.push(`${blueprintPath}: missing reference source-${match[1]}`);
      }
    }
  }
}

// Run all document validations
export function validateAll() {
  resetValidation();

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
    'docs/content/pte-task-manifest.json',
    'docs/content/official-pte-reference-register.md',
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

  for (const file of requiredFiles) {
    const content = requiredFile(file);
    if (content !== null) {
      checkUnresolvedMarkers(file, content);
    }
  }

  // Check README
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
    validateRekadPhases('README.md');
  }

  // Task manifest validation
  validateTaskManifest('docs/content/pte-task-manifest.json');

  // Blueprint validation against manifest
  validateBlueprintAgainstManifest('docs/content/pte-task-blueprints.md', 'docs/content/pte-task-manifest.json');
  validateBlueprintReferences('docs/content/pte-task-blueprints.md');

  // Official reference register
  validateOfficialReferenceRegister('docs/content/official-pte-reference-register.md');

  // Audit scorecard
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
      ['Integrated-skill contributions scoring', 'Integrated-skill', false],
    ]);
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

  // Content policy
  const contentPolicy = requiredFile('docs/content/content-policy.md');
  if (contentPolicy) {
    checkContent('docs/content/content-policy.md', contentPolicy, [
      ['Permitted content section', 'Permitted Content', false],
      ['Prohibited content section', 'Prohibited Content', false],
      ['Licensing', 'licence', false],
      ['Review score gate', '9/10', false],
    ]);
  }

  // Recovery documentation
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

  // Acceptance criteria
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

  // Test strategy
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

  // Calibration plan
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

  // Architecture decisions
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

  // Free student route access
  validateFreeStudentRoutes('docs/product/route-map.md');

  // Mock timer consistency
  validateMockTimerConsistency();

  // Content workflow
  const workflow = requiredFile('docs/content/content-workflow.md');
  if (workflow) {
    checkContent('docs/content/content-workflow.md', workflow, [
      ['Workflow stages', 'Idea', false],
      ['Approval stage', 'Approval', true],
      ['Publication stage', 'Publication', true],
    ]);
  }

  // Development workflow
  const devWorkflow = requiredFile('docs/operations/development-workflow.md');
  if (devWorkflow) {
    checkContent('docs/operations/development-workflow.md', devWorkflow, [
      ['Conventional commits', 'conventional commit', false],
      ['Branch format', 'feat/phase-<letter>', false],
    ]);
  }

  // Release criteria
  const releaseCriteria = requiredFile('docs/operations/release-criteria.md');
  if (releaseCriteria) {
    checkContent('docs/operations/release-criteria.md', releaseCriteria, [
      ['All task types implemented', 'All task types', false],
      ['Final audit gate', '98/100', false],
    ]);
  }

  return { errors: getAllErrors(), warnings: getAllWarnings() };
}

// Run when executed directly
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
