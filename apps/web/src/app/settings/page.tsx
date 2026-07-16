import { Container, Card, Button, Input, Select, ThemeToggle } from '@pte-app/design-system';

export const metadata = {
  title: 'Settings — PTE Academy',
  description: 'Your PTE Academy settings.',
};

export default function SettingsPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Settings</h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="app-info-card__title">Appearance</h3>
            <ThemeToggle />
          </Card>
          <Card>
            <h3 className="app-info-card__title">Language</h3>
            <Select
              options={[
                { value: 'en', label: 'English' },
                { value: 'zh', label: '中文' },
              ]}
              defaultValue="en"
              style={{ marginTop: '1rem' }}
            />
          </Card>
          <Card>
            <h3 className="app-info-card__title">Password</h3>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input label="Current password" type="password" />
              <Input label="New password" type="password" />
              <Button type="submit">Update password</Button>
            </form>
          </Card>
        </div>
      </Container>
    </main>
  );
}
