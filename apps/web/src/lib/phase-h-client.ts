const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function getApiUrl(): string {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is required');
  }
  return API_URL;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = getApiUrl();
  const res = await fetch(`${url}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Request failed');
  return data as T;
}

export const api = {
  catalogue(params?: { search?: string; access?: string; pageSize?: number; cursor?: string }) {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.access) q.set('access', params.access);
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.cursor) q.set('cursor', params.cursor);
    return request<any>(`/learn/catalogue?${q.toString()}`);
  },

  getCourse(slug: string) {
    return request<any>(`/learn/courses/${slug}`);
  },

  enrol(courseId: string) {
    return request<any>(`/learn/courses/${courseId}/enrol`, { method: 'POST' });
  },

  getLesson(lessonId: string) {
    return request<any>(`/learn/lessons/${lessonId}`);
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
