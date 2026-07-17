'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Button, Badge } from '@pte-app/design-system';
import { MOCK_TESTIMONIALS, MOCK_BLOG_POSTS } from '@/lib/mock-data';

const FEATURES = [
  {
    title: 'Pearson-Matching Interface',
    desc: 'Practise in an interface modelled on the real PTE Academic test. Timed sections, question navigators, and authentic task layouts build familiarity before test day.',
    icon: '🖥️',
  },
  {
    title: 'AI Pronunciation Analysis',
    desc: 'Receive estimated training scores on pronunciation, fluency, and oral fluency. The AI breaks down every response with actionable feedback you can act on immediately.',
    icon: '🎙️',
  },
  {
    title: 'Academic Template Suite',
    desc: 'Ready-to-use essay and speaking templates reviewed by PTE instructors. Learn when templates help and when they limit your score potential.',
    icon: '📝',
  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="landing">
      <section className="landing__hero">
        <Container>
          <div className="landing__hero-content">
            <Badge variant="success">Updated for 2026 Pearson Guidelines</Badge>
            <h1 className="landing__title">Master PTE Academic with AI-Powered Practice</h1>
            <p className="landing__subtitle">
              Your all-in-one PTE practice portal. Adaptive lessons, realistic mock exams, and instant AI feedback for
              every task type. Prepare smarter, track estimated scores, and reach your target score faster.
            </p>
            <div className="landing__hero-actions">
              <a href="/register">
                <Button size="lg">Start Free Practice</Button>
              </a>
              <a href="/pricing">
                <Button variant="secondary" size="lg">
                  View Plans
                </Button>
              </a>
            </div>
            <div className="landing__metrics">
              {[
                { value: '98%', label: 'Pass Rate' },
                { value: '22', label: 'Task Types' },
                { value: 'AI', label: 'Scoring' },
                { value: '12k+', label: 'Students' },
              ].map((m) => (
                <div key={m.label} className="landing__metric">
                  <span className="landing__metric-value">{m.value}</span>
                  <span className="landing__metric-label">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="landing__section">
        <Container>
          <div className="landing__section-header">
            <h2 className="landing__section-title">Everything you need to succeed</h2>
            <p className="landing__section-subtitle">
              A complete preparation platform built around the real PTE Academic experience.
            </p>
          </div>
          <div className="landing__features">
            {FEATURES.map((f) => (
              <Card key={f.title} className="landing__feature-card">
                <span className="landing__feature-icon">{f.icon}</span>
                <h3 className="landing__feature-title">{f.title}</h3>
                <p className="landing__feature-desc">{f.desc}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="landing__section landing__section--muted">
        <Container>
          <div className="landing__section-header">
            <h2 className="landing__section-title">What students say</h2>
            <p className="landing__section-subtitle">Real results from students using PTE Academy every day.</p>
          </div>
          <div className="landing__testimonials">
            {MOCK_TESTIMONIALS.slice(0, 4).map((t) => (
              <Card key={t.id} className="landing__testimonial-card">
                <Badge variant="success">Estimated Score {t.score}</Badge>
                <p className="landing__testimonial-text">&ldquo;{t.text}&rdquo;</p>
                <div className="landing__testimonial-author">
                  <strong>{t.name}</strong>
                  <span>
                    {t.role} · {t.country}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="landing__section">
        <Container>
          <div className="landing__section-header">
            <h2 className="landing__section-title">Latest from the blog</h2>
            <p className="landing__section-subtitle">
              Tips, strategies, and success stories from the PTE Academy team.
            </p>
          </div>
          <div className="landing__blog-grid">
            {MOCK_BLOG_POSTS.slice(0, 3).map((post) => (
              <Card key={post.id} className="landing__blog-card">
                <Badge>{post.category}</Badge>
                <h3 className="landing__blog-title">{post.title}</h3>
                <p className="landing__blog-excerpt">{post.excerpt}</p>
                <p className="landing__blog-meta">
                  {post.author} · {post.date}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="landing__cta">
        <Container>
          <div className="landing__cta-inner">
            <h2 className="landing__cta-title">Ready to reach your PTE goal?</h2>
            <p className="landing__cta-subtitle">
              Join thousands of students who use PTE Academy every day to prepare with confidence.
            </p>
            <div className="landing__cta-actions">
              <a href="/register">
                <Button size="lg">Create account</Button>
              </a>
              <a href="/login">
                <Button variant="secondary" size="lg">
                  Log in
                </Button>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {mounted && (
        <style>{`
          .landing__hero {
            padding: 5rem 0 4rem;
            background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
            color: #e2e8f0;
          }
          .landing__hero-content {
            max-width: 48rem;
            margin: 0 auto;
            text-align: center;
          }
          .landing__hero .ds-badge {
            margin-bottom: 1.5rem;
          }
          .landing__title {
            font-size: 2.5rem;
            font-weight: 800;
            margin: 1rem 0;
            line-height: 1.1;
            background: linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          @media (min-width: 640px) {
            .landing__title {
              font-size: 3.5rem;
            }
          }
          @media (min-width: 1024px) {
            .landing__title {
              font-size: 4rem;
            }
          }
          .landing__subtitle {
            font-size: 1.125rem;
            color: #94a3b8;
            margin-bottom: 2rem;
            max-width: 36rem;
            margin-left: auto;
            margin-right: auto;
            line-height: 1.7;
          }
          .landing__hero-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 3rem;
          }
          .landing__metrics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            max-width: 36rem;
            margin: 0 auto;
          }
          @media (min-width: 640px) {
            .landing__metrics {
              grid-template-columns: repeat(4, 1fr);
            }
          }
          .landing__metric {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem;
            border-radius: 0.75rem;
            background: rgba(16, 185, 129, 0.08);
            border: 1px solid rgba(16, 185, 129, 0.15);
          }
          .landing__metric-value {
            font-size: 1.5rem;
            font-weight: 800;
            color: #10b981;
          }
          .landing__metric-label {
            font-size: 0.75rem;
            color: #94a3b8;
            margin-top: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .landing__section {
            padding: 5rem 0;
          }
          .landing__section--muted {
            background: var(--color-surface, #f8fafc);
          }
          .landing__section-header {
            text-align: center;
            max-width: 36rem;
            margin: 0 auto 3rem;
          }
          .landing__section-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
            color: var(--color-text, #0f172a);
          }
          .landing__section-subtitle {
            color: var(--color-muted, #64748b);
            font-size: 1.05rem;
          }

          .landing__features {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          @media (min-width: 768px) {
            .landing__features {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          .landing__feature-card {
            padding: 2rem;
            border: 1px solid var(--color-border, #e2e8f0);
            transition: border-color 200ms ease, box-shadow 200ms ease;
          }
          .landing__feature-card:hover {
            border-color: #10b981;
            box-shadow: 0 4px 24px rgba(16, 185, 129, 0.08);
          }
          .landing__feature-icon {
            font-size: 2rem;
            display: block;
            margin-bottom: 1rem;
          }
          .landing__feature-title {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: var(--color-text, #0f172a);
          }
          .landing__feature-desc {
            font-size: 0.9375rem;
            color: var(--color-muted, #64748b);
            line-height: 1.6;
          }

          .landing__testimonials {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          @media (min-width: 768px) {
            .landing__testimonials {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (min-width: 1024px) {
            .landing__testimonials {
              grid-template-columns: repeat(4, 1fr);
            }
          }
          .landing__testimonial-card {
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .landing__testimonial-text {
            font-size: 0.9375rem;
            color: var(--color-text, #0f172a);
            line-height: 1.6;
            flex: 1;
          }
          .landing__testimonial-author {
            display: flex;
            flex-direction: column;
            font-size: 0.875rem;
          }
          .landing__testimonial-author strong {
            color: var(--color-text, #0f172a);
          }
          .landing__testimonial-author span {
            color: var(--color-muted, #64748b);
          }

          .landing__blog-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          @media (min-width: 768px) {
            .landing__blog-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          .landing__blog-card {
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .landing__blog-card .ds-badge {
            align-self: flex-start;
          }
          .landing__blog-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: var(--color-text, #0f172a);
            margin-top: 0.5rem;
          }
          .landing__blog-excerpt {
            font-size: 0.9375rem;
            color: var(--color-muted, #64748b);
            line-height: 1.6;
          }
          .landing__blog-meta {
            font-size: 0.75rem;
            color: var(--color-muted, #94a3b8);
            margin-top: auto;
            padding-top: 0.5rem;
          }

          .landing__cta {
            padding: 5rem 0;
            background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
            color: #ffffff;
          }
          .landing__cta-inner {
            text-align: center;
            max-width: 36rem;
            margin: 0 auto;
          }
          .landing__cta-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
          }
          .landing__cta-subtitle {
            opacity: 0.9;
            margin-bottom: 1.5rem;
            font-size: 1.05rem;
            line-height: 1.6;
          }
          .landing__cta-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
          }
          .landing__cta .ds-button {
            background: #ffffff;
            color: #059669;
          }
          .landing__cta .ds-button:hover {
            background: #f0fdf4;
          }
          .landing__cta .ds-button--secondary {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.3);
          }
          .landing__cta .ds-button--secondary:hover {
            background: rgba(255, 255, 255, 0.25);
          }
        `}</style>
      )}
    </div>
  );
}
