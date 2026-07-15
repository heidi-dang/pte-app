import type { BackupVerificationRun } from '@pte-app/contracts';
export async function verifyBackup(_run: BackupVerificationRun): Promise<void> {
  if (run.status !== 'passed') return;
}
