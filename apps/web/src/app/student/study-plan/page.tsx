import { Container, Card, Button, Badge } from '@pte-app/design-system';
import { PageHeader } from '@/components/PageShell';

export const metadata = {
  title: 'Study Plan — PTE Academy',
  description: 'Your personalised PTE Academic study plan.',
};

const DAY_PLANS = [
  {
    day: 'Mon',
    minutes: 45,
    tasks: ['Read Aloud practice (20 min)', 'Repeat Sentence drills (15 min)', 'Essay template review (10 min)'],
  },
  { day: 'Tue', minutes: 35, tasks: ['Describe Image practice (20 min)', 'Summarise Written Text (15 min)'] },
  {
    day: 'Wed',
    minutes: 50,
    tasks: ['Retell Lecture drills (20 min)', 'Fill in the Blanks (15 min)', 'Write Essay (15 min)'],
  },
  { day: 'Thu', minutes: 30, tasks: ['Repeat Sentence drills (15 min)', 'Highlight Correct Summary (15 min)'] },
  { day: 'Fri', minutes: 40, tasks: ['Read Aloud practice (20 min)', 'Re-order Paragraphs (20 min)'] },
  {
    day: 'Sat',
    minutes: 55,
    tasks: ['Mock exam section practice (30 min)', 'Write from Dictation (15 min)', 'Review feedback (10 min)'],
  },
  { day: 'Sun', minutes: 20, tasks: ['Review weekly progress (20 min)'] },
];

export default function StudyPlanPage() {
  return (
    <main>
      <Container>
        <PageHeader title="Study planner" subtitle="Your weekly schedule to reach your target score of 79.">
          <Button variant="secondary">Regenerate plan</Button>
        </PageHeader>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          {DAY_PLANS.map(({ day, minutes, tasks }) => (
            <Card key={day}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}
              >
                <h3 className="app-info-card__title">{day}</h3>
                <Badge>{minutes} min</Badge>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tasks.map((task, i) => (
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
