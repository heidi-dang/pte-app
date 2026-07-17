import { Container, Card } from '@pte-app/design-system';

export const metadata = {
  title: 'Daily Progress — PTE Academy',
  description: 'Your daily PTE study progress.',
};

export default function DailyProgressPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Daily progress
        </h1>
        <Card>
          <h3 className="app-info-card__title">Minutes studied today</h3>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-primary)' }}>65</div>
          <p className="landing__feature-desc">Goal: 90 minutes</p>
        </Card>
      </Container>
    </main>
  );
}
