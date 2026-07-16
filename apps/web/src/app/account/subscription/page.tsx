import { Container, Card, Button, Badge } from '@pte-app/design-system';
import { PRICING_PLANS } from '@/lib/mock-data';

export const metadata = {
  title: 'Subscription — PTE Academy',
  description: 'Manage your PTE Academy subscription.',
};

export default function SubscriptionPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Subscription
        </h1>
        <div className="status-grid">
          {PRICING_PLANS.map((plan) => (
            <Card key={plan.id} className={plan.id === 'premium' ? 'pricing-card--popular' : ''}>
              <h3 className="pricing-card__name">{plan.name}</h3>
              <p className="pricing-card__price">
                ${plan.price}
                <span className="pricing-card__period">/{plan.period}</span>
              </p>
              <ul className="pricing-card__features">
                {plan.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              {plan.id === 'premium' ? (
                <Badge variant="success">Current plan</Badge>
              ) : (
                <Button variant="secondary" size="sm">
                  Switch
                </Button>
              )}
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
