'use client';

import { useState } from 'react';
import { Container, Card, Badge } from '@pte-app/design-system';

const FAQ_DATA = [
  {
    question: 'What is PTE Academic?',
    answer:
      'PTE Academic is a computer-based English test for international study and migration. It tests speaking, writing, reading, and listening in a single 2-hour session.',
  },
  {
    question: 'Are PTE Academy scores official?',
    answer:
      'No. Our platform provides estimated training scores and AI feedback to help you prepare. Only Pearson can issue official PTE scores.',
  },
  {
    question: 'Can I practise all PTE task types?',
    answer:
      'Yes. Premium and Pro plans include every PTE Academic task type, with timed prompts and AI feedback where applicable.',
  },
  {
    question: 'Do I need to install software?',
    answer: 'No. PTE Academy runs in your browser. For speaking tasks, you will need a microphone and a quiet room.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer:
      'You can cancel anytime from Account → Billing. Your access continues until the end of the current billing period.',
  },
  {
    question: 'How does the AI scoring work?',
    answer:
      'Our AI analyses your spoken and written responses against patterns from thousands of PTE practice sessions. Scores are estimates to guide your preparation, not official results.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes. The Free plan gives you limited daily practice and access to 3 lessons. You can upgrade to Premium or Pro at any time for unlimited access.',
  },
  {
    question: 'Can I use PTE Academy on mobile?',
    answer:
      'Yes. The platform is fully responsive and works on phones, tablets, and desktops through your web browser.',
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem 0 3rem' }}>
          <Badge style={{ marginBottom: '1rem', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Help Centre</Badge>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 800,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-display)',
              marginBottom: '0.75rem',
            }}
          >
            Frequently Asked Questions
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.125rem', maxWidth: '32rem', margin: '0 auto' }}>
            Everything you need to know before you start preparing with PTE Academy.
          </p>
        </div>

        <div style={{ maxWidth: '48rem', margin: '0 auto', paddingBottom: '4rem' }}>
          {FAQ_DATA.map((item, index) => {
            const isOpen = open === index;
            return (
              <Card
                key={index}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '0.75rem',
                  padding: 0,
                  overflow: 'hidden',
                  transition: 'border-color 200ms ease',
                  borderColor: isOpen ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '1.25rem 1.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text)',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <span>{item.question}</span>
                  <span
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 300,
                      lineHeight: 1,
                      color: isOpen ? 'var(--color-primary)' : 'var(--color-muted)',
                      transition: 'transform 200ms ease, color 200ms ease',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }}
                  >
                    +
                  </span>
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? '12rem' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 300ms ease',
                  }}
                >
                  <p
                    style={{
                      padding: '0 1.5rem 1.25rem',
                      color: 'var(--color-muted)',
                      fontSize: '0.875rem',
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {item.answer}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
