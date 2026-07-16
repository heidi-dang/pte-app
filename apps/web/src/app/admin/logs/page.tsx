import { Container, Card, Badge } from '@pte-app/design-system';

export const metadata = {
  title: 'Logs — PTE Academy',
  description: 'Platform logs.',
};

export default function LogsPage() {
  const logs = [
    { id: 'l1', level: 'info', message: 'User login successful', time: '2026-07-16 08:12:00' },
    { id: 'l2', level: 'warning', message: 'API response time exceeded 500ms', time: '2026-07-16 08:10:00' },
    { id: 'l3', level: 'error', message: 'Failed to connect to scoring service', time: '2026-07-16 08:05:00' },
  ];

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Logs
        </h1>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Time</th>
                  <th className="ds-table__th">Level</th>
                  <th className="ds-table__th">Message</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {logs.map((log) => (
                  <tr key={log.id} className="ds-table__row">
                    <td className="ds-table__td">{log.time}</td>
                    <td className="ds-table__td">
                      <Badge
                        variant={log.level === 'error' ? 'danger' : log.level === 'warning' ? 'warning' : 'default'}
                      >
                        {log.level}
                      </Badge>
                    </td>
                    <td className="ds-table__td">{log.message}</td>
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
