'use client';

import { useState } from 'react';
import { Container, Card, Button, Badge } from '@pte-app/design-system';
import { PRICING_PLANS } from '@/lib/mock-data';

const ANNUAL_PRICES: Record<string, number> = {
  free: 0,
  premium: 31,
  pro: 79,
};

const TIER_FEATURES: Record<string, { name: string; items: string[] }> = {
  free: {
    name: 'Standard Explorer',
    items: [
      '5 practice tasks per day',
      '3 free lessons',
      'Basic progress tracking',
      'Community support',
      'Limited task types',
    ],
  },
  premium: {
    name: 'Premium Academic',
    items: [
      'Unlimited practice tasks',
      'All courses and lessons',
      'AI speaking feedback',
      'Writing feedback',
      'Progress dashboard',
      'Mock exams',
      'Estimated score tracking',
    ],
  },
  pro: {
    name: 'VIP Mentorship',
    items: [
      'Everything in Premium',
      'Weekly teacher review',
      'Personal study plan',
      'Priority support',
      'Advanced analytics',
      '1-on-1 strategy session',
      'Custom study schedule',
    ],
  },
};

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a1a 0%, #111827 100%)' }}>
      <Container>
        <div style={{ textAlign: 'center', paddingTop: '4rem', paddingBottom: '2rem' }}>
          <Badge variant="success" style={{ marginBottom: '1rem', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            Pricing
          </Badge>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
            }}
          >
            Flexible Pricing Plans
          </h1>
          <p
            style={{
              fontSize: '1.1rem',
              color: '#94a3b8',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Start practicing for free, upgrade when you're ready. All plans include access to our core PTE preparation
            tools.
          </p>

          {/* Billing cycle toggle */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '2rem',
            }}
          >
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: !isAnnual ? 600 : 400,
                color: !isAnnual ? '#10b981' : '#94a3b8',
              }}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual((prev) => !prev)}
              style={{
                width: '3rem',
                height: '1.5rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '1rem',
                  height: '1rem',
                  borderRadius: '9999px',
                  background: '#10b981',
                  transition: 'transform 0.3s ease',
                  transform: isAnnual ? 'translateX(1.5rem)' : 'translateX(0)',
                }}
              />
            </button>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: isAnnual ? 600 : 400,
                color: isAnnual ? '#10b981' : '#94a3b8',
              }}
            >
              Annual{' '}
              <span
                style={{
                  fontSize: '0.7rem',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '9999px',
                  marginLeft: '0.25rem',
                }}
              >
                Save 20%
              </span>
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            paddingBottom: '4rem',
            alignItems: 'start',
          }}
        >
          {PRICING_PLANS.map((plan) => {
            const tier = TIER_FEATURES[plan.id];
            const price = isAnnual ? (ANNUAL_PRICES[plan.id] ?? plan.price ?? 0) : (plan.price ?? 0);
            const isPopular = plan.popular;

            return (
              <Card
                key={plan.id}
                style={{
                  background: isPopular
                    ? 'linear-gradient(145deg, #0f1f1a 0%, #1a2f28 100%)'
                    : 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
                  border: isPopular ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '2rem',
                  position: 'relative',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  boxShadow: isPopular
                    ? '0 25px 50px -12px rgba(16, 185, 129, 0.25)'
                    : '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
                }}
              >
                {isPopular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      padding: '0.4rem 1.2rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    Most Popular
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#f8fafc',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {tier?.name || plan.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#94a3b8',
                      lineHeight: 1.5,
                    }}
                  >
                    {plan.description}
                  </p>
                </div>

                <div
                  style={{
                    marginBottom: '1.5rem',
                    padding: '1.5rem 0',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span
                      style={{
                        fontSize: '3rem',
                        fontWeight: 800,
                        color: '#f8fafc',
                        lineHeight: 1,
                      }}
                    >
                      ${price}
                    </span>
                    <span
                      style={{
                        fontSize: '1rem',
                        color: '#64748b',
                        fontWeight: 500,
                      }}
                    >
                      /{isAnnual ? 'mo' : 'forever'}
                    </span>
                  </div>
                  {isAnnual && price != null && price > 0 && (
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: '#10b981',
                        marginTop: '0.5rem',
                        fontWeight: 600,
                      }}
                    >
                      Billed ${price * 12}/year — Save ${plan.price * 12 - price * 12}
                    </p>
                  )}
                </div>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    marginBottom: '1.5rem',
                    flex: 1,
                  }}
                >
                  {tier?.items.map((feature, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.6rem 0',
                        fontSize: '0.9rem',
                        color: '#e2e8f0',
                        borderBottom: i < tier.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(16, 185, 129, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M10 3L4.5 8.5L2 6"
                            stroke="#10b981"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isPopular ? 'primary' : 'secondary'}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    background: isPopular ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)',
                    border: isPopular ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {plan.cta}
                </Button>
              </Card>
            );
          })}
        </div>

        <div
          style={{
            textAlign: 'center',
            padding: '2rem 0 4rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            All prices in AUD. Cancel anytime. No hidden fees.
          </p>
          <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
            Scores shown are estimated training scores only. Official PTE scores are issued by Pearson.
          </p>
        </div>
      </Container>
    </main>
  );
}
