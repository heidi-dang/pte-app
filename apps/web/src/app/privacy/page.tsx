import { Container, Card } from '@pte-app/design-system';

export default function PrivacyPage() {
  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Card>
          <h1 style={{ marginBottom: '1rem' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--color-muted)', marginBottom: '1rem' }}>
            Your privacy is important to us. This policy outlines how we handle your data.
          </p>
          <h2 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Data collection</h2>
          <p style={{ color: 'var(--color-muted)' }}>We collect only the data necessary to provide our services.</p>
          <h2 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Data sharing</h2>
          <p style={{ color: 'var(--color-muted)' }}>We do not share your personal data with third parties.</p>
          <h2 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Contact</h2>
          <p style={{ color: 'var(--color-muted)' }}>
            Contact us at privacy@pte-app.com for privacy-related inquiries.
          </p>
        </Card>
      </Container>
    </main>
  );
}
