import { Container, Card, Badge, Button } from '@pte-app/design-system';
import { MOCK_LESSONS, MOCK_COURSES } from '@/lib/mock-data';

export const metadata = {
  title: 'Lesson Manager — PTE Academy',
  description: 'Manage PTE lessons.',
};

export default function LessonManagerPage() {
  return (
    <main>
      <Container>
        <div className="app-page-header">
          <h1 className="app-page-header__title">Lesson manager</h1>
          <Button>Add lesson</Button>
        </div>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Lesson</th>
                  <th className="ds-table__th">Course</th>
                  <th className="ds-table__th">Duration</th>
                  <th className="ds-table__th">Status</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {MOCK_LESSONS.map((lesson) => (
                  <tr key={lesson.id} className="ds-table__row">
                    <td className="ds-table__td">{lesson.title}</td>
                    <td className="ds-table__td">{MOCK_COURSES.find((c) => c.id === lesson.courseId)?.title}</td>
                    <td className="ds-table__td">{lesson.durationMinutes} min</td>
                    <td className="ds-table__td">
                      <Badge variant={lesson.completed ? 'success' : 'warning'}>
                        {lesson.completed ? 'Published' : 'Draft'}
                      </Badge>
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
