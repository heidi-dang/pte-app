import { Container, Card, Badge, Button, Progress, Tabs } from '@pte-app/design-system';
import { ChartBar, ChartLine } from '@pte-app/design-system';
import { MOCK_ACHIEVEMENTS, SKILL_BREAKDOWN, WEEKLY_PROGRESS, MONTHLY_TREND, CALENDAR_HEATMAP } from '@/lib/mock-data';

export const metadata = {
  title: 'Progress — PTE Academy',
  description: 'Track your PTE Academic preparation progress.',
};

export default function ProgressPage() {
  const skillData = [
    { label: 'Speaking', value: SKILL_BREAKDOWN.speaking },
    { label: 'Writing', value: SKILL_BREAKDOWN.writing },
    { label: 'Reading', value: SKILL_BREAKDOWN.reading },
    { label: 'Listening', value: SKILL_BREAKDOWN.listening },
  ];

  return (
    <main>
      <Container>
        <div className="app-page-header">
          <div>
            <h1 className="app-page-header__title">Progress</h1>
            <p className="app-page-header__subtitle">Track your improvement across every skill.</p>
          </div>
          <div className="app-page-header__actions">
            <a href="/progress/certificates">
              <Button variant="secondary">Certificates</Button>
            </a>
          </div>
        </div>

        <div className="status-grid" style={{ marginBottom: '1.5rem' }}>
          {skillData.map((skill) => (
            <Card key={skill.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-muted)' }}>{skill.label}</span>
                <strong>{skill.value}</strong>
              </div>
              <Progress value={(skill.value / 90) * 100} />
            </Card>
          ))}
        </div>

        <Tabs
          defaultTab="overview"
          tabs={[
            {
              id: 'overview',
              label: 'Overview',
              content: (
                <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
                  <Card>
                    <h3 className="app-info-card__title">Estimated score trend</h3>
                    <ChartLine data={MONTHLY_TREND} />
                  </Card>
                  <Card>
                    <h3 className="app-info-card__title">Weekly study time</h3>
                    <ChartBar data={WEEKLY_PROGRESS} />
                  </Card>
                </div>
              ),
            },
            {
              id: 'heatmap',
              label: 'Study calendar',
              content: (
                <Card>
                  <h3 className="app-info-card__title">Last 30 days</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
                    {CALENDAR_HEATMAP.map((day) => {
                      const intensity = day.value > 90 ? 1 : day.value > 60 ? 0.7 : day.value > 30 ? 0.4 : 0.15;
                      return (
                        <div
                          key={day.date}
                          title={`${day.date}: ${day.value} min`}
                          style={{
                            aspectRatio: '1',
                            borderRadius: '0.25rem',
                            background: `rgba(37, 99, 235, ${intensity})`,
                          }}
                        />
                      );
                    })}
                  </div>
                </Card>
              ),
            },
            {
              id: 'achievements',
              label: 'Achievements',
              content: (
                <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
                  {MOCK_ACHIEVEMENTS.map((ach) => (
                    <Card key={ach.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{ach.icon}</span>
                        <div style={{ flex: 1 }}>
                          <h3 className="landing__feature-title">{ach.title}</h3>
                          <p className="landing__feature-desc">{ach.description}</p>
                          <Progress value={(ach.progress / ach.total) * 100} />
                        </div>
                        {ach.unlocked && <Badge variant="success">Unlocked</Badge>}
                      </div>
                    </Card>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </Container>
    </main>
  );
}
