import type { ValidationRun } from '@pte-app/contracts';
export async function runValidation(_contentId: string, _version: number): Promise<ValidationRun> {
  return {
    id: crypto.randomUUID(),
    contentId,
    version,
    checks: [],
    status: 'passed',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}
