import { Container, Card, Button, Progress, Tabs } from '@pte-app/design-system';
import { MOCK_STUDENTS } from '@/lib/mock-data';

export const metadata = {
  title: 'Student Profile — PTE Academy',
  description: 'Review student progress and provide feedback.',
};

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = MOCK_STUDENTS.find((s) => s.id === id) ||
    MOCK_STUDENTS[0] || {
      id: 'unknown',
      name: 'Unknown student',
      email: '-',
      targetScore: 0,
      estimatedScore: 0,
      streakDays: 0,
      joinDate: '',
      plan: 'free',
      country: '',
      timezone: '',
      goals: [],
    };

  return (
    <main>
      <Container>
        <div className="app-page-header">
          <div>
            <h1 className="app-page-header__title">{student.name}</h1>
            <p className="app-page-header__subtitle">{student.email}</p>
          </div>
          <a href="/teacher/students">
            <Button variant="secondary">Back to students</Button>
          </a>
        </div>

        <div className="status-grid" style={{ marginBottom: '1.5rem' }}>
          <Card>
            <h3 className="app-info-card__title">Target score</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{student.targetScore}</p>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Estimated score</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{student.estimatedScore}</p>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Streak</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{student.streakDays} days</p>
          </Card>
        </div>

        <Tabs
          defaultTab="progress"
          tabs={[
            {
              id: 'progress',
              label: 'Progress',
              content: (
                <Card>
                  <h3 className="app-info-card__title">Skill progress</h3>
                  {[
                    { label: 'Speaking', value: 72 },
                    { label: 'Writing', value: 74 },
                    { label: 'Reading', value: 78 },
                    { label: 'Listening', value: 71 },
                  ].map((skill) => (
                    <div key={skill.label} style={{ marginBottom: '0.75rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.875rem',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <span>{skill.label}</span>
                        <strong>{skill.value}</strong>
                      </div>
                      <Progress value={skill.value} />
                    </div>
                  ))}
                </Card>
              ),
            },
            {
              id: 'feedback',
              label: 'Feedback',
              content: (
                <Card>
                  <h3 className="app-info-card__title">Teacher feedback</h3>
                  <p className="landing__feature-desc">No feedback yet. Write a note to help this student improve.</p>
                  <Button style={{ marginTop: '1rem' }}>Add feedback</Button>
                </Card>
              ),
            },
          ]}
        />
      </Container>
    </main>
  );
}
