import { Container, Card, Badge, Button } from '@pte-app/design-system';
import { PageHeader } from '@/components/PageShell';
import { READING_TASKS } from '@/lib/mock-data';

export const metadata = {
  title: 'Reading Practice — PTE Academy',
  description: 'Practise PTE Academic reading tasks.',
};

export default function ReadingPracticePage() {
  return (
    <main>
      <Container>
        <PageHeader title="Reading practice" subtitle="Build speed, accuracy, and vocabulary." />
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          {READING_TASKS.map((task) => (
            <Card key={task.id}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h3 className="landing__feature-title">{task.title}</h3>
                  <p className="landing__feature-desc">{task.description}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <Badge
                      variant={
                        task.difficulty === 'Easy' ? 'success' : task.difficulty === 'Medium' ? 'warning' : 'danger'
                      }
                    >
                      {task.difficulty}
                    </Badge>
                    <Badge>{Math.floor(task.timeLimitSeconds / 60)} min</Badge>
                  </div>
                </div>
                <a href={`/practice/reading/${task.id}`}>
                  <Button>Practise</Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
