import { redirect } from 'next/navigation';
import { Container, Card } from '@pte-app/design-system';
import { getCurrentUser } from '../../lib/auth';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Card>
          <h1 style={{ marginBottom: '1rem' }}>Settings</h1>
          <div className="ds-stack">
            <div>
              <h2>Notifications</h2>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                Notification preferences will be available in a future update.
              </p>
            </div>
            <div>
              <h2>Theme</h2>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                Theme preference respects your system setting.
              </p>
            </div>
          </div>
        </Card>
      </Container>
    </main>
  );
}
