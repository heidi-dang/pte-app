'use client';

import { useState, useEffect, useCallback } from 'react';

interface HealthResponse {
  service: string;
  status: string;
  version: string;
}

type ServiceStatus = 'loading' | 'ok' | 'fail';

export default function Home() {
  const [apiStatus, setApiStatus] = useState<ServiceStatus>('loading');
  const [scoringStatus, setScoringStatus] = useState<ServiceStatus>('loading');
  const [version, setVersion] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const scoringUrl = process.env.NEXT_PUBLIC_SCORING_URL || 'http://localhost:5000';

  const checkHealth = useCallback(async () => {
    setApiStatus('loading');
    setScoringStatus('loading');

    try {
      const res = await fetch(`${apiUrl}/health/live`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) setApiStatus('ok');
      else setApiStatus('fail');
    } catch {
      setApiStatus('fail');
    }

    try {
      const res = await fetch(`${scoringUrl}/health/live`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) setScoringStatus('ok');
      else setScoringStatus('fail');
    } catch {
      setScoringStatus('fail');
    }
  }, [apiUrl, scoringUrl]);

  useEffect(() => {
    setVersion(process.env.NEXT_PUBLIC_APP_VERSION || process.env.APP_VERSION || '0.0.0');
    checkHealth();
  }, [checkHealth]);

  const StatusBadge = ({ status }: { status: ServiceStatus }) => (
    <span
      className={status === 'ok' ? 'status-ok' : status === 'fail' ? 'status-fail' : 'status-loading'}
      role="status"
    >
      {status === 'ok' ? '✓ Operational' : status === 'fail' ? '✗ Unreachable' : '⟳ Checking...'}
    </span>
  );

  return (
    <main>
      <h1>PTE Academic Platform</h1>
      <h2>Development Environment</h2>
      <p
        style={{
          marginBottom: '2rem',
          padding: '0.75rem 1rem',
          background: '#fef3c7',
          borderRadius: '6px',
          fontSize: '0.9rem',
        }}
      >
        ⓘ Product features begin in later phases. This is the Phase B environment foundation.
      </p>

      <div className="status-card">
        <h3>
          Web Application <span className="status-ok">✓ Running</span>
        </h3>
      </div>

      <div className="status-card">
        <h3>
          API Service <StatusBadge status={apiStatus} />
        </h3>
      </div>

      <div className="status-card">
        <h3>
          Scoring Service <StatusBadge status={scoringStatus} />
        </h3>
      </div>

      <div className="status-card">
        <h3>
          Worker <span className="status-ok">✓ Check via local smoke</span>
        </h3>
      </div>

      <button onClick={checkHealth} aria-label="Retry health checks">
        Retry Health Checks
      </button>

      <div className="footer">
        <p>Version: {version}</p>
        <p>Environment: {typeof window !== 'undefined' ? window.location.hostname : 'ssr'}</p>
      </div>
    </main>
  );
}
