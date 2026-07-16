import { Container, Card, Badge } from '@pte-app/design-system';

export const metadata = {
  title: 'Features — PTE Academy',
  description: 'Explore every feature of the PTE Academy preparation platform.',
};

export default function FeaturesPage() {
  const features = [
    {
      title: 'Every PTE task type',
      description: 'Practise all 20 PTE Academic tasks with realistic prompts and timed responses.',
      tags: ['Speaking', 'Writing', 'Reading', 'Listening'],
    },
    {
      title: 'AI-powered feedback',
      description:
        'Receive instant scoring estimates and detailed feedback on pronunciation, fluency, grammar, vocabulary, and more.',
      tags: ['AI'],
    },
    {
      title: 'Structured courses',
      description: 'Follow video lessons, read transcripts, take notes, and complete quizzes to build mastery.',
      tags: ['Courses'],
    },
    {
      title: 'Full mock exams',
      description: 'Simulate test-day pressure with device checks, countdown, question navigator, and results review.',
      tags: ['Mock exam'],
    },
    {
      title: 'Progress analytics',
      description: 'Track daily, weekly, and monthly progress with skill breakdowns and calendar heatmaps.',
      tags: ['Analytics'],
    },
    {
      title: 'Study planner',
      description: 'Build a personalised schedule based on your target score, exam date, and available study time.',
      tags: ['Planning'],
    },
    {
      title: 'Teacher support',
      description:
        'Get expert reviews, written feedback, and one-on-one coaching sessions with experienced PTE instructors.',
      tags: ['Teachers'],
    },
    {
      title: 'Mobile friendly',
      description: 'Study anywhere on any device. The interface adapts to desktop, tablet, and mobile screens.',
      tags: ['Responsive'],
    },
  ];

  return (
    <main>
      <Container>
        <div className="landing__section-header">
          <h1 className="landing__section-title">Features</h1>
          <p className="landing__section-subtitle">Everything you need to prepare for PTE Academic in one place.</p>
        </div>
        <div className="status-grid">
          {features.map((f, i) => (
            <Card key={i}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {f.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <h3 className="landing__feature-title">{f.title}</h3>
              <p className="landing__feature-desc">{f.description}</p>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
