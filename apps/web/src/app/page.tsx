'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Button, Badge } from '@pte-app/design-system';
import { MOCK_TESTIMONIALS, MOCK_BLOG_POSTS } from '@/lib/mock-data';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="landing">
      <section className="landing__hero">
        <Container>
          <div className="landing__hero-inner">
            <div className="landing__hero-content">
              <Badge variant="success">Trusted by 12,000+ students</Badge>
              <span className="landing__eyebrow">PTE Academic Platform</span>
              <h1 className="landing__title">Master PTE Academic with AI-Powered Practice</h1>
              <p className="landing__subtitle">
                Adaptive lessons, realistic mock exams, and instant AI feedback for every PTE task type.
                Prepare smarter, track progress, and reach your target score faster.
              </p>
              <div className="landing__hero-actions">
                <a href="/register">
                  <Button size="lg">Start free trial</Button>
                </a>
                <a href="/practice">
                  <Button variant="secondary" size="lg">Try a practice task</Button>
                </a>
              </div>
              <div className="landing__trust">
                <div className="landing__avatars">
                  {['AJ', 'PS', 'WC', 'MG'].map((initials, i) => (
                    <span key={i} className="landing__avatar">
                      {initials}
                    </span>
                  ))}
                </div>
                <p className="landing__trust-text">Students improved an average of <strong>12 points</strong> in 6 weeks</p>
              </div>
            </div>
            <div className="landing__hero-visual">
              <div className="landing__score-card">
                <div className="landing__score-header">
                  <span>Estimated score</span>
                  <Badge variant="success">+8 this month</Badge>
                </div>
                <div className="landing__score-value">72</div>
                <div className="landing__score-bars">
                  {[
                    { label: 'Speaking', value: 72 },
                    { label: 'Writing', value: 74 },
                    { label: 'Reading', value: 78 },
                    { label: 'Listening', value: 71 },
                  ].map((skill) => (
                    <div key={skill.label} className="landing__score-bar">
                      <span>{skill.label}</span>
                      <div className="landing__score-track">
                        <div className="landing__score-fill" style={{ width: `${skill.value}%` }} />
                      </div>
                      <span>{skill.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="landing__section landing__section--muted">
        <Container>
          <div className="landing__section-header">
            <h2 className="landing__section-title">Everything you need to succeed</h2>
            <p className="landing__section-subtitle">
              A complete preparation platform built around the real PTE Academic experience.
            </p>
          </div>
          <div className="status-grid">
            {[
              {
                title: 'All 20 PTE task types',
                desc: 'Speaking, writing, reading, and listening tasks with timed prompts and authentic practice materials.',
              },
              {
                title: 'Instant AI feedback',
                desc: 'Get actionable feedback on pronunciation, fluency, grammar, vocabulary, content, and form.',
              },
              {
                title: 'Structured courses',
                desc: 'Self-paced video lessons, transcripts, notes, quizzes, and progress tracking from day one.',
              },
              {
                title: 'Full mock exams',
                desc: 'Simulate test-day conditions with device checks, timers, question navigator, and score estimates.',
              },
              {
                title: 'Personalised study plan',
                desc: 'AI recommends your next lesson and practice task based on strengths and weaknesses.',
              },
              {
                title: 'Teacher support',
                desc: 'Premium students can request expert reviews, schedule sessions, and receive written feedback.',
              },
            ].map((feature, i) => (
              <Card key={i}>
                <h3 className="landing__feature-title">{feature.title}</h3>
                <p className="landing__feature-desc">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="landing__section">
        <Container>
          <div className="landing__section-header">
            <h2 className="landing__section-title">What students say</h2>
          </div>
          <div className="status-grid">
            {MOCK_TESTIMONIALS.slice(0, 3).map((t) => (
              <Card key={t.id}>
                <div className="landing__testimonial-score">
                  <Badge variant="success">Score {t.score}</Badge>
                </div>
                <p className="landing__testimonial-text">&ldquo;{t.text}&rdquo;</p>
                <div className="landing__testimonial-author">
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="landing__section landing__section--muted">
        <Container>
          <div className="landing__section-header">
            <h2 className="landing__section-title">Latest from the blog</h2>
          </div>
          <div className="status-grid">
            {MOCK_BLOG_POSTS.slice(0, 3).map((post) => (
              <Card key={post.id}>
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

      <section className="landing__section landing__section--muted">
        <Container>
          <div className="landing__section-header">
            <h2 className="landing__section-title">Platform status</h2>
            <p className="landing__section-subtitle">Live service health for the PTE Academic Platform.</p>
          </div>
          <div className="status-grid">
            <Card>
              <h3>Web Application</h3>
              <Badge variant="success">Operational</Badge>
            </Card>
            <Card>
              <h3>API Service</h3>
              <Badge variant="success">Operational</Badge>
            </Card>
            <Card>
              <h3>Scoring Service</h3>
              <Badge variant="success">Operational</Badge>
            </Card>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Button variant="secondary">Retry health checks</Button>
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
                <Button variant="secondary" size="lg">Log in</Button>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {mounted && (
        <style>{`
          .landing__hero {
            padding: 4rem 0;
            background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg) 100%);
          }
          .landing__hero-inner {
            display: grid;
            gap: 3rem;
            align-items: center;
          }
          @media (min-width: 1024px) {
            .landing__hero-inner {
              grid-template-columns: 1fr 1fr;
            }
          }
          .landing__eyebrow {
            display: block;
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--color-primary);
            margin-bottom: 0.5rem;
          }
          .landing__title {
            font-size: 2.5rem;
            font-weight: 800;
            margin: 1rem 0;
            color: var(--color-text);
            line-height: 1.1;
          }
          @media (min-width: 640px) {
            .landing__title {
              font-size: 3.5rem;
            }
          }
          .landing__subtitle {
            font-size: 1.125rem;
            color: var(--color-muted);
            margin-bottom: 1.5rem;
            max-width: 32rem;
          }
          .landing__hero-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .landing__trust {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .landing__avatars {
            display: flex;
          }
          .landing__avatar {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 9999px;
            background: var(--color-primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
            border: 2px solid var(--color-bg);
            margin-left: -0.75rem;
          }
          .landing__avatar:first-child {
            margin-left: 0;
          }
          .landing__trust-text {
            font-size: 0.875rem;
            color: var(--color-muted);
          }
          .landing__trust-text strong {
            color: var(--color-text);
          }
          .landing__hero-visual {
            display: flex;
            justify-content: center;
          }
          .landing__score-card {
            width: 100%;
            max-width: 24rem;
            background: var(--color-bg);
            border: 1px solid var(--color-border);
            border-radius: 1rem;
            box-shadow: 0 12px 40px var(--color-shadow);
            padding: 1.5rem;
          }
          .landing__score-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            font-size: 0.875rem;
            color: var(--color-muted);
          }
          .landing__score-value {
            font-size: 4rem;
            font-weight: 800;
            color: var(--color-primary);
            line-height: 1;
            margin-bottom: 1.5rem;
          }
          .landing__score-bars {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .landing__score-bar {
            display: grid;
            grid-template-columns: 5.5rem 1fr 2rem;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.75rem;
            color: var(--color-muted);
          }
          .landing__score-track {
            height: 0.5rem;
            background: var(--color-surface);
            border-radius: 9999px;
            overflow: hidden;
          }
          .landing__score-fill {
            height: 100%;
            background: var(--color-primary);
            border-radius: 9999px;
            transition: width 800ms ease;
          }
          .landing__section {
            padding: 4rem 0;
          }
          .landing__section--muted {
            background: var(--color-surface);
          }
          .landing__section-header {
            text-align: center;
            max-width: 36rem;
            margin: 0 auto 2.5rem;
          }
          .landing__section-title {
            font-size: 1.875rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
          }
          .landing__section-subtitle {
            color: var(--color-muted);
          }
          .landing__feature-title {
            font-size: 1.125rem;
            margin: 0.75rem 0 0.5rem;
          }
          .landing__feature-desc {
            font-size: 0.875rem;
            color: var(--color-muted);
          }
          .landing__testimonial-score {
            margin-bottom: 1rem;
          }
          .landing__testimonial-text {
            font-size: 1rem;
            color: var(--color-text);
            margin-bottom: 1rem;
            line-height: 1.6;
          }
          .landing__testimonial-author {
            display: flex;
            flex-direction: column;
            font-size: 0.875rem;
          }
          .landing__testimonial-author span {
            color: var(--color-muted);
          }
          .landing__blog-title {
            font-size: 1.125rem;
            margin: 0.75rem 0 0.5rem;
          }
          .landing__blog-excerpt {
            font-size: 0.875rem;
            color: var(--color-muted);
            margin-bottom: 1rem;
          }
          .landing__blog-meta {
            font-size: 0.75rem;
            color: var(--color-muted);
          }
          .landing__cta {
            padding: 4rem 0;
            background: var(--color-primary);
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
          }
          .landing__cta-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
          }
          .landing__cta .ds-button {
            background: #ffffff;
            color: var(--color-primary);
          }
          .landing__cta .ds-button--secondary {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.3);
          }
        `}</style>
      )}
    </div>
  );
}
