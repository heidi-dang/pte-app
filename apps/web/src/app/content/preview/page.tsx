import { Container, Card, Button } from '@pte-app/design-system';

export const metadata = {
  title: 'Preview — PTE Academy',
  description: 'Preview content before publishing.',
};

export default function PreviewPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Preview
        </h1>
        <Card>
          <h3 className="app-info-card__title">Lesson preview</h3>
          <p className="landing__feature-desc">This is how the lesson will appear to students.</p>
          <div
            style={{
              padding: '2rem',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              marginTop: '1rem',
              border: '1px dashed var(--color-border)',
            }}
          >
            <p style={{ color: 'var(--color-muted)', textAlign: 'center' }}>Preview content renders here</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button variant="secondary">Request review</Button>
            <Button>Publish</Button>
          </div>
        </Card>
      </Container>
    </main>
  );
}
