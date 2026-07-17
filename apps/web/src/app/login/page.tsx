import { Container } from '@pte-app/design-system';
import { LoginForm } from '../../components/LoginForm';

export const metadata = {
  title: 'Log in — PTE Academy',
  description: 'Log in to PTE Academy.',
};

export default function LoginPage() {
  return (
    <main
      style={{
        background: 'var(--color-bg)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container>
        <div
          style={{
            maxWidth: '26rem',
            margin: '0 auto',
            padding: '2.5rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--color-text)',
                fontFamily: 'var(--font-display)',
                marginBottom: '0.375rem',
              }}
            >
              Welcome Back
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Sign in to continue your preparation</p>
          </div>
          <LoginForm />
        </div>
      </Container>
    </main>
  );
}
