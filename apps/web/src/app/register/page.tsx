import { Container } from '@pte-app/design-system';
import { RegisterForm } from '../../components/RegisterForm';

export const metadata = {
  title: 'Create account — PTE Academy',
  description: 'Create a PTE Academy account.',
};

export default function RegisterPage() {
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
              Create Your Account
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
              Start your PTE Academic preparation journey
            </p>
          </div>
          <RegisterForm />
        </div>
      </Container>
    </main>
  );
}
