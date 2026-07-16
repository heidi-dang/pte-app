import { Container, Card } from '@pte-app/design-system';

export const metadata = {
  title: 'Privacy Policy — PTE Academy',
  description: 'PTE Academy privacy policy.',
};

export default function PrivacyPage() {
  return (
    <main>
      <Container>
        <Card>
          <h1 className="app-page-header__title">Privacy Policy</h1>
          <p className="landing__feature-desc">
            Your privacy is important to us. This policy outlines how PTE Academy handles your data.
          </p>
          <h2 className="app-section__title">Data collection</h2>
          <p className="landing__feature-desc">We collect only the data necessary to provide our services, including account information and study progress.</p>
          <h2 className="app-section__title">Data sharing</h2>
          <p className="landing__feature-desc">We do not sell or share your personal data with third parties without your consent.</p>
          <h2 className="app-section__title">Contact</h2>
          <p className="landing__feature-desc">Contact us at privacy@pte.academy for privacy-related inquiries.</p>
        </Card>
      </Container>
    </main>
  );
}
