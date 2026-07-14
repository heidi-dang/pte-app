import { Container, Card } from '@pte-app/design-system';

export default function AccessibilityPage() {
  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Card>
          <h1 style={{ marginBottom: '1rem' }}>Accessibility</h1>
          <p style={{ color: 'var(--color-muted)', marginBottom: '1rem' }}>
            We are committed to making our platform accessible to all users.
          </p>
          <h2 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Keyboard navigation</h2>
          <p style={{ color: 'var(--color-muted)' }}>
            All interactive elements are reachable via keyboard. Use Tab to navigate, Enter to activate, and Escape to
            close dialogs.
          </p>
          <h2 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Screen readers</h2>
          <p style={{ color: 'var(--color-muted)' }}>
            Content is structured with semantic HTML and ARIA labels for compatibility with screen readers.
          </p>
          <h2 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Reduced motion</h2>
          <p style={{ color: 'var(--color-muted)' }}>Animations respect the prefers-reduced-motion system setting.</p>
        </Card>
      </Container>
    </main>
  );
}
