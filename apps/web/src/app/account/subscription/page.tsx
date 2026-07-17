import { Container, Card, Button, Badge } from '@pte-app/design-system';
import { PRICING_PLANS } from '@/lib/mock-data';

export const metadata = {
  title: 'Subscription — PTE Academy',
  description: 'Manage your PTE Academy subscription.',
};

// TODO(Phase T): Connect to real subscription/payment backend when Phase T is implemented.
export default function SubscriptionPage() {
  return (
    <main>
      <Container>
        {/* Page header */}
        <div className="app-page-header" style={{ marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 className="app-page-header__title">
              <span className="ds-gradient-text">Subscription</span>
            </h1>
            <p className="app-page-header__subtitle">Manage your plan and billing. Upgrade or cancel anytime.</p>
          </div>
        </div>

        {/* Current plan status */}
        <section style={{ marginBottom: 'var(--space-8)' }}>
          <h2 className="app-section__title">Current Plan</h2>
          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-4)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Premium</h3>
                  <Badge variant="success">Active</Badge>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                  $29.99/month · Renews on August 1, 2026
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <Button variant="danger" size="sm">
                  Cancel Plan
                </Button>
                <Button variant="secondary" size="sm">
                  Upgrade
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Plan comparison */}
        <section style={{ marginBottom: 'var(--space-8)' }}>
          <h2 className="app-section__title">Compare Plans</h2>
          <div style={{ display: 'grid', gap: 'var(--space-6)', gridTemplateColumns: 'repeat(1, 1fr)' }}>
            {PRICING_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={plan.id === 'premium' ? 'ds-card--premium' : ''}
                style={plan.id === 'premium' ? { borderColor: 'var(--color-primary)' } : undefined}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        marginBottom: 'var(--space-1)',
                      }}
                    >
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{plan.name}</h3>
                      {plan.popular && <Badge variant="success">Current</Badge>}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{plan.description}</p>
                  </div>
                </div>

                <p style={{ marginBottom: 'var(--space-4)' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    ${plan.price}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>/{plan.period}</span>
                </p>

                <ul
                  style={{
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-6)',
                  }}
                >
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.875rem' }}
                    >
                      <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.id === 'premium' ? (
                  <Badge variant="success">Your current plan</Badge>
                ) : plan.id === 'free' ? (
                  <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                    Downgrade
                  </Button>
                ) : (
                  <Button size="sm" style={{ width: '100%' }}>
                    Upgrade to Pro
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ note */}
        <section style={{ marginBottom: 'var(--space-8)' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                Questions about billing? Check our{' '}
                <a href="/faq" style={{ color: 'var(--color-primary)' }}>
                  FAQ
                </a>{' '}
                or contact support.
              </p>
            </div>
          </Card>
        </section>
      </Container>
    </main>
  );
}
