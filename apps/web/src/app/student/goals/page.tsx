import { Container, Card, Button } from '@pte-app/design-system';
import { PageHeader } from '@/components/PageShell';

export const metadata = {
  title: 'Goals — PTE Academy',
  description: 'Set and track your PTE Academic goals.',
};

export default function GoalsPage() {
  return (
    <main>
      <Container>
        <PageHeader title="Goals" subtitle="Define clear targets and track your progress.">
          <Button>Add goal</Button>
        </PageHeader>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          {[
            { title: 'Target overall score', current: 72, target: 79, deadline: '2026-08-12' },
            { title: 'Speaking score', current: 72, target: 79, deadline: '2026-07-30' },
            { title: 'Writing score', current: 74, target: 79, deadline: '2026-08-05' },
            { title: 'Complete 100 practice tasks', current: 86, target: 100, deadline: '2026-08-10' },
          ].map((goal, i) => (
            <Card key={i}>
              <h3 className="app-info-card__title">{goal.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <strong>{goal.current}</strong>
                <span style={{ color: 'var(--color-muted)' }}>/ {goal.target}</span>
              </div>
              <div
                style={{
                  height: '0.5rem',
                  background: 'var(--color-surface)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min((goal.current / goal.target) * 100, 100)}%`,
                    height: '100%',
                    background: 'var(--color-primary)',
                    borderRadius: '9999px',
                  }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>
                Deadline: {goal.deadline}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
