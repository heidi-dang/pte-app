import { Container, Card } from '@pte-app/design-system';
import { ChartLine, ChartBar } from '@pte-app/design-system';

export const metadata = {
  title: 'Analytics — PTE Academy',
  description: 'Platform analytics.',
};

export default function AnalyticsPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Analytics
        </h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="app-info-card__title">Daily active users</h3>
            <ChartLine
              data={[
                { label: 'Mon', value: 320 },
                { label: 'Tue', value: 410 },
                { label: 'Wed', value: 380 },
                { label: 'Thu', value: 450 },
                { label: 'Fri', value: 520 },
                { label: 'Sat', value: 610 },
                { label: 'Sun', value: 480 },
              ]}
            />
          </Card>
          <Card>
            <h3 className="app-info-card__title">Practice tasks completed</h3>
            <ChartBar
              data={[
                { label: 'Speaking', value: 1200 },
                { label: 'Writing', value: 800 },
                { label: 'Reading', value: 950 },
                { label: 'Listening', value: 1100 },
              ]}
            />
          </Card>
        </div>
      </Container>
    </main>
  );
}
