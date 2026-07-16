import { Container, Card, Badge } from '@pte-app/design-system';
import { PageHeader } from '@/components/PageShell';
import { CALENDAR_HEATMAP, UPCOMING_EXAM } from '@/lib/mock-data';

export const metadata = {
  title: 'Calendar — PTE Academy',
  description: 'Your study calendar and upcoming PTE Academic events.',
};

export default function CalendarPage() {
  return (
    <main>
      <Container>
        <PageHeader title="Calendar" subtitle="Track your study streaks and upcoming milestones." />
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="app-info-card__title">Upcoming exam</h3>
            <p><strong>{UPCOMING_EXAM.date}</strong> at {UPCOMING_EXAM.time}</p>
            <p style={{ color: 'var(--color-muted)' }}>{UPCOMING_EXAM.location}</p>
            <Badge variant="warning" style={{ marginTop: '1rem' }}>{UPCOMING_EXAM.countdownDays} days left</Badge>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Study heatmap</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
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
        </div>
      </Container>
    </main>
  );
}
