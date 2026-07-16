import { Container, Card, Badge, Button } from '@pte-app/design-system';
import { PageHeader } from '@/components/PageShell';
import { LISTENING_TASKS } from '@/lib/mock-data';

export const metadata = {
  title: 'Listening Practice — PTE Academy',
  description: 'Practise PTE Academic listening tasks.',
};

export default function ListeningPracticePage() {
  return (
    <main>
      <Container>
        <PageHeader title="Listening practice" subtitle="Train your ear for accents, spelling, and main ideas." />
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          {LISTENING_TASKS.map((task) => (
            <Card key={task.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 className="landing__feature-title">{task.title}</h3>
                  <p className="landing__feature-desc">{task.description}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <Badge variant={task.difficulty === 'Easy' ? 'success' : task.difficulty === 'Medium' ? 'warning' : 'danger'}>{task.difficulty}</Badge>
                    <Badge>{Math.floor(task.timeLimitSeconds / 60)} min</Badge>
                  </div>
                </div>
                <a href={`/practice/listening/${task.id}`}>
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
