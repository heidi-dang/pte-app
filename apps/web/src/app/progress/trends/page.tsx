import { Container, Card } from '@pte-app/design-system';
import { ChartLine } from '@pte-app/design-system';
import { MONTHLY_TREND } from '@/lib/mock-data';

export const metadata = {
  title: 'Skill Trends — PTE Academy',
  description: 'Analyse your PTE skill trends over time.',
};

export default function TrendsPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Skill trends</h1>
        <Card>
          <h3 className="app-info-card__title">Overall estimated score</h3>
          <ChartLine data={MONTHLY_TREND} />
        </Card>
      </Container>
    </main>
  );
}
