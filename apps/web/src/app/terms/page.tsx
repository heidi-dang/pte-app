import { Container, Card } from '@pte-app/design-system';

export default function TermsPage() {
  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Card>
          <h1 style={{ marginBottom: '1rem' }}>Terms of Service</h1>
          <p style={{ color: 'var(--color-muted)', marginBottom: '1rem' }}>
            By using this platform you agree to the following terms.
          </p>
          <h2 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Use of service</h2>
          <p style={{ color: 'var(--color-muted)' }}>You agree to use the platform only for lawful purposes.</p>
          <h2 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Account responsibility</h2>
          <p style={{ color: 'var(--color-muted)' }}>
            You are responsible for maintaining the confidentiality of your account.
          </p>
          <h2 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Changes</h2>
          <p style={{ color: 'var(--color-muted)' }}>We may update these terms at any time.</p>
        </Card>
      </Container>
    </main>
  );
}
