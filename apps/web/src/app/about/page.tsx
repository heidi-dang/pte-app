import { Container, Card } from '@pte-app/design-system';

export const metadata = {
  title: 'About — PTE Academy',
  description: 'Learn about PTE Academy and our mission to make PTE Academic preparation accessible.',
};

export default function AboutPage() {
  return (
    <main>
      <Container>
        <div className="landing__section-header">
          <h1 className="landing__section-title">About PTE Academy</h1>
          <p className="landing__section-subtitle">An independent, student-focused PTE Academic preparation platform.</p>
        </div>
        <div className="status-grid">
          <Card>
            <h3 className="landing__feature-title">Our mission</h3>
            <p className="landing__feature-desc">
              We believe every student deserves access to high-quality PTE Academic preparation. Our platform combines
              expert teaching, adaptive technology, and realistic practice to help you reach your target score with
              confidence.
            </p>
          </Card>
          <Card>
            <h3 className="landing__feature-title">Our approach</h3>
            <p className="landing__feature-desc">
              Diagnose → Teach → Practise → Explain → Review → Repeat → Test → Calibrate. This loop guides every feature
              we build, from your first practice task to your final mock exam.
            </p>
          </Card>
          <Card>
            <h3 className="landing__feature-title">Independent platform</h3>
            <p className="landing__feature-desc">
              PTE Academy is not affiliated with, endorsed by, or operated by Pearson. We provide estimated training
              scores and preparation resources only.
            </p>
          </Card>
        </div>
      </Container>
    </main>
  );
}
