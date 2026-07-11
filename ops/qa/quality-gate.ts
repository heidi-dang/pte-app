/**
 * Phase X — QA and Performance Gate
 *
 * Defines the quality checks that must pass before any production release.
 */

export interface QualityGate {
  readonly name: string;
  readonly category: 'unit' | 'integration' | 'e2e' | 'security' | 'performance' | 'accessibility' | 'recovery';
  readonly command: string;
  readonly required: boolean;
  readonly threshold?: number;
}

export const RELEASE_GATES: QualityGate[] = [
  // Unit & Integration
  { name: 'Unit tests', category: 'unit', command: 'npm run test:unit', required: true },
  { name: 'Integration tests', category: 'integration', command: 'npm run test:integration', required: true },
  { name: 'E2E smoke test', category: 'e2e', command: 'npm run test:e2e', required: true },
  { name: 'Full test suite', category: 'unit', command: 'npm test', required: true },

  // Code quality
  { name: 'Formatting check', category: 'unit', command: 'npm run format:check', required: true },
  { name: 'Lint', category: 'unit', command: 'npm run lint', required: true },
  { name: 'TypeScript check', category: 'unit', command: 'npm run typecheck', required: true },
  { name: 'Build', category: 'unit', command: 'npm run build', required: true },

  // CI
  { name: 'CI pipeline', category: 'integration', command: 'npm run ci', required: true },
  { name: 'Workspace validation', category: 'unit', command: 'npm run validate:workspace', required: true },

  // Security
  { name: 'Dependency audit', category: 'security', command: 'npm audit', required: true },
  { name: 'Secret scan', category: 'security', command: 'git diff --check', required: true },
  {
    name: 'No .only in tests',
    category: 'security',
    command: 'grep -r "\\.only(" --include="*.test.*" . || true',
    required: true,
  },

  // Performance
  { name: 'Build time', category: 'performance', command: 'npm run build', required: false, threshold: 120_000 },
  { name: 'Unit test time', category: 'performance', command: 'npm run test:unit', required: false, threshold: 60_000 },
];

export function getAllRequiredGates(): QualityGate[] {
  return RELEASE_GATES.filter((g) => g.required);
}

export function getAllPerformanceGates(): QualityGate[] {
  return RELEASE_GATES.filter((g) => g.category === 'performance');
}
