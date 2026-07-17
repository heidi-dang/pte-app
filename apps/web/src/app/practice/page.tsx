import { Container, Card, Button, Badge } from '@pte-app/design-system';
import { SPEAKING_TASKS, WRITING_TASKS, READING_TASKS, LISTENING_TASKS, type MockPracticeTask } from '@/lib/mock-data';

export const metadata = {
  title: 'Practice Hub — PTE Academy',
  description: 'Master all 22 PTE task types with targeted practice across Speaking, Writing, Reading and Listening.',
};

const SKILL_SECTIONS: {
  skill: string;
  slug: string;
  tasks: MockPracticeTask[];
  icon: string;
  gradient: string;
}[] = [
  {
    skill: 'Speaking',
    slug: 'speaking',
    tasks: SPEAKING_TASKS,
    icon: '🎤',
    gradient: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
  },
  {
    skill: 'Writing',
    slug: 'writing',
    tasks: WRITING_TASKS,
    icon: '✍️',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  },
  {
    skill: 'Reading',
    slug: 'reading',
    tasks: READING_TASKS,
    icon: '📖',
    gradient: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
  },
  {
    skill: 'Listening',
    slug: 'listening',
    tasks: LISTENING_TASKS,
    icon: '🎧',
    gradient: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)',
  },
];

function SkillSection({ section }: { section: (typeof SKILL_SECTIONS)[number] }) {
  return (
    <Card className="practice-skill-card">
      <div className="practice-skill-header" style={{ background: section.gradient }}>
        <span className="practice-skill-icon">{section.icon}</span>
        <div>
          <h3 className="practice-skill-title">{section.skill}</h3>
          <p className="practice-skill-count">{section.tasks.length} task types</p>
        </div>
      </div>
      <ul className="practice-task-list">
        {section.tasks.map((task) => (
          <li key={task.id} className="practice-task-item">
            <a href={`/practice/${section.slug}/${task.id}`} className="practice-task-link">
              <span className="practice-task-name">{task.title}</span>
              <div className="practice-task-meta">
                <Badge
                  variant={task.difficulty === 'Easy' ? 'success' : task.difficulty === 'Medium' ? 'warning' : 'danger'}
                >
                  {task.difficulty}
                </Badge>
              </div>
            </a>
          </li>
        ))}
      </ul>
      <div className="practice-skill-footer">
        <a href={`/practice/${section.slug}`}>
          <Button variant="secondary" size="sm">
            View all {section.skill} tasks
          </Button>
        </a>
      </div>
    </Card>
  );
}

export default function PracticeHubPage() {
  return (
    <main className="practice-hub">
      <Container>
        <div className="practice-hub-header">
          <h1 className="practice-hub-title">Practice Hub</h1>
          <p className="practice-hub-subtitle">Master all 22 PTE task types with targeted practice</p>
        </div>

        {/* TODO: Replace mock task lists with real catalogue API once Phase H backend is live */}

        <div className="practice-grid">
          {SKILL_SECTIONS.map((section) => (
            <SkillSection key={section.slug} section={section} />
          ))}
        </div>

        {/* TODO: Add progress summary cards (completed tasks, streak, avg score) from backend */}
      </Container>

      <style>{`
        .practice-hub {
          min-height: 100vh;
          padding: 3rem 0 4rem;
          background: var(--color-bg, #0a0f1a);
        }

        .practice-hub-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .practice-hub-title {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #2dd4bf 0%, #5eead4 50%, #99f6e4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.75rem;
        }

        .practice-hub-subtitle {
          font-size: 1.125rem;
          color: var(--color-muted, #94a3b8);
          max-width: 32rem;
          margin: 0 auto;
          line-height: 1.6;
        }

        .practice-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .practice-grid {
            grid-template-columns: 1fr;
          }
        }

        .practice-skill-card {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(45, 212, 191, 0.1) !important;
          border-radius: 1rem !important;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .practice-skill-card:hover {
          border-color: rgba(45, 212, 191, 0.25) !important;
          box-shadow: 0 0 30px rgba(45, 212, 191, 0.06);
        }

        .practice-skill-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
        }

        .practice-skill-icon {
          font-size: 2rem;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
        }

        .practice-skill-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .practice-skill-count {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0.125rem 0 0;
        }

        .practice-task-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .practice-task-item {
          border-top: 1px solid rgba(45, 212, 191, 0.06);
        }

        .practice-task-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          text-decoration: none;
          color: var(--color-text, #e2e8f0);
          font-size: 0.9rem;
          transition: background 0.15s ease;
        }

        .practice-task-link:hover {
          background: rgba(45, 212, 191, 0.04);
        }

        .practice-task-name {
          font-weight: 500;
        }

        .practice-task-meta {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .practice-skill-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(45, 212, 191, 0.06);
          display: flex;
          justify-content: center;
        }
      `}</style>
    </main>
  );
}
