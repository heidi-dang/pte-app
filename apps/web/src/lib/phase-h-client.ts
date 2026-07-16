/**
 * @deprecated Use `@/lib/api-client` (server-side) or `@/lib/client-api` (client-side) instead.
 * This module is kept for backward compatibility but will be removed in a future refactor.
 * Migration guide:
 *   - Server components: import { getCatalogue, getCourseDetail, getLessonDelivery } from '@/lib/api-client'
 *   - Client components: import { getCatalogue, getCourseDetail, getLessonDelivery } from '@/lib/client-api'
 *   - Enrolment / progress: use api-client.ts or client-api.ts equivalents
 *   - Quiz submit: use api-client.ts or client-api.ts equivalents
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function getApiUrl(): string {
  if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is required');
  return API_URL;
}

async function request<T>(path: string, options: RequestInit & { signal?: AbortSignal } = {}): Promise<T> {
  const url = getApiUrl();
  const { signal, body, headers: extraHeaders, ...rest } = options;

  const headers = new Headers(extraHeaders as Record<string, string>);
  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${url}${path}`, {
    credentials: 'include',
    headers,
    body,
    signal,
    ...rest,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Request failed');
  return data as T;
}

export const api = {
  catalogue(params?: { search?: string; access?: string; pageSize?: number; cursor?: string; signal?: AbortSignal }) {
    const q = new URLSearchParams();
    const { signal, ...p } = params || {};
    if (p.search) q.set('search', p.search);
    if (p.access) q.set('access', p.access);
    if (p.pageSize) q.set('pageSize', String(p.pageSize));
    if (p.cursor) q.set('cursor', p.cursor);
    return request<any>(`/learn/catalogue?${q.toString()}`, { signal });
  },

  getCourse(slug: string, signal?: AbortSignal) {
    return request<any>(`/learn/courses/${slug}`, { signal });
  },

  enrol(courseId: string, signal?: AbortSignal) {
    return request<any>(`/learn/courses/${courseId}/enrol`, { method: 'POST', signal });
  },

  getLesson(lessonId: string, signal?: AbortSignal) {
    return request<any>(`/learn/lessons/${lessonId}`, { signal });
  },

  updateProgress(body: Record<string, unknown>, signal?: AbortSignal) {
    return request<any>('/learn/progress', { method: 'POST', body: JSON.stringify(body), signal });
  },

  resumeProgress(courseId: string, signal?: AbortSignal) {
    return request<any>(`/learn/progress/resume/${courseId}`, { signal });
  },

  getProgress(lessonId: string, signal?: AbortSignal) {
    return request<any>(`/learn/progress/${lessonId}`, { signal });
  },

  completeLesson(lessonId: string, signal?: AbortSignal) {
    return request<any>(`/learn/lessons/${lessonId}/complete`, { method: 'POST', signal });
  },

  submitQuiz(quizId: string, submissionId: string, answers: number[][], signal?: AbortSignal) {
    return request<any>(`/learn/quiz/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submissionId, answers }),
      signal,
    });
  },
};
