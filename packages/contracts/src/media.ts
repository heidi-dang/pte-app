import type { MediaId, Version, ISO8601DateTime, JsonObject } from '@pte-app/types';

export interface MediaContract {
  readonly id: MediaId;
  readonly version: Version;
  readonly type: MediaType;
  readonly url: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly durationSeconds: number | null;
  readonly language: string;
  readonly checksum: string;
  readonly metadata: JsonObject;
  readonly createdAt: ISO8601DateTime;
}

export type MediaType = 'audio' | 'video' | 'image' | 'document';
