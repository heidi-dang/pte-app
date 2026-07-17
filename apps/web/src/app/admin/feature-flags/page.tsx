import { Container, Card, Badge, Button } from '@pte-app/design-system';

export const metadata = {
  title: 'Feature Flags — PTE Academy',
  description: 'Manage feature flags.',
};

export default function FeatureFlagsPage() {
  const flags = [
    { name: 'new_dashboard', enabled: true },
    { name: 'ai_feedback_v2', enabled: true },
    { name: 'teacher_reviews', enabled: false },
    { name: 'dark_mode', enabled: true },
  ];

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Feature flags
        </h1>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Feature</th>
                  <th className="ds-table__th">Status</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {flags.map((flag) => (
                  <tr key={flag.name} className="ds-table__row">
                    <td className="ds-table__td">{flag.name}</td>
                    <td className="ds-table__td">
                      <Badge variant={flag.enabled ? 'success' : 'default'}>
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="ds-table__td">
                      <Button size="sm">Toggle</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Container>
    </main>
  );
}
