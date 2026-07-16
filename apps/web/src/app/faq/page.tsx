'use client';

import { useState } from 'react';
import { Container, Card } from '@pte-app/design-system';
import { FAQ_ITEMS } from '@/lib/mock-data';

export default function FAQPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <main>
      <Container>
        <div className="landing__section-header">
          <h1 className="landing__section-title">Frequently asked questions</h1>
          <p className="landing__section-subtitle">Everything you need to know before you start.</p>
        </div>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const id = `faq-${index}`;
            const isOpen = open === id;
            return (
              <Card key={id} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => setOpen(isOpen ? null : id)}
                  aria-expanded={isOpen}
                  aria-controls={id}
                >
                  <span>{item.question}</span>
                  <span className={`faq-icon ${isOpen ? 'faq-icon--open' : ''}`}>+</span>
                </button>
                {isOpen && (
                  <div id={id} className="faq-answer">
                    {item.answer}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </Container>
      <style>{`
        .faq-list { display: flex; flex-direction: column; gap: 1rem; max-width: 48rem; margin: 0 auto; }
        .faq-item { padding: 0; }
        .faq-question { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.5rem; background: none; border: none; color: var(--color-text); font-size: 1rem; font-weight: 600; text-align: left; cursor: pointer; }
        .faq-icon { font-size: 1.5rem; transition: transform 200ms ease; }
        .faq-icon--open { transform: rotate(45deg); }
        .faq-answer { padding: 0 1.5rem 1.5rem; color: var(--color-muted); font-size: 0.875rem; line-height: 1.6; }
      `}</style>
    </main>
  );
}
