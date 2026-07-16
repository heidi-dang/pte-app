import { Container, Card, Badge, Button } from '@pte-app/design-system';
import { ALL_PRACTICE_TASKS } from '@/lib/mock-data';

export const metadata = {
  title: 'Question Bank — PTE Academy',
  description: 'Manage PTE practice questions.',
};

export default function QuestionBankPage() {
  return (
    <main>
      <Container>
        <div className="app-page-header">
          <h1 className="app-page-header__title">Question bank</h1>
          <a href="/content/questions/new">
            <Button>Add question</Button>
          </a>
        </div>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Task</th>
                  <th className="ds-table__th">Skill</th>
                  <th className="ds-table__th">Difficulty</th>
                  <th className="ds-table__th">Status</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {ALL_PRACTICE_TASKS.map((task) => (
                  <tr key={task.id} className="ds-table__row">
                    <td className="ds-table__td">{task.title}</td>
                    <td className="ds-table__td">{task.skill}</td>
                    <td className="ds-table__td">
                      <Badge variant={task.difficulty === 'Easy' ? 'success' : task.difficulty === 'Medium' ? 'warning' : 'danger'}>
                        {task.difficulty}
                      </Badge>
                    </td>
                    <td className="ds-table__td"><Badge variant="success">Published</Badge></td>
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
