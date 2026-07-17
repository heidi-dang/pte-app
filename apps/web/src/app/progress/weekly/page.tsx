import { Container, Card } from '@pte-app/design-system';
import { ChartBar } from '@pte-app/design-system';
import { WEEKLY_PROGRESS } from '@/lib/mock-data';

export const metadata = {
  title: 'Weekly Progress — PTE Academy',
  description: 'Your weekly PTE study progress.',
};

export default function WeeklyProgressPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Weekly progress
        </h1>
        <Card>
          <h3 className="app-info-card__title">Study time this week</h3>
          <ChartBar data={WEEKLY_PROGRESS} />
        </Card>
      </Container>
    </main>
  );
}
