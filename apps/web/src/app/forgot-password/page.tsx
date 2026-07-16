import { Container, Card, Button, Input, Label } from '@pte-app/design-system';

export const metadata = {
  title: 'Forgot password — PTE Academy',
  description: 'Reset your PTE Academy password.',
};

export default function ForgotPasswordPage() {
  return (
    <main>
      <Container>
        <Card style={{ maxWidth: '24rem', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>Reset password</h1>
          <p className="landing__feature-desc">Enter your email and we will send you a reset link.</p>
          <form className="ds-stack">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <Button type="submit">Send reset link</Button>
          </form>
        </Card>
      </Container>
    </main>
  );
}
