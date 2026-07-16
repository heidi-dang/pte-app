const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T; ok: boolean }> {
  if (!API_BASE) return { status: 503, data: null as unknown as T, ok: false };
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data: data as T, ok: res.ok };
  } catch {
    return { status: 0, data: null as unknown as T, ok: false };
  }
}

export function apiGet<T>(path: string) {
  return apiRequest<T>('GET', path);
}

export function apiPost<T>(path: string, body?: unknown) {
  return apiRequest<T>('POST', path, body);
}

// ─── Attempt Lifecycle ─────────────────────────────────────

export async function startAttemptSession(lessonId: string, mode: string, questionIds: string[], questionTaskTypes?: Record<string, string>) {
  return apiPost<{ session: unknown; attempts: unknown[]; serverNow: string; recovered?: boolean }>(
    '/api/v1/attempt/session/start',
    { lessonId, mode, questionIds, questionTaskTypes },
  );
}

export async function getAttemptSession(sessionId: string) {
  return apiGet<{ session: unknown; attempts: unknown[]; serverNow: string }>(
    `/api/v1/attempt/session/${sessionId}`,
  );
}

export async function autosaveAttempt(attemptId: string, response: Record<string, unknown>) {
  return apiPost('/api/v1/attempt/autosave', { attemptId, response });
}

export async function submitAttempt(attemptId: string, response: Record<string, unknown>, idempotencyKey: string) {
  return apiPost('/api/v1/attempt/submit', { attemptId, response, idempotencyKey });
}

export async function getAttemptReview(attemptId: string) {
  return apiGet<{ attemptId: string; status: string; response: unknown; mode: string; playback?: unknown }>(
    `/api/v1/attempt/${attemptId}/review`,
  );
}

// ─── Speaking Recording Status ─────────────────────────────

export async function getRecordingStatus(recordingId: string) {
  return apiGet<{
    recording: { id: string; attempt_id: string; state: string; duration_ms: number | null; created_at: string };
    uploadSession: unknown | null;
    chunks: unknown[];
    missingChunkIndexes: number[];
    isComplete: boolean;
  }>(`/api/v1/speaking/recording/${recordingId}/status`);
}

// ─── Phase H: Learning (client-safe) ───────────────────────

export async function getCatalogue(params?: { search?: string; access?: string; pageSize?: number; cursor?: string }) {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.access) q.set('access', params.access);
  if (params?.pageSize) q.set('pageSize', String(params.pageSize));
  if (params?.cursor) q.set('cursor', params.cursor);
  const query = q.toString();
  return apiGet<{ courses: unknown[]; page?: { cursor: string }; total?: number }>(
    `/learn/catalogue${query ? `?${query}` : ''}`,
  );
}

export async function getCourseDetail(slug: string) {
  return apiGet<{ course: unknown; modules: unknown[]; lessons: unknown[]; enrolment: unknown | null }>(
    `/learn/courses/${slug}`,
  );
}

export async function getLessonDelivery(lessonId: string) {
  return apiGet<{ lesson: unknown; blocks: unknown[]; progress: unknown | null }>(
    `/learn/lessons/${lessonId}`,
  );
}
