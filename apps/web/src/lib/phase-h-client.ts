const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function getApiUrl(): string {
  if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is required');
  return API_URL;
}

async function request<T>(path: string, options: RequestInit & { signal?: AbortSignal } = {}): Promise<T> {
  const url = getApiUrl();
  const { signal, ...rest } = options;
  const res = await fetch(`${url}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...rest.headers },
    signal,
    ...rest,
  });
  const data = await res.json();
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

  enrol(courseId: string) {
    return request<any>(`/learn/courses/${courseId}/enrol`, { method: 'POST' });
  },

  getLesson(lessonId: string, signal?: AbortSignal) {
    return request<any>(`/learn/lessons/${lessonId}`, { signal });
  },

  updateProgress(body: Record<string, unknown>) {
    return request<any>('/learn/progress', { method: 'POST', body: JSON.stringify(body) });
  },

  resumeProgress(courseId: string) {
    return request<any>(`/learn/progress/resume/${courseId}`);
  },

  getProgress(lessonId: string) {
    return request<any>(`/learn/progress/${lessonId}`);
  },

  completeLesson(lessonId: string) {
    return request<any>(`/learn/lessons/${lessonId}/complete`, { method: 'POST' });
  },

  submitQuiz(quizId: string, submissionId: string, answers: number[][]) {
    return request<any>(`/learn/quiz/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submissionId, answers }),
    });
  },
};
