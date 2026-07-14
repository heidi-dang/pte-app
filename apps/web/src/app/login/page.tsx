import { Container } from '@pte-app/design-system';
import { LoginForm } from '../../components/LoginForm';

export default function LoginPage() {
  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <LoginForm />
      </Container>
    </main>
  );
}
