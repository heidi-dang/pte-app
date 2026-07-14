import type { UploadId, UserId, Version, ISO8601DateTime, JsonObject } from '@pte-app/types';

export interface UploadContract {
  readonly id: UploadId;
  readonly version: Version;
  readonly userId: UserId;
  readonly fileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly status: UploadStatus;
  readonly storageKey: string;
  readonly checksum: string;
  readonly metadata: JsonObject;
  readonly createdAt: ISO8601DateTime;
  readonly completedAt: ISO8601DateTime | null;
}

export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
