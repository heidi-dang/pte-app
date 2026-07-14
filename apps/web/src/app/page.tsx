'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button } from '@pte-app/design-system';
import './page.css';

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
      setApiStatus(res.ok ? 'ok' : 'fail');
    } catch {
      setApiStatus('fail');
    }

    try {
      const res = await fetch(`${scoringUrl}/health/live`, { signal: AbortSignal.timeout(5000) });
      setScoringStatus(res.ok ? 'ok' : 'fail');
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
      {status === 'ok' ? 'Operational' : status === 'fail' ? 'Unreachable' : 'Checking...'}
    </span>
  );

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <div className="hero">
          <h1>PTE Academic Platform</h1>
          <p>Prepare for your PTE Academic exam with adaptive practice, instant scoring, and progress tracking.</p>
          <div className="hero-actions">
            <a href="/register">
              <Button>Create account</Button>
            </a>
            <a href="/login">
              <Button variant="secondary">Log in</Button>
            </a>
          </div>
        </div>

        <div className="status-grid">
          <Card>
            <h3>Web Application</h3>
            <StatusBadge status="ok" />
          </Card>
          <Card>
            <h3>API Service</h3>
            <StatusBadge status={apiStatus} />
          </Card>
          <Card>
            <h3>Scoring Service</h3>
            <StatusBadge status={scoringStatus} />
          </Card>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Button onClick={checkHealth} variant="secondary">
            Retry health checks
          </Button>
        </div>

        <footer className="footer">
          <p>Version: {version}</p>
        </footer>
      </Container>
    </main>
  );
}
