import { Container, Card, Badge } from '@pte-app/design-system';

export const metadata = {
  title: 'About — PTE Academy',
  description: 'Learn about PTE Academy and our mission to make PTE Academic preparation accessible.',
};

export default function AboutPage() {
  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem 0 3rem', maxWidth: '40rem', margin: '0 auto' }}>
          <Badge style={{ marginBottom: '1rem', letterSpacing: '0.05em', fontSize: '0.75rem' }}>About Us</Badge>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 800,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-display)',
              marginBottom: '0.75rem',
            }}
          >
            Our Mission
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.125rem', lineHeight: 1.65 }}>
            We believe every student deserves access to world-class PTE Academic preparation. PTE Academy is an
            independent preparation platform combining expert teaching, adaptive technology, and realistic practice to
            help you reach your target score.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
            gap: '1.5rem',
            paddingBottom: '2rem',
          }}
        >
          <Card
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
            }}
          >
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent-teal))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                color: '#fff',
                fontSize: '1.125rem',
                fontWeight: 800,
              }}
            >
              F
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
              Our Faculty
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
              Learn from certified PTE instructors with decades of combined experience. Our teachers have helped
              thousands of students achieve their target scores through structured feedback and personalised coaching.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                'Certified PTE Academic instructors',
                'Personalised score improvement plans',
                'Live one-on-one coaching sessions',
                'Detailed written feedback on every task',
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    fontSize: '0.8125rem',
                    color: 'var(--color-muted)',
                  }}
                >
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700, marginTop: '0.1em' }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
            }}
          >
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-accent-sky), var(--color-accent-teal))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                color: '#fff',
                fontSize: '1.125rem',
                fontWeight: 800,
              }}
            >
              T
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
              Our Technology
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
              Our platform leverages advanced AI to deliver real-time scoring estimates and personalised study paths.
              Every feature is built around one loop: Diagnose → Teach → Practise → Explain → Review → Repeat → Test →
              Calibrate.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                'AI-powered pronunciation & fluency scoring',
                'Adaptive practice that targets weak areas',
                'Browser-based — no software install required',
                'Real-time progress analytics & dashboards',
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    fontSize: '0.8125rem',
                    color: 'var(--color-muted)',
                  }}
                >
                  <span style={{ color: 'var(--color-accent-sky)', fontWeight: 700, marginTop: '0.1em' }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ textAlign: 'center', padding: '2rem 0 4rem', maxWidth: '36rem', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
            PTE Academy is an independent preparation platform. It is not affiliated with, endorsed by, or operated by
            Pearson. We provide estimated training scores and preparation resources only.
          </p>
        </div>
      </Container>
    </main>
  );
}
