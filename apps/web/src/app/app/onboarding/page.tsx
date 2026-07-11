'use client';

import { useState } from 'react';

const STEPS = [
  { id: 'profile', label: 'Your Profile', icon: '👤' },
  { id: 'targets', label: 'Set Targets', icon: '🎯' },
  { id: 'microphone', label: 'Microphone Check', icon: '🎙️' },
  { id: 'complete', label: 'Ready!', icon: '🚀' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [examDate, setExamDate] = useState('');
  const [targetScore, setTargetScore] = useState('65');
  const [micStatus, setMicStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');

  const checkMicrophone = async () => {
    setMicStatus('checking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus('ok');
    } catch {
      setMicStatus('error');
    }
  };

  const next = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>Welcome to PTE Academic</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Let's set up your account to personalise your learning journey.
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {STEPS.map((step, idx) => (
          <div
            key={step.id}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: idx < STEPS.length - 1 ? 1 : 'none' }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  idx < currentStep ? 'var(--success)' : idx === currentStep ? 'var(--primary)' : 'var(--border-color)',
                color: idx <= currentStep ? '#fff' : 'var(--text-muted)',
                fontSize: '1.1rem',
                fontWeight: '700',
                flexShrink: 0,
                transition: 'all 0.3s ease',
              }}
            >
              {idx < currentStep ? '✓' : step.icon}
            </div>
            {idx < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  background: idx < currentStep ? 'var(--success)' : 'var(--border-color)',
                  transition: 'background 0.3s ease',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="glass-card animate-slide" key={currentStep} style={{ minHeight: '280px' }}>
        {currentStep === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>👤 Your Profile</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Tell us a little about yourself so we can personalise your experience.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="ob-first-name">
                First Name
              </label>
              <input type="text" id="ob-first-name" className="form-input" placeholder="Jane" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ob-country">
                Country of Residence
              </label>
              <select id="ob-country" className="form-input" style={{ appearance: 'none' }}>
                <option>Australia</option>
                <option>United States</option>
                <option>India</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>🎯 Set Your Targets</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Enter your target PTE score (10–90) and exam date so your study plan can be calibrated.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="ob-target-score">
                Target Overall Score: <strong>{targetScore}</strong>
              </label>
              <input
                type="range"
                id="ob-target-score"
                min="10"
                max="90"
                step="1"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.25rem',
                }}
              >
                <span>10</span>
                <span>90</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ob-exam-date">
                Planned Exam Date
              </label>
              <input
                type="date"
                id="ob-exam-date"
                className="form-input"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>🎙️ Microphone Check</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Speaking tasks require microphone access. Click below to verify your device is ready.
            </p>
            <div
              className="premium-card"
              style={{
                textAlign: 'center',
                padding: '2rem',
                background:
                  micStatus === 'ok'
                    ? 'var(--success-bg)'
                    : micStatus === 'error'
                      ? 'var(--error-bg)'
                      : 'var(--bg-app)',
              }}
            >
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {micStatus === 'idle' ? '🎙️' : micStatus === 'checking' ? '⏳' : micStatus === 'ok' ? '✅' : '❌'}
              </p>
              <p
                style={{
                  fontWeight: '500',
                  color:
                    micStatus === 'ok'
                      ? 'var(--success)'
                      : micStatus === 'error'
                        ? 'var(--error)'
                        : 'var(--text-primary)',
                }}
              >
                {micStatus === 'idle' && 'Microphone not tested yet'}
                {micStatus === 'checking' && 'Requesting permission…'}
                {micStatus === 'ok' && 'Microphone is working!'}
                {micStatus === 'error' && 'Permission denied or no microphone found.'}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={checkMicrophone}
              disabled={micStatus === 'checking'}
              id="mic-check-btn"
            >
              {micStatus === 'checking' ? 'Checking...' : 'Test Microphone'}
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '4rem' }}>🚀</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>You're all set!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Your profile has been saved. Head to your dashboard to see your personalised study plan.
            </p>
            <a href="/app/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Go to Dashboard →
            </a>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {currentStep < STEPS.length - 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          {currentStep > 0 ? (
            <button type="button" className="btn btn-secondary" onClick={back}>
              ← Back
            </button>
          ) : (
            <div />
          )}
          <button type="button" className="btn btn-primary" onClick={next} id="ob-next-btn">
            {currentStep === STEPS.length - 2 ? 'Finish Setup →' : 'Next Step →'}
          </button>
        </div>
      )}
    </div>
  );
}
