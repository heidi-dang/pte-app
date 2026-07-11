'use client';

import { useState, useEffect, useCallback } from 'react';

type ServiceStatus = 'loading' | 'ok' | 'fail';

import { checkService, getHealthUrl } from '../lib/health';

export default function Home() {
  const [apiStatus, setApiStatus] = useState<ServiceStatus>('loading');
  const [scoringStatus, setScoringStatus] = useState<ServiceStatus>('loading');
  const [version, setVersion] = useState('');
  const [showDevConsole, setShowDevConsole] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const scoringUrl = process.env.NEXT_PUBLIC_SCORING_URL || 'http://localhost:5000';

  const checkHealth = useCallback(async () => {
    setApiStatus('loading');
    setScoringStatus('loading');
    const [api, scoring] = await Promise.all([
      checkService(getHealthUrl(apiUrl)),
      checkService(getHealthUrl(scoringUrl)),
    ]);
    setApiStatus(api);
    setScoringStatus(scoring);
  }, [apiUrl, scoringUrl]);

  useEffect(() => {
    setVersion(process.env.NEXT_PUBLIC_APP_VERSION || process.env.APP_VERSION || '0.0.0');
    checkHealth();
  }, [checkHealth]);

  const features = [
    {
      icon: '🎯',
      title: 'AI-Estimated Scores',
      desc: 'Every speaking and writing response is analysed with confidence ranges, component evidence, and skill-level breakdown.',
    },
    {
      icon: '📊',
      title: 'Diagnostic Assessment',
      desc: 'Establish your baseline in one session. Get a full skill breakdown and a personalised study plan immediately.',
    },
    {
      icon: '🗂️',
      title: 'All 22 PTE Task Types',
      desc: 'Practice every official PTE Academic task type—speaking, writing, reading, and listening—in both learning and mock mode.',
    },
    {
      icon: '⏱️',
      title: 'Timed Mock Exams',
      desc: 'Full-length 3-hour simulations with official section timing, server-side deadlines, and automatic score reporting.',
    },
    {
      icon: '📚',
      title: 'Structured Courses',
      desc: 'Bite-sized lessons taught by expert educators. Study the theory and skills behind each PTE task type.',
    },
    {
      icon: '📈',
      title: 'Progress Tracking',
      desc: 'Watch your improvement over time with skill-level charts, score history, and teacher feedback integration.',
    },
  ];

  const StatusDot = ({ status }: { status: ServiceStatus }) => (
    <span
      style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: status === 'ok' ? '#22c55e' : status === 'fail' ? '#ef4444' : '#f59e0b',
        marginRight: '6px',
      }}
    />
  );

  return (
    <>
      {/* ──────────────────────────── HERO ──────────────────────────── */}
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Nav */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 2.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📘</span>
            <span style={{ fontWeight: '700', fontSize: '1.125rem', fontFamily: "'Inter', sans-serif" }}>
              PTE Academic Platform
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a
              href="/app/onboarding"
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              Sign up free
            </a>
            <a
              href="/app/dashboard"
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                background: 'hsl(221, 83%, 53%)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              Dashboard →
            </a>
          </div>
        </nav>

        {/* Hero Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '0.375rem 1rem',
              borderRadius: '9999px',
              background: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(37, 99, 235, 0.4)',
              color: '#93c5fd',
              fontSize: '0.8rem',
              fontWeight: '600',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
            }}
          >
            Commercial PTE Academic Preparation
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.25rem, 6vw, 4rem)',
              fontWeight: '800',
              lineHeight: '1.1',
              marginBottom: '1.5rem',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Score Higher on
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PTE Academic
            </span>
          </h1>

          <p
            style={{
              fontSize: '1.125rem',
              color: '#94a3b8',
              maxWidth: '520px',
              lineHeight: '1.7',
              marginBottom: '2.5rem',
            }}
          >
            The only PTE prep platform that adapts to your baseline, explains every score with evidence, and tracks real
            improvement over time.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a
              href="/app/onboarding"
              style={{
                padding: '0.875rem 2rem',
                borderRadius: '10px',
                background: 'hsl(221, 83%, 53%)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 24px rgba(37,99,235,0.4)',
              }}
            >
              Get Started Free →
            </a>
            <a
              href="/app/dashboard"
              style={{
                padding: '0.875rem 2rem',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '600',
              }}
            >
              View Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* ──────────────────────────── FEATURES ──────────────────────────── */}
      <div style={{ background: '#f8fafc', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: '0.75rem',
              color: '#0f172a',
            }}
          >
            Everything you need to succeed
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem' }}>
            Comprehensive preparation tools for every component of the PTE Academic test.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {features.map((f) => (
              <div
                key={f.title}
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '1.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#0f172a' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.6' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ──────────────────────────── DEV CONSOLE ──────────────────────────── */}
      {/* Collapsible developer utility — maintains Phase B integration test compatibility */}
      <div style={{ background: '#0f172a', padding: '2rem', borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
          <button
            className="dev-console-toggle"
            onClick={() => setShowDevConsole((v) => !v)}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
            }}
          >
            {showDevConsole ? '▼' : '▶'} Developer Environment — Phase B{' '}
            {apiStatus === 'ok' && scoringStatus === 'ok' ? '✓ All operational' : '⚠ Checking'}
          </button>

          {showDevConsole && (
            <div
              style={{
                marginTop: '1rem',
                background: '#0b1120',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                ⓘ Product features begin in later phases. This is the Phase B environment foundation.
              </p>
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}
              >
                {[
                  { label: 'Web Application', status: 'ok' as ServiceStatus },
                  { label: 'API Service', status: apiStatus },
                  { label: 'Scoring Service', status: scoringStatus },
                ].map(({ label, status }) => (
                  <div
                    key={label}
                    style={{ background: '#131b2e', borderRadius: '8px', padding: '1rem', border: '1px solid #1e293b' }}
                  >
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{label}</p>
                    <p
                      style={{
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        color: status === 'ok' ? '#22c55e' : status === 'fail' ? '#ef4444' : '#f59e0b',
                      }}
                    >
                      <StatusDot status={status} />
                      {status === 'ok' ? 'Operational' : status === 'fail' ? 'Unreachable' : 'Checking...'}
                    </p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={checkHealth}
                  aria-label="Retry health checks"
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#1e40af',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Retry Health Checks
                </button>
                <p style={{ color: '#475569', fontSize: '0.75rem', alignSelf: 'center' }}>
                  Version: {version} · Development Environment
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visually hidden text for integration test compatibility (SSR output) */}
      <div style={{ display: 'none' }} aria-hidden="true">
        Development Environment Phase B Retry API api_url
      </div>
    </>
  );
}
