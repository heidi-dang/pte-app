import { Container, Card } from '@pte-app/design-system';

export const metadata = {
  title: 'Terms of Service — PTE Academy',
  description: 'PTE Academy terms of service.',
};

export default function TermsPage() {
  return (
    <main>
      <Container>
        <Card>
          <h1 className="app-page-header__title">Terms of Service</h1>
          <p className="landing__feature-desc">By using PTE Academy you agree to the following terms.</p>
          <h2 className="app-section__title">Use of service</h2>
          <p className="landing__feature-desc">
            You agree to use the platform only for lawful PTE Academic preparation purposes.
          </p>
          <h2 className="app-section__title">Account responsibility</h2>
          <p className="landing__feature-desc">
            You are responsible for maintaining the confidentiality of your account credentials.
          </p>
          <h2 className="app-section__title">Changes</h2>
          <p className="landing__feature-desc">
            We may update these terms at any time. Continued use constitutes acceptance of the updated terms.
          </p>
        </Card>
      </Container>
    </main>
  );
}
