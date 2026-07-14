import { Container, Card, Input, Label, Button } from '@pte-app/design-system';

export default function ForgotPasswordPage() {
  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Card style={{ maxWidth: '24rem', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Reset password</h1>
          <p style={{ marginBottom: '1rem', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            Enter your email address and we will send you instructions to reset your password.
          </p>
          <form className="ds-stack">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <Button type="submit">Send instructions</Button>
          </form>
        </Card>
      </Container>
    </main>
  );
}
