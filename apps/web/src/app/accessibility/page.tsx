import { Container, Card } from '@pte-app/design-system';

export const metadata = {
  title: 'Accessibility — PTE Academy',
  description: 'PTE Academy accessibility statement.',
};

export default function AccessibilityPage() {
  return (
    <main>
      <Container>
        <Card>
          <h1 className="app-page-header__title">Accessibility</h1>
          <p className="landing__feature-desc">We are committed to making PTE Academy accessible to all users.</p>
          <h2 className="app-section__title">Keyboard navigation</h2>
          <p className="landing__feature-desc">All interactive elements are reachable via keyboard. Use Tab to navigate, Enter to activate, and Escape to close dialogs.</p>
          <h2 className="app-section__title">Screen readers</h2>
          <p className="landing__feature-desc">Content is structured with semantic HTML and ARIA labels for compatibility with screen readers.</p>
          <h2 className="app-section__title">Reduced motion</h2>
          <p className="landing__feature-desc">Animations respect the prefers-reduced-motion system setting.</p>
        </Card>
      </Container>
    </main>
  );
}
