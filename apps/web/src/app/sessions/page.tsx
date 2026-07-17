import { Container, Card, Button, Badge } from '@pte-app/design-system';

export const metadata = {
  title: 'Sessions — PTE Academy',
  description: 'Manage your active sessions.',
};

export default function SessionsPage() {
  const sessions = [
    { id: 's1', device: 'Chrome on Windows', location: 'Sydney, AU', current: true },
    { id: 's2', device: 'Safari on iPhone', location: 'Sydney, AU', current: false },
  ];

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Sessions
        </h1>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Device</th>
                  <th className="ds-table__th">Location</th>
                  <th className="ds-table__th">Status</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {sessions.map((session) => (
                  <tr key={session.id} className="ds-table__row">
                    <td className="ds-table__td">{session.device}</td>
                    <td className="ds-table__td">{session.location}</td>
                    <td className="ds-table__td">
                      {session.current ? <Badge variant="success">Current</Badge> : <Badge>Inactive</Badge>}
                    </td>
                    <td className="ds-table__td">
                      {!session.current && (
                        <Button size="sm" variant="danger">
                          Revoke
                        </Button>
                      )}
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
