import { Container, Card, Badge, Button } from '@pte-app/design-system';
import { SUPPORT_TICKETS } from '@/lib/mock-data';

export const metadata = {
  title: 'Support Dashboard — PTE Academy',
  description: 'Support dashboard.',
};

export default function SupportPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Support Dashboard
        </h1>
        <div className="status-grid">
          <Card>
            <h3 className="app-info-card__title">Open tickets</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>4</p>
            <Badge variant="warning">Needs attention</Badge>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Resolved today</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>1</p>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Avg response</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>3h</p>
          </Card>
        </div>
        <h2 className="app-section__title" style={{ marginTop: '2rem' }}>
          Tickets
        </h2>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">ID</th>
                  <th className="ds-table__th">Subject</th>
                  <th className="ds-table__th">Priority</th>
                  <th className="ds-table__th">Status</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {SUPPORT_TICKETS.map((ticket) => (
                  <tr key={ticket.id} className="ds-table__row">
                    <td className="ds-table__td">{ticket.id}</td>
                    <td className="ds-table__td">{ticket.subject}</td>
                    <td className="ds-table__td">
                      <Badge
                        variant={
                          ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'default'
                        }
                      >
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="ds-table__td">
                      <Badge variant={ticket.status === 'resolved' ? 'success' : 'warning'}>{ticket.status}</Badge>
                    </td>
                    <td className="ds-table__td">
                      <Button size="sm">View</Button>
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
