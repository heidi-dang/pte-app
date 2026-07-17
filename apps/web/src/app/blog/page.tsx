import { Container, Card, Badge } from '@pte-app/design-system';
import { MOCK_BLOG_POSTS } from '@/lib/mock-data';

export const metadata = {
  title: 'Blog — PTE Academy',
  description: 'Tips, strategies, and success stories for PTE Academic preparation.',
};

export default function BlogPage() {
  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem 0 3rem' }}>
          <Badge style={{ marginBottom: '1rem', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Latest Insights</Badge>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 800,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-display)',
              marginBottom: '0.75rem',
            }}
          >
            The Academic Gazette
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.125rem', maxWidth: '32rem', margin: '0 auto' }}>
            Expert strategies, success stories, and everything you need to ace your PTE Academic exam.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
            gap: '1.5rem',
            paddingBottom: '4rem',
          }}
        >
          {MOCK_BLOG_POSTS.map((post) => (
            <Card
              key={post.id}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 0,
                overflow: 'hidden',
                transition: 'border-color 200ms ease, box-shadow 200ms ease',
                cursor: 'pointer',
              }}
            >
              <div style={{ padding: '1.75rem 1.5rem 1.5rem' }}>
                <Badge
                  variant={
                    post.category === 'Speaking' ? 'success' : post.category === 'Writing' ? 'warning' : 'default'
                  }
                  style={{
                    marginBottom: '0.75rem',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {post.category}
                </Badge>
                <h3
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    marginBottom: '0.5rem',
                    lineHeight: 1.35,
                  }}
                >
                  {post.title}
                </h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  {post.excerpt}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-muted)',
                  }}
                >
                  <span
                    style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                    }}
                  >
                    {post.author.charAt(0)}
                  </span>
                  <span>{post.author}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>
                    {new Date(post.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div
                style={{
                  height: '3px',
                  background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent-teal))',
                  opacity: 0.6,
                }}
              />
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
