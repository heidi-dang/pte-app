import { redirect } from 'next/navigation';
import { Container, Card, Badge, Button } from '@pte-app/design-system';
import { ALL_PRACTICE_TASKS } from '@/lib/mock-data';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
  title: 'Content Management — PTE Academy',
  description: 'Content management dashboard.',
};

export default async function ContentDashboard() {
  const user = await getCurrentUser();
  if (!user || (!user.roles.includes('content_editor') && !user.roles.includes('admin'))) {
    redirect('/permission-denied');
  }

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Content management
        </h1>
        <div className="status-grid">
          <Card>
            <h3 className="app-info-card__title">Questions</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{ALL_PRACTICE_TASKS.length}</p>
            <p className="landing__feature-desc">Active tasks across all skills</p>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Pending review</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>0</p>
            <Badge variant="success">All reviewed</Badge>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Published courses</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>5</p>
          </Card>
        </div>

        <div className="status-grid" style={{ marginTop: '2rem', gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="landing__feature-title">Content Provenance</h3>
            <p className="landing__feature-desc">Source, licence, and publication controls.</p>
            <a href="/content/provenance">
              <Button variant="secondary" size="sm">
                Open provenance dashboard
              </Button>
            </a>
          </Card>
        </div>
      </Container>
    </main>
  );
}
