'use client';

import { useState } from 'react';
import { Container, Card, Button, Input, TextArea } from '@pte-app/design-system';

const FAQ_LINKS = [
  { q: 'How do I reset my password?', a: 'Go to Account → Security and click Reset Password.' },
  { q: 'How do I cancel my subscription?', a: 'Navigate to Account → Billing and select Cancel Plan.' },
  {
    q: 'Why is my AI score different from my last attempt?',
    a: 'Scores vary based on pronunciation, fluency, and content. Practise consistency.',
  },
];

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem 0 3rem' }}>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 800,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-display)',
              marginBottom: '0.75rem',
            }}
          >
            Support Center
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.125rem', maxWidth: '32rem', margin: '0 auto' }}>
            We&apos;re here to help. Reach out or check our quick answers below.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
            gap: '2rem',
            paddingBottom: '4rem',
          }}
        >
          <Card
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1.5rem' }}>
              Send us a message
            </h2>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    color: '#fff',
                    fontSize: '1.25rem',
                  }}
                >
                  ✓
                </div>
                <h3
                  style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}
                >
                  Message sent!
                </h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                  We&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Input
                  label="Name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Input
                  label="Subject"
                  placeholder="How can we help?"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                />
                <TextArea
                  label="Message"
                  placeholder="Describe your issue or question..."
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
                <Button type="submit" variant="primary" style={{ marginTop: '0.5rem', width: '100%' }}>
                  Send Message
                </Button>
              </form>
            )}
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Card
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem' }}>
                Quick Answers
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {FAQ_LINKS.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '1rem',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        marginBottom: '0.375rem',
                      }}
                    >
                      {item.q}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', lineHeight: 1.55 }}>{item.a}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(20,184,166,0.08))',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
                textAlign: 'center',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                Need urgent help?
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginBottom: '1rem', lineHeight: 1.55 }}>
                Email us directly at support@pteacademy.com and we&apos;ll respond within 4 hours.
              </p>
              <Button variant="secondary" size="sm">
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
