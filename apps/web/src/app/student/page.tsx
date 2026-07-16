import { Container, Card, Badge, Progress, StatCard, Button } from '@pte-app/design-system';
import {
  MOCK_ACTIVITIES,
  MOCK_ACHIEVEMENTS,
  SKILL_BREAKDOWN,
  UPCOMING_EXAM,
  formatDate,
  formatDuration,
} from '@/lib/mock-data';

export const metadata = {
  title: 'Student Dashboard — PTE Academy',
  description: 'Your PTE Academic study dashboard.',
};

export default function StudentDashboard() {
  return (
    <main>
      <Container>
        <div className="app-page-header">
          <div>
            <h1 className="app-page-header__title">Welcome back, Alex</h1>
            <p className="app-page-header__subtitle">
              Estimated training score: <strong>72</strong> · Target: <strong>79</strong>
            </p>
          </div>
          <div className="app-page-header__actions">
            <a href="/student/study-plan">
              <Button variant="secondary">Study plan</Button>
            </a>
            <a href="/mock-exam/lobby">
              <Button>Take mock exam</Button>
            </a>
          </div>
        </div>

        <div className="app-stat-grid">
          <StatCard title="Current streak" value="12 days" trend={{ value: 4, label: 'vs last week', positive: true }} />
          <StatCard title="This week" value="4h 20m" trend={{ value: 12, label: 'vs last week', positive: true }} />
          <StatCard title="Tasks completed" value="86" trend={{ value: 8, label: 'vs last week', positive: true }} />
          <StatCard title="Mock exams" value="4" trend={{ value: 1, label: 'this month', positive: true }} />
        </div>

        <div className="app-section" style={{ marginTop: '2rem' }}>
          <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
            <Card>
              <h3 className="app-info-card__title">Skill breakdown</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {[
                  { label: 'Speaking', value: SKILL_BREAKDOWN.speaking },
                  { label: 'Writing', value: SKILL_BREAKDOWN.writing },
                  { label: 'Reading', value: SKILL_BREAKDOWN.reading },
                  { label: 'Listening', value: SKILL_BREAKDOWN.listening },
                ].map((skill) => (
                  <div key={skill.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                      <span>{skill.label}</span>
                      <strong>{skill.value}</strong>
                    </div>
                    <Progress value={skill.value} />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="app-info-card__title">Upcoming exam</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <p><strong>Date:</strong> {UPCOMING_EXAM.date} at {UPCOMING_EXAM.time}</p>
                <p><strong>Location:</strong> {UPCOMING_EXAM.location}</p>
                <p><strong>Target score:</strong> {UPCOMING_EXAM.targetScore}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Badge variant="warning">{UPCOMING_EXAM.countdownDays} days left</Badge>
                <a href="/student/calendar">
                  <Button variant="secondary" size="sm">View calendar</Button>
                </a>
              </div>
            </Card>
          </div>
        </div>

        <div className="app-section">
          <h2 className="app-section__title">Today&apos;s study</h2>
          <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 className="app-info-card__title">Recommended next: Repeat Sentence Strategy</h3>
                  <p className="landing__feature-desc">A 26-minute lesson in Speaking Mastery.</p>
                </div>
                <a href="/learn/lessons/l-7">
                  <Button>Continue learning</Button>
                </a>
              </div>
            </Card>
          </div>
        </div>

        <div className="app-section">
          <h2 className="app-section__title">Recent activity</h2>
          <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
            {MOCK_ACTIVITIES.map((activity) => (
              <Card key={activity.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <Badge>{activity.type}</Badge>
                    <h3 className="landing__feature-title">{activity.title}</h3>
                    <p className="landing__feature-desc">{formatDate(activity.date)} · {formatDuration(activity.durationMinutes)}</p>
                  </div>
                  {activity.score !== undefined && <Badge variant="success">{activity.score}</Badge>}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="app-section">
          <h2 className="app-section__title">Achievements</h2>
          <div className="status-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {MOCK_ACHIEVEMENTS.slice(0, 4).map((ach) => (
              <Card key={ach.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{ach.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h3 className="landing__feature-title">{ach.title}</h3>
                    <p className="landing__feature-desc">{ach.description}</p>
                    <Progress value={(ach.progress / ach.total) * 100} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
                      {ach.progress} / {ach.total}
                    </p>
                  </div>
                  {ach.unlocked && <Badge variant="success">Unlocked</Badge>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
