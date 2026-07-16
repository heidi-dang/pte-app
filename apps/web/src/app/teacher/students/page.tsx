import { Container, Card, Badge, Button, Input } from '@pte-app/design-system';
import { MOCK_STUDENTS } from '@/lib/mock-data';

export const metadata = {
  title: 'Students — PTE Academy',
  description: 'Manage your students.',
};

export default function StudentsPage() {
  return (
    <main>
      <Container>
        <div className="app-page-header">
          <h1 className="app-page-header__title">Students</h1>
          <Input placeholder="Search students..." style={{ maxWidth: '20rem' }} />
        </div>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Name</th>
                  <th className="ds-table__th">Target</th>
                  <th className="ds-table__th">Current</th>
                  <th className="ds-table__th">Plan</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {MOCK_STUDENTS.map((student) => (
                  <tr key={student.id} className="ds-table__row">
                    <td className="ds-table__td">{student.name}</td>
                    <td className="ds-table__td">{student.targetScore}</td>
                    <td className="ds-table__td"><strong>{student.estimatedScore}</strong></td>
                    <td className="ds-table__td">
                      <Badge variant={student.plan === 'free' ? 'default' : student.plan === 'premium' ? 'warning' : 'success'}>
                        {student.plan}
                      </Badge>
                    </td>
                    <td className="ds-table__td">
                      <a href={`/teacher/students/${student.id}`}>
                        <Button size="sm">Profile</Button>
                      </a>
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
