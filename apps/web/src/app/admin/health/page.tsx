import { Container, Card, Badge } from '@pte-app/design-system';

export const metadata = {
  title: 'Platform Health — PTE Academy',
  description: 'Monitor platform health.',
};

export default function PlatformHealthPage() {
  const services = [
    { name: 'Web app', status: 'ok' as const },
    { name: 'API service', status: 'ok' as const },
    { name: 'Scoring service', status: 'ok' as const },
    { name: 'Database', status: 'ok' as const },
    { name: 'Object storage', status: 'warning' as const },
  ];

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Platform health
        </h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          {services.map((service) => (
            <Card key={service.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="landing__feature-title">{service.name}</h3>
                <Badge variant={service.status === 'ok' ? 'success' : 'warning'}>
                  {service.status === 'ok' ? 'Operational' : 'Degraded'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
