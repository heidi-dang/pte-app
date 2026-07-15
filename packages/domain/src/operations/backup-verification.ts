export function verifyBackupIntegrity(checksum: string, expectedChecksum: string): boolean {
  return checksum === expectedChecksum;
}

export function requiresRestorationEvidence(status: string): boolean {
  return status === 'passed';
}
