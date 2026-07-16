import { Container, Card, Badge, Button } from '@pte-app/design-system';

export const metadata = {
  title: 'Notifications — PTE Academy',
  description: 'Manage your notifications.',
};

export default function NotificationsPage() {
  const notifications = [
    { id: 'n1', title: 'Study reminder', type: 'info', read: false },
    { id: 'n2', title: 'AI feedback ready', type: 'success', read: false },
    { id: 'n3', title: 'Mock exam scheduled', type: 'warning', read: true },
  ];

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Notifications</h1>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Notification</th>
                  <th className="ds-table__th">Type</th>
                  <th className="ds-table__th">Status</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {notifications.map((n) => (
                  <tr key={n.id} className="ds-table__row">
                    <td className="ds-table__td">{n.title}</td>
                    <td className="ds-table__td">
                      <Badge variant={n.type === 'success' ? 'success' : n.type === 'warning' ? 'warning' : 'default'}>{n.type}</Badge>
                    </td>
                    <td className="ds-table__td">{n.read ? 'Read' : 'Unread'}</td>
                    <td className="ds-table__td"><Button size="sm">Mark read</Button></td>
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
