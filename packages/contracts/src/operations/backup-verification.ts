export interface BackupVerificationRun {
  id: string;
  backupReference: string;
  verificationProfile: string;
  checksum: string;
  integrityResult: 'passed' | 'failed';
  restorationTestReference?: string;
  verifiedAt: string;
  failureReason?: string;
  evidenceArtifact?: string;
  status: 'passed' | 'failed';
}
