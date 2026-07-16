import { Container, Card, Badge, Button, Progress } from '@pte-app/design-system';
import { MOCK_STUDENTS } from '@/lib/mock-data';

export const metadata = {
  title: 'Teacher Dashboard — PTE Academy',
  description: 'Teacher portal dashboard.',
};

export default function TeacherDashboard() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Teacher Dashboard</h1>
        <div className="status-grid">
          <Card>
            <h3 className="app-info-card__title">Active students</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>24</p>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Pending reviews</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>3</p>
            <Badge variant="warning">Needs attention</Badge>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Sessions today</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>5</p>
          </Card>
        </div>

        <h2 className="app-section__title" style={{ marginTop: '2rem' }}>Recent student activity</h2>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          {MOCK_STUDENTS.slice(0, 3).map((student) => (
            <Card key={student.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 className="landing__feature-title">{student.name}</h3>
                  <p className="landing__feature-desc">Target: {student.targetScore} · Current: {student.estimatedScore}</p>
                </div>
                <a href={`/teacher/students/${student.id}`}>
                  <Button size="sm">Review</Button>
                </a>
              </div>
              <Progress value={(student.estimatedScore / student.targetScore) * 100} />
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
