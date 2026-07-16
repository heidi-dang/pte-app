'use client';

import { useState, useCallback, useEffect } from 'react';

interface SessionInfo {
  id: string;
  device: string;
  location: string;
  current: boolean;
  expiresAt: string;
  createdAt: string;
}

export function useSessions() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/sessions');
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions.map((s: any) => ({
          id: s.id,
          device: s.userAgent || 'Unknown device',
          location: s.ipAddress || 'Unknown location',
          current: s.current ?? false,
          expiresAt: s.expiresAt,
          createdAt: s.createdAt,
        })));
      }
    } catch {
      // fallback to empty
    }
    setLoading(false);
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      await fetch(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, refetch: fetchSessions, revokeSession };
}
