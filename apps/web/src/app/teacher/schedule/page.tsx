import { Container, Card, Badge, Button } from '@pte-app/design-system';

export const metadata = {
  title: 'Schedule — PTE Academy',
  description: 'Your teaching schedule.',
};

export default function TeacherSchedulePage() {
  const sessions = [
    { id: 's1', student: 'Alex Johnson', time: '10:00 AM', date: '2026-07-17', status: 'confirmed' },
    { id: 's2', student: 'Priya Sharma', time: '2:00 PM', date: '2026-07-17', status: 'confirmed' },
    { id: 's3', student: 'Wei Chen', time: '11:00 AM', date: '2026-07-18', status: 'pending' },
  ];

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Schedule
        </h1>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Date</th>
                  <th className="ds-table__th">Time</th>
                  <th className="ds-table__th">Student</th>
                  <th className="ds-table__th">Status</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {sessions.map((session) => (
                  <tr key={session.id} className="ds-table__row">
                    <td className="ds-table__td">{session.date}</td>
                    <td className="ds-table__td">{session.time}</td>
                    <td className="ds-table__td">{session.student}</td>
                    <td className="ds-table__td">
                      <Badge variant={session.status === 'confirmed' ? 'success' : 'warning'}>{session.status}</Badge>
                    </td>
                    <td className="ds-table__td">
                      <Button size="sm">Join</Button>
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
