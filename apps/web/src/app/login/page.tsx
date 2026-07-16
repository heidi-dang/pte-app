import { Container } from '@pte-app/design-system';
import { LoginForm } from '../../components/LoginForm';

export const metadata = {
  title: 'Log in — PTE Academy',
  description: 'Log in to PTE Academy.',
};

export default function LoginPage() {
  return (
    <main>
      <Container>
        <LoginForm />
      </Container>
    </main>
  );
}
