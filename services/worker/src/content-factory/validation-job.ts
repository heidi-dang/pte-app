import type { ValidationRun } from '@pte-app/contracts';
export async function runValidation(contentId: string, _version: number): Promise<ValidationRun> {
  return {
    id: crypto.randomUUID(),
    contentId,
    version: 1,
    checks: [],
    status: 'passed',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}
