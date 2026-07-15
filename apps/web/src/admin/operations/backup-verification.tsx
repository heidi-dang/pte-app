'use client';
import React from 'react';
interface Props {
  backupReference: string;
  integrityResult: string;
  status: string;
  restorationTestRef?: string;
  evidenceArtifact?: string;
}
export function BackupVerification({
  backupReference,
  integrityResult,
  status,
  restorationTestRef,
  evidenceArtifact,
}: Props) {
  return (
    <section aria-label="Backup verification">
      <h2>Backup Verification</h2>
      <p>Backup: {backupReference}</p>
      <p>Integrity: {integrityResult}</p>
      <p>Status: {status}</p>
      {restorationTestRef ? (
        <p>Restoration evidence: {restorationTestRef}</p>
      ) : (
        <p role="alert">No restoration evidence available</p>
      )}
      {evidenceArtifact && <p>Evidence artifact: {evidenceArtifact}</p>}
    </section>
  );
}
