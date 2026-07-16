import { Container, Card, Button, Badge } from '@pte-app/design-system';
import { PageHeader } from '@/components/PageShell';

export const metadata = {
  title: 'Study Plan — PTE Academy',
  description: 'Your personalised PTE Academic study plan.',
};

export default function StudyPlanPage() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <main>
      <Container>
        <PageHeader title="Study planner" subtitle="Your weekly schedule to reach your target score of 79.">
          <Button variant="secondary">Regenerate plan</Button>
        </PageHeader>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          {days.map((day) => (
            <Card key={day}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}
              >
                <h3 className="app-info-card__title">{day}</h3>
                <Badge>{Math.floor(Math.random() * 40) + 20} min</Badge>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['Read Aloud practice (20 min)', 'Repeat Sentence drills (15 min)', 'Essay template review (10 min)']
                  .slice(0, Math.floor(Math.random() * 2) + 2)
                  .map((task, i) => (
                    <li key={i} style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                      {task}
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
