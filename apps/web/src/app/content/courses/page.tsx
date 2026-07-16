import { Container, Card, Badge, Button } from '@pte-app/design-system';
import { getCatalogue, type CatalogueCourse } from '@/lib/api-client';

export const metadata = {
  title: 'Course Manager — PTE Academy',
  description: 'Manage PTE courses.',
};

export default async function CourseManagerPage() {
  const { ok, data } = await getCatalogue({ pageSize: 50 });
  const courses: CatalogueCourse[] = ok ? data.courses ?? [] : [];

  return (
    <main>
      <Container>
        <div className="app-page-header">
          <h1 className="app-page-header__title">Course manager</h1>
          <Button>Add course</Button>
        </div>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          {courses.map((course) => (
            <Card key={course.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 className="landing__feature-title">{course.title}</h3>
                  <p className="landing__feature-desc">{course.summary}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <Badge variant={course.accessLevel === 'free' ? 'success' : 'warning'}>{course.accessLevel}</Badge>
                    <Badge>{course.difficulty}</Badge>
                    <Badge variant="success">Published</Badge>
                  </div>
                </div>
                <Button size="sm">Edit</Button>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
