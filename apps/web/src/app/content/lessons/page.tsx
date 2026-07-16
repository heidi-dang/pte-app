import { Container, Card, Badge, Button } from '@pte-app/design-system';
import { getCatalogue, type CatalogueCourse } from '@/lib/api-client';
import { MOCK_LESSONS } from '@/lib/mock-data';

export const metadata = {
  title: 'Lesson Manager — PTE Academy',
  description: 'Manage PTE lessons.',
};

export default async function LessonManagerPage() {
  const { ok, data } = await getCatalogue({ pageSize: 50 });
  const courses: CatalogueCourse[] = ok ? data.courses ?? [] : [];
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  return (
    <main>
      <Container>
        <div className="app-page-header">
          <h1 className="app-page-header__title">Lesson manager</h1>
          <Button>Add lesson</Button>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginLeft: '1rem' }}>
            TODO: Connect to backend lessons listing API when available
          </p>
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
                    <td className="ds-table__td">{courseMap.get(lesson.courseId)?.title ?? lesson.courseId}</td>
                    <td className="ds-table__td">{lesson.durationMinutes} min</td>
                    <td className="ds-table__td">
                      <Badge variant={lesson.completed ? 'success' : 'warning'}>{lesson.completed ? 'Published' : 'Draft'}</Badge>
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
