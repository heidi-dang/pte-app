import { Container, Card, Badge, Button } from '@pte-app/design-system';

export const metadata = {
  title: 'Mock Exam History — PTE Academy',
  description: 'View your past PTE Academic mock exams.',
};

export default function MockExamHistoryPage() {
  const exams = [
    { id: 'mock-4', date: '2026-07-14', score: 73, status: 'scored' },
    { id: 'mock-3', date: '2026-07-07', score: 70, status: 'scored' },
    { id: 'mock-2', date: '2026-06-28', score: 68, status: 'scored' },
    { id: 'mock-1', date: '2026-06-20', score: 65, status: 'scored' },
  ];

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Mock exam history
        </h1>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Exam</th>
                  <th className="ds-table__th">Date</th>
                  <th className="ds-table__th">Score</th>
                  <th className="ds-table__th">Status</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {exams.map((exam) => (
                  <tr key={exam.id} className="ds-table__row">
                    <td className="ds-table__td">{exam.id}</td>
                    <td className="ds-table__td">{exam.date}</td>
                    <td className="ds-table__td">
                      <strong>{exam.score}</strong>
                    </td>
                    <td className="ds-table__td">
                      <Badge variant="success">{exam.status}</Badge>
                    </td>
                    <td className="ds-table__td">
                      <a href="/mock-exam/results">
                        <Button size="sm">Review</Button>
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
