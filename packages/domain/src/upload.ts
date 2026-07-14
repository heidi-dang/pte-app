import type { UploadContract, UploadStatus } from '@pte-app/contracts';
import type { UploadId, UserId, Version, ISO8601DateTime } from '@pte-app/types';

export interface Upload {
  readonly id: UploadId;
  readonly version: Version;
  readonly userId: UserId;
  readonly fileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly status: UploadStatus;
  readonly storageKey: string;
  readonly checksum: string;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: ISO8601DateTime;
  readonly completedAt: ISO8601DateTime | null;
}

export function createUpload(contract: UploadContract): Upload {
  return {
    id: contract.id,
    version: contract.version,
    userId: contract.userId,
    fileName: contract.fileName,
    mimeType: contract.mimeType,
    sizeBytes: contract.sizeBytes,
    status: contract.status,
    storageKey: contract.storageKey,
    checksum: contract.checksum,
    metadata: contract.metadata as Record<string, unknown>,
    createdAt: contract.createdAt,
    completedAt: contract.completedAt,
  };
}

export function uploadIsComplete(upload: Upload): boolean {
  return upload.status === 'completed';
}

export function uploadIsFailed(upload: Upload): boolean {
  return upload.status === 'failed';
}
