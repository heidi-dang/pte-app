import { Container, Card, Badge } from '@pte-app/design-system';
import { PageHeader } from '@/components/PageShell';
import { MOCK_ACHIEVEMENTS } from '@/lib/mock-data';

export const metadata = {
  title: 'Achievements — PTE Academy',
  description: 'Track your PTE Academy achievements and milestones.',
};

export default function AchievementsPage() {
  return (
    <main>
      <Container>
        <PageHeader title="Achievements" subtitle="Celebrate milestones on your PTE journey." />
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          {MOCK_ACHIEVEMENTS.map((ach) => (
            <Card key={ach.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>{ach.icon}</span>
                <div style={{ flex: 1 }}>
                  <h3 className="landing__feature-title">{ach.title}</h3>
                  <p className="landing__feature-desc">{ach.description}</p>
                  <div
                    style={{
                      height: '0.5rem',
                      background: 'var(--color-surface)',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      marginTop: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min((ach.progress / ach.total) * 100, 100)}%`,
                        height: '100%',
                        background: ach.unlocked ? '#16a34a' : 'var(--color-primary)',
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
                    {ach.progress} / {ach.total} · {ach.unlockedDate ? `Unlocked ${ach.unlockedDate}` : 'In progress'}
                  </p>
                </div>
                {ach.unlocked && <Badge variant="success">Unlocked</Badge>}
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
