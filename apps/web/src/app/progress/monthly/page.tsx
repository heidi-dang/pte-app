import { Container, Card } from '@pte-app/design-system';
import { ChartLine } from '@pte-app/design-system';
import { MONTHLY_TREND } from '@/lib/mock-data';

export const metadata = {
  title: 'Monthly Progress — PTE Academy',
  description: 'Your monthly PTE study progress.',
};

export default function MonthlyProgressPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Monthly progress</h1>
        <Card>
          <h3 className="app-info-card__title">Score trend this month</h3>
          <ChartLine data={MONTHLY_TREND} />
        </Card>
      </Container>
    </main>
  );
}
