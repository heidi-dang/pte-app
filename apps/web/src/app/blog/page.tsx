import { Container, Card, Badge } from '@pte-app/design-system';
import { MOCK_BLOG_POSTS } from '@/lib/mock-data';

export const metadata = {
  title: 'Blog — PTE Academy',
  description: 'Tips, strategies, and success stories for PTE Academic preparation.',
};

export default function BlogPage() {
  return (
    <main>
      <Container>
        <div className="landing__section-header">
          <h1 className="landing__section-title">Blog</h1>
          <p className="landing__section-subtitle">Tips, strategies, and inspiration for your PTE journey.</p>
        </div>
        <div className="status-grid">
          {MOCK_BLOG_POSTS.map((post) => (
            <Card key={post.id}>
              <Badge>{post.category}</Badge>
              <h3 className="landing__blog-title">{post.title}</h3>
              <p className="landing__blog-excerpt">{post.excerpt}</p>
              <p className="landing__blog-meta">
                {post.author} · {post.date}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
