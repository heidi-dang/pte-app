import { Container, Card } from '@pte-app/design-system';
import { ChartBar, ChartLine } from '@pte-app/design-system';

export const metadata = {
  title: 'Teacher Analytics — PTE Academy',
  description: 'Analytics for teachers.',
};

export default function TeacherAnalyticsPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Analytics</h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="app-info-card__title">Class average score</h3>
            <ChartBar data={[
              { label: 'Speaking', value: 70 },
              { label: 'Writing', value: 72 },
              { label: 'Reading', value: 74 },
              { label: 'Listening', value: 69 },
            ]} />
          </Card>
          <Card>
            <h3 className="app-info-card__title">Reviews completed</h3>
            <ChartLine data={[
              { label: 'Mon', value: 4 },
              { label: 'Tue', value: 6 },
              { label: 'Wed', value: 3 },
              { label: 'Thu', value: 8 },
              { label: 'Fri', value: 5 },
            ]} />
          </Card>
        </div>
      </Container>
    </main>
  );
}
