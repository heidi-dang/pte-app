import { Container, Card, Badge } from '@pte-app/design-system';
import { MOCK_TESTIMONIALS } from '@/lib/mock-data';

export const metadata = {
  title: 'Testimonials — PTE Academy',
  description: 'Read success stories from PTE Academy students.',
};

export default function TestimonialsPage() {
  return (
    <main>
      <Container>
        <div className="landing__section-header">
          <h1 className="landing__section-title">Student testimonials</h1>
          <p className="landing__section-subtitle">Sample training profiles from students using PTE Academy.</p>
        </div>
        <div className="status-grid">
          {MOCK_TESTIMONIALS.map((t) => (
            <Card key={t.id}>
              <div className="landing__testimonial-score">
                <Badge variant="success">Score {t.score}</Badge>
              </div>
              <p className="landing__testimonial-text">&ldquo;{t.text}&rdquo;</p>
              <div className="landing__testimonial-author">
                <strong>{t.name}</strong>
                <span>{t.role}</span>
                <span>{t.country}</span>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
