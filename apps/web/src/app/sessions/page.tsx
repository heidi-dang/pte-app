import { Container, Card, Button, Badge } from '@pte-app/design-system';
import { getCurrentUser } from '@/lib/auth';
import { listSessions, revokeSession, revokeOtherSessions } from '@/lib/api-client';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Sessions — PTE Academy',
  description: 'Manage your active sessions.',
};

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sessions = await listSessions();

  return (
    <main>
      <Container>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 className="app-page-header__title">Sessions</h1>
          {sessions.length > 1 && (
            <form action={async () => {
              'use server';
              await revokeOtherSessions();
            }}>
              <Button type="submit" variant="secondary" size="sm">Log out everywhere else</Button>
            </form>
          )}
        </div>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Device</th>
                  <th className="ds-table__th">Created</th>
                  <th className="ds-table__th">Expires</th>
                  <th className="ds-table__th">Status</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {sessions.map((session) => (
                  <tr key={session.id} className="ds-table__row">
                    <td className="ds-table__td">Session {session.id.slice(0, 8)}</td>
                    <td className="ds-table__td">{new Date(session.createdAt).toLocaleDateString()}</td>
                    <td className="ds-table__td">{new Date(session.expiresAt).toLocaleDateString()}</td>
                    <td className="ds-table__td">
                      {!session.revokedAt ? <Badge variant="success">Active</Badge> : <Badge>Revoked</Badge>}
                    </td>
                    <td className="ds-table__td">
                      {!session.revokedAt && (
                        <form action={async () => {
                          'use server';
                          await revokeSession(session.id);
                        }}>
                          <Button type="submit" size="sm" variant="danger">Revoke</Button>
                        </form>
                      )}
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
