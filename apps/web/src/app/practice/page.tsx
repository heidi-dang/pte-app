import { Container, Card, Badge } from '@pte-app/design-system';
import { PageHeader } from '@/components/PageShell';
import { SPEAKING_TASKS, WRITING_TASKS, READING_TASKS, LISTENING_TASKS } from '@/lib/mock-data';

export const metadata = {
  title: 'Practice — PTE Academy',
  description: 'Practise every PTE Academic task type with realistic prompts and AI feedback.',
};

function SkillCard({ title, href, count, tasks }: { title: string; href: string; count: number; tasks: { type: string; title: string; id: string }[] }) {
  return (
    <Card>
      <h3 className="landing__feature-title">{title}</h3>
      <p className="landing__feature-desc">{count} practice tasks available</p>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0' }}>
        {tasks.map((task) => (
          <li key={task.id}>
            <a href={`/practice/${href}/${task.id}`} style={{ fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{task.title}</span>
              <Badge variant="default">{task.type}</Badge>
            </a>
          </li>
        ))}
      </ul>
        <a href={`/practice/${href}`}>
        <Badge style={{ cursor: 'pointer' }}>View all</Badge>
      </a>
    </Card>
  );
}

export default function PracticeHubPage() {
  return (
    <main>
      <Container>
        <PageHeader title="Practice" subtitle="Choose a skill and task type to begin practising." />
        <div className="status-grid">
          <SkillCard title="Speaking" href="speaking" count={SPEAKING_TASKS.length} tasks={SPEAKING_TASKS} />
          <SkillCard title="Writing" href="writing" count={WRITING_TASKS.length} tasks={WRITING_TASKS} />
          <SkillCard title="Reading" href="reading" count={READING_TASKS.length} tasks={READING_TASKS} />
          <SkillCard title="Listening" href="listening" count={LISTENING_TASKS.length} tasks={LISTENING_TASKS} />
        </div>
      </Container>
    </main>
  );
}
