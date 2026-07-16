import { Container, Card, Badge } from '@pte-app/design-system';
import { MOCK_TESTIMONIALS } from '@/lib/mock-data';

export const metadata = {
  title: 'Success Stories — PTE Academy',
  description: 'See how PTE Academy students achieved their target scores.',
};

export default function SuccessStoriesPage() {
  return (
    <main>
      <Container>
        <div className="landing__section-header">
          <h1 className="landing__section-title">Success stories</h1>
          <p className="landing__section-subtitle">Inspiring journeys from students who reached their PTE goals.</p>
        </div>
        <div className="status-grid">
          {MOCK_TESTIMONIALS.map((story) => (
            <Card key={story.id}>
              <Badge variant="success">PTE {story.score}</Badge>
              <h3 className="landing__feature-title" style={{ marginTop: '0.75rem' }}>
                {story.name}
              </h3>
              <p className="landing__feature-desc">
                {story.role} · {story.country}
              </p>
              <p className="landing__testimonial-text">&ldquo;{story.text}&rdquo;</p>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
