import { Container, Card, Badge } from '@pte-app/design-system';

export const metadata = {
  title: 'Features — PTE Academy',
  description: 'Explore every feature of the PTE Academy preparation platform.',
};

const SECTIONS = [
  {
    label: 'Speaking & Writing',
    color: 'var(--color-primary)',
    title: 'Master Every Word',
    description:
      'Practice all speaking and writing task types with instant AI feedback on pronunciation, fluency, grammar, and vocabulary.',
    bullets: [
      'Read Aloud, Repeat Sentence, Describe Image, Retell Lecture',
      'Respond to Situation, Summarise Written Text, Write Essay',
      'AI scoring estimates for pronunciation, fluency, and content',
      'Side-by-side model answers and transcription review',
    ],
    mockup: {
      label: 'Pronunciation',
      score: '82/90',
      bar: 0.91,
      metrics: [
        { name: 'Content', value: 85 },
        { name: 'Form', value: 80 },
        { name: 'Vocabulary', value: 78 },
        { name: 'Grammar', value: 82 },
      ],
    },
  },
  {
    label: 'Reading & Listening',
    color: 'var(--color-accent-sky)',
    title: 'Train Your Comprehension',
    description:
      'Build reading speed and listening accuracy with realistic timed tasks that mirror the actual PTE Academic exam.',
    bullets: [
      'Fill in the Blanks, Re-order Paragraphs, Multiple Choice',
      'Highlight Correct Summary, Fill from Dictation',
      'Timed passages with adjustable difficulty',
      'Instant scoring with detailed answer explanations',
    ],
    mockup: {
      label: 'Reading Score',
      score: '74/90',
      bar: 0.82,
      metrics: [
        { name: 'Content', value: 76 },
        { name: 'Form', value: 72 },
        { name: 'Vocabulary', value: 70 },
        { name: 'Grammar', value: 74 },
      ],
    },
  },
  {
    label: 'Mock Exams',
    color: 'var(--color-accent-orange)',
    title: 'Simulate Test Day',
    description:
      'Run a full-length PTE Academic mock exam with device checks, countdown timer, question navigator, and end-of-test results review.',
    bullets: [
      'Full 2-hour simulated exam environment',
      'Device checks and timed sections like the real test',
      'Question navigator with flagged review markers',
      'Detailed results breakdown by skill and task type',
    ],
    mockup: {
      label: 'Overall Score',
      score: '79/90',
      bar: 0.88,
      metrics: [
        { name: 'Content', value: 82 },
        { name: 'Form', value: 78 },
        { name: 'Vocabulary', value: 80 },
        { name: 'Grammar', value: 76 },
      ],
    },
  },
];

export default function FeaturesPage() {
  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem 0 3rem' }}>
          <Badge style={{ marginBottom: '1rem', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
            Platform Features
          </Badge>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 800,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-display)',
              marginBottom: '0.75rem',
            }}
          >
            Built for PTE Excellence
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.125rem', maxWidth: '32rem', margin: '0 auto' }}>
            Everything you need to prepare for PTE Academic, from first practice to exam day.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '4rem' }}>
          {SECTIONS.map((section, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
                gap: '2rem',
                alignItems: 'center',
              }}
            >
              <div style={{ order: i % 2 === 0 ? 1 : 2 }}>
                <Badge
                  style={{
                    marginBottom: '0.75rem',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    background: `${section.color}18`,
                    color: section.color,
                    border: `1px solid ${section.color}30`,
                  }}
                >
                  {section.label}
                </Badge>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-display)',
                    marginBottom: '0.75rem',
                  }}
                >
                  {section.title}
                </h2>
                <p
                  style={{
                    color: 'var(--color-muted)',
                    fontSize: '0.9375rem',
                    lineHeight: 1.65,
                    marginBottom: '1.25rem',
                  }}
                >
                  {section.description}
                </p>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        fontSize: '0.8125rem',
                        color: 'var(--color-muted)',
                      }}
                    >
                      <span style={{ color: section.color, fontWeight: 700, marginTop: '0.1em' }}>✓</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Card
                style={{
                  order: i % 2 === 0 ? 2 : 1,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-muted)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {section.mockup.label}
                    </span>
                    <span
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: section.color,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {section.mockup.score}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      borderRadius: '3px',
                      background: 'var(--color-border)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${section.mockup.bar * 100}%`,
                        borderRadius: '3px',
                        background: `linear-gradient(90deg, ${section.color}, ${section.color}cc)`,
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {section.mockup.metrics.map((metric) => (
                      <div
                        key={metric.name}
                        style={{
                          padding: '0.75rem',
                          background: 'var(--color-bg)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--color-muted)',
                            marginBottom: '0.25rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {metric.name}
                        </div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)' }}>
                          {metric.value}/90
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}
