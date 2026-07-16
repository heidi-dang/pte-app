import { Container, Card, Badge, Button } from '@pte-app/design-system';
import { MOCK_STUDENTS, MOCK_TEACHERS } from '@/lib/mock-data';

export const metadata = {
  title: 'Users — PTE Academy',
  description: 'Manage platform users.',
};

export default function UsersPage() {
  const users = [
    ...MOCK_STUDENTS.map((s) => ({ ...s, role: 'student' })),
    ...MOCK_TEACHERS.map((t) => ({ ...t, role: 'teacher' })),
  ];

  return (
    <main>
      <Container>
        <div className="app-page-header">
          <h1 className="app-page-header__title">Users</h1>
          <Button>Add user</Button>
        </div>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Name</th>
                  <th className="ds-table__th">Email</th>
                  <th className="ds-table__th">Role</th>
                  <th className="ds-table__th">Status</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {users.map((user) => (
                  <tr key={user.email} className="ds-table__row">
                    <td className="ds-table__td">{user.name}</td>
                    <td className="ds-table__td">{user.email}</td>
                    <td className="ds-table__td">{user.role}</td>
                    <td className="ds-table__td">
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td className="ds-table__td">
                      <Button size="sm">Edit</Button>
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
