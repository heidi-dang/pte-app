import { Container } from '@pte-app/design-system';
import { RegisterForm } from '../../components/RegisterForm';

export default function RegisterPage() {
  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <RegisterForm />
      </Container>
    </main>
  );
}
