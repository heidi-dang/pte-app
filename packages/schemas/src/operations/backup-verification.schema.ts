import { z } from 'zod';
export const BackupVerificationRunSchema = z.object({
  id: z.string(),
  backupReference: z.string(),
  verificationProfile: z.string(),
  checksum: z.string(),
  integrityResult: z.enum(['passed', 'failed']),
  restorationTestReference: z.string().optional(),
  verifiedAt: z.string(),
  failureReason: z.string().optional(),
  evidenceArtifact: z.string().optional(),
  status: z.enum(['passed', 'failed']),
});
