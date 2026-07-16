import { Container, Card, Button, Select, ThemeToggle } from '@pte-app/design-system';

export const metadata = {
  title: 'Preferences — PTE Academy',
  description: 'Your account preferences.',
};

export default function PreferencesPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Preferences
        </h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="app-info-card__title">Appearance</h3>
            <div style={{ marginTop: '1rem' }}>
              <ThemeToggle />
            </div>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Language</h3>
            <Select
              options={[
                { value: 'en', label: 'English' },
                { value: 'zh', label: '中文' },
                { value: 'hi', label: 'हिन्दी' },
              ]}
              defaultValue="en"
              style={{ marginTop: '1rem' }}
            />
          </Card>
          <Card>
            <h3 className="app-info-card__title">Study reminders</h3>
            <p className="landing__feature-desc">Receive daily reminders at your preferred time.</p>
            <Button variant="secondary" size="sm" style={{ marginTop: '1rem' }}>
              Configure reminders
            </Button>
          </Card>
        </div>
      </Container>
    </main>
  );
}
