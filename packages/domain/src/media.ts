import type { MediaContract, MediaType } from '@pte-app/contracts';
import type { MediaId, Version, ISO8601DateTime } from '@pte-app/types';

export interface Media {
  readonly id: MediaId;
  readonly version: Version;
  readonly type: MediaType;
  readonly url: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly durationSeconds: number | null;
  readonly language: string;
  readonly checksum: string;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: ISO8601DateTime;
}

export function createMedia(contract: MediaContract): Media {
  return {
    id: contract.id,
    version: contract.version,
    type: contract.type,
    url: contract.url,
    mimeType: contract.mimeType,
    sizeBytes: contract.sizeBytes,
    durationSeconds: contract.durationSeconds,
    language: contract.language,
    checksum: contract.checksum,
    metadata: contract.metadata as Record<string, unknown>,
    createdAt: contract.createdAt,
  };
}

export function mediaHasDuration(media: Media): boolean {
  return media.durationSeconds !== null;
}

export function mediaIsAudio(media: Media): boolean {
  return media.type === 'audio';
}
