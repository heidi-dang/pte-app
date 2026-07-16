'use server';

import { cookies } from 'next/headers';
import { getSessionCookieName } from './config';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');

function getHeaders() {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  return headers;
}

async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(getSessionCookieName())?.value;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T; ok: boolean }> {
  if (!BASE_URL) {
    return { status: 503, data: null as unknown as T, ok: false };
  }
  const token = await getAuthToken();
  const headers = getHeaders();
  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data: data as T, ok: res.ok };
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface SpeakingRecording {
  id: string;
  attempt_id: string;
  user_id: string;
  recording_profile_id: string;
  state: string;
  finalisation_state: string;
  upload_session_id: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface UploadSessionRecord {
  id: string;
  recording_id: string;
  total_chunks: number;
  acknowledged_chunks: number;
  acknowledged_sequence_numbers: number[];
  state: string;
  created_at: string;
}

export async function listSessions(): Promise<SessionRecord[]> {
  const { ok, data } = await api.get<{ sessions: SessionRecord[] }>('/auth/sessions');
  if (!ok) return [];
  return data.sessions ?? [];
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  const { ok } = await api.delete(`/auth/sessions/${sessionId}`);
  return ok;
}

export async function revokeOtherSessions(): Promise<boolean> {
  const { ok } = await api.delete('/auth/sessions/others');
  return ok;
}

export async function startRecording(attemptId: string, recordingProfileId: string) {
  return api.post<{ recording: SpeakingRecording; uploadSession?: UploadSessionRecord; resumed: boolean }>(
    '/api/v1/speaking/recording/start',
    { attemptId, recordingProfileId },
  );
}

export async function startUpload(recordingId: string, totalChunks: number) {
  return api.post<{ uploadSession: UploadSessionRecord; acknowledgedChunks: number[]; resumed: boolean }>(
    '/api/v1/speaking/upload/start',
    { recordingId, totalChunks },
  );
}

export async function uploadChunk(uploadSessionId: string, sequenceNumber: number, byteCount: number, data: string, checksum?: string) {
  return api.post<{ chunk: { id: string; sequenceNumber: number; acknowledgedAt: string }; acknowledgedCount: number }>(
    '/api/v1/speaking/upload/chunk',
    { uploadSessionId, sequenceNumber, byteCount, data, checksum },
  );
}

export async function finalizeRecording(recordingId: string, durationMs?: number) {
  return api.post<{ recording: SpeakingRecording; acknowledgedChunkCount: number; idempotent: boolean }>(
    '/api/v1/speaking/upload/finalize',
    { recordingId, durationMs },
  );
}

export async function getRecordingStatus(recordingId: string) {
  return api.get<{
    recording: SpeakingRecording;
    uploadSession: UploadSessionRecord | null;
    chunks: unknown[];
    missingChunkIndexes: number[];
    isComplete: boolean;
  }>(`/api/v1/speaking/recording/${recordingId}/status`);
}

export async function startAttemptSession(lessonId: string, mode: string, questionIds: string[], questionTaskTypes?: Record<string, string>) {
  return api.post<{ session: unknown; attempts: unknown[]; serverNow: string; recovered?: boolean }>(
    '/api/v1/attempt/session/start',
    { lessonId, mode, questionIds, questionTaskTypes },
  );
}

export async function getAttemptSession(sessionId: string) {
  return api.get<{ session: unknown; attempts: unknown[]; serverNow: string }>(
    `/api/v1/attempt/session/${sessionId}`,
  );
}

export async function autosaveAttempt(attemptId: string, response: Record<string, unknown>) {
  return api.post('/api/v1/attempt/autosave', { attemptId, response });
}

export async function submitAttempt(attemptId: string, response: Record<string, unknown>, idempotencyKey: string) {
  return api.post('/api/v1/attempt/submit', { attemptId, response, idempotencyKey });
}

export async function getAttemptReview(attemptId: string) {
  return api.get<{ attemptId: string; status: string; response: unknown; mode: string }>(
    `/api/v1/attempt/${attemptId}/review`,
  );
}
