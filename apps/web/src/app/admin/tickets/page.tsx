import { Container, Card, Badge, Button } from '@pte-app/design-system';
import { SUPPORT_TICKETS } from '@/lib/mock-data';

export const metadata = {
  title: 'Support Tickets — PTE Academy',
  description: 'Manage support tickets.',
};

export default function SupportTicketsPage() {
  return (
    <main>
      <Container>
        <div className="app-page-header">
          <h1 className="app-page-header__title">Support tickets</h1>
          <Button>New ticket</Button>
        </div>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">ID</th>
                  <th className="ds-table__th">Subject</th>
                  <th className="ds-table__th">Priority</th>
                  <th className="ds-table__th">Status</th>
                  <th className="ds-table__th">Assignee</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {SUPPORT_TICKETS.map((ticket) => (
                  <tr key={ticket.id} className="ds-table__row">
                    <td className="ds-table__td">{ticket.id}</td>
                    <td className="ds-table__td">{ticket.subject}</td>
                    <td className="ds-table__td">
                      <Badge variant={ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'default'}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="ds-table__td">
                      <Badge variant={ticket.status === 'resolved' ? 'success' : ticket.status === 'open' ? 'warning' : 'default'}>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="ds-table__td">{ticket.assignee}</td>
                    <td className="ds-table__td"><Button size="sm">View</Button></td>
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
