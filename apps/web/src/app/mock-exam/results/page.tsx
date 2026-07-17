'use client';

import { Container, Card, Button, Badge, Progress, Tabs } from '@pte-app/design-system';
import { ChartBar, ChartDonut } from '@pte-app/design-system';

export default function MockExamResultsPage() {
  const skillData = [
    { label: 'Speaking', value: 72 },
    { label: 'Writing', value: 74 },
    { label: 'Reading', value: 78 },
    { label: 'Listening', value: 71 },
  ];

  const donutSegments = [
    { label: 'Correct', value: 42, color: '#16a34a' },
    { label: 'Partial', value: 18, color: '#eab308' },
    { label: 'Incorrect', value: 10, color: '#dc2626' },
  ];

  return (
    <main>
      <Container>
        <div className="app-page-header">
          <div>
            <h1 className="app-page-header__title">Mock exam results</h1>
            <p className="app-page-header__subtitle">Full Mock Exam #4 · Completed 14 July 2026</p>
          </div>
          <div className="app-page-header__actions">
            <a href="/mock-exam/review">
              <Button variant="secondary">Review answers</Button>
            </a>
            <a href="/mock-exam/history">
              <Button variant="secondary">History</Button>
            </a>
          </div>
        </div>

        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '1.5rem' }}>
          <Card style={{ textAlign: 'center' }}>
            <p className="landing__feature-desc">Estimated overall score</p>
            <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--color-primary)' }}>73</div>
            <Badge variant="success">+3 vs last mock</Badge>
          </Card>
          <Card>
            <ChartBar data={skillData} max={90} />
          </Card>
        </div>

        <Tabs
          defaultTab="skills"
          tabs={[
            {
              id: 'skills',
              label: 'Skills',
              content: (
                <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
                  {skillData.map((skill) => (
                    <Card key={skill.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong>{skill.label}</strong>
                        <span>{skill.value}</span>
                      </div>
                      <Progress value={(skill.value / 90) * 100} />
                    </Card>
                  ))}
                </div>
              ),
            },
            {
              id: 'accuracy',
              label: 'Accuracy',
              content: (
                <Card>
                  <ChartDonut segments={donutSegments} />
                </Card>
              ),
            },
            {
              id: 'feedback',
              label: 'AI feedback',
              content: (
                <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
                  <Card>
                    <h3 className="app-info-card__title">Speaking</h3>
                    <p className="landing__feature-desc">
                      Strong fluency. Work on word stress at the end of sentences.
                    </p>
                  </Card>
                  <Card>
                    <h3 className="app-info-card__title">Writing</h3>
                    <p className="landing__feature-desc">
                      Good structure. Add more academic vocabulary and complex sentences.
                    </p>
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Container>
    </main>
  );
}
