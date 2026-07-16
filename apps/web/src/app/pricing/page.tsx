import { Container, Card, Button, Badge } from '@pte-app/design-system';
import { PRICING_PLANS } from '@/lib/mock-data';

export const metadata = {
  title: 'Pricing — PTE Academy',
  description: 'Choose the PTE Academy plan that fits your preparation goals.',
};

export default function PricingPage() {
  return (
    <main>
      <Container>
        <div className="landing__section-header">
          <h1 className="landing__section-title">Pricing</h1>
          <p className="landing__section-subtitle">Transparent plans. No hidden fees. Cancel anytime.</p>
        </div>
        <div className="status-grid">
          {PRICING_PLANS.map((plan) => (
            <Card key={plan.id} className={`pricing-card ${plan.popular ? 'pricing-card--popular' : ''}`}>
              {plan.popular && <Badge variant="success">Most popular</Badge>}
              <h3 className="pricing-card__name">{plan.name}</h3>
              <p className="pricing-card__price">
                ${plan.price}
                <span className="pricing-card__period">/{plan.period}</span>
              </p>
              <p className="pricing-card__desc">{plan.description}</p>
              <ul className="pricing-card__features">
                {plan.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              <a href="/register">
                <Button variant={plan.popular ? 'primary' : 'secondary'} style={{ width: '100%' }}>
                  {plan.cta}
                </Button>
              </a>
            </Card>
          ))}
        </div>
      </Container>
      <style>{`
        .pricing-card { display: flex; flex-direction: column; }
        .pricing-card--popular { border-color: var(--color-primary); box-shadow: 0 4px 20px rgba(37, 99, 235, 0.15); }
        .pricing-card__name { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
        .pricing-card__price { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.25rem; }
        .pricing-card__period { font-size: 1rem; font-weight: 500; color: var(--color-muted); }
        .pricing-card__desc { color: var(--color-muted); font-size: 0.875rem; margin-bottom: 1rem; }
        .pricing-card__features { list-style: none; flex: 1; margin-bottom: 1.5rem; }
        .pricing-card__features li { position: relative; padding-left: 1.5rem; margin-bottom: 0.75rem; font-size: 0.875rem; }
        .pricing-card__features li::before { content: '✓'; position: absolute; left: 0; color: var(--color-primary); font-weight: 700; }
      `}</style>
    </main>
  );
}
