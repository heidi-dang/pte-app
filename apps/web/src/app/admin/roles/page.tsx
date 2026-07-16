import { Container, Card, Badge, Button } from '@pte-app/design-system';

export const metadata = {
  title: 'Roles — PTE Academy',
  description: 'Manage user roles and permissions.',
};

export default function RolesPage() {
  const roles = [
    { name: 'Student', description: 'Can access courses, practice, and progress.', count: 1200 },
    { name: 'Teacher', description: 'Can review students and provide feedback.', count: 24 },
    { name: 'Content Editor', description: 'Can create and edit content.', count: 8 },
    { name: 'Admin', description: 'Full platform administration access.', count: 3 },
    { name: 'Support', description: 'Can manage support tickets.', count: 5 },
  ];

  return (
    <main>
      <Container>
        <div className="app-page-header">
          <h1 className="app-page-header__title">Roles</h1>
          <Button>Add role</Button>
        </div>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          {roles.map((role) => (
            <Card key={role.name}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h3 className="landing__feature-title">{role.name}</h3>
                  <p className="landing__feature-desc">{role.description}</p>
                  <Badge style={{ marginTop: '0.5rem' }}>{role.count} users</Badge>
                </div>
                <Button size="sm">Edit permissions</Button>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
