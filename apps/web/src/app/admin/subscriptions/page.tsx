import { Container, Card, Badge, Button } from '@pte-app/design-system';
import { PRICING_PLANS } from '@/lib/mock-data';

export const metadata = {
  title: 'Subscriptions — PTE Academy',
  description: 'Manage subscription plans.',
};

export default function SubscriptionsPage() {
  return (
    <main>
      <Container>
        <div className="app-page-header">
          <h1 className="app-page-header__title">Subscriptions</h1>
          <Button>Add plan</Button>
        </div>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          {PRICING_PLANS.map((plan) => (
            <Card key={plan.id}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h3 className="landing__feature-title">{plan.name}</h3>
                  <p className="landing__feature-desc">
                    ${plan.price}/{plan.period}
                  </p>
                  <Badge variant={plan.popular ? 'success' : 'default'} style={{ marginTop: '0.5rem' }}>
                    {plan.popular ? 'Popular' : 'Active'}
                  </Badge>
                </div>
                <Button size="sm">Edit</Button>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
