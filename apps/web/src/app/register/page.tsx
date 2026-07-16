import { Container } from '@pte-app/design-system';
import { RegisterForm } from '../../components/RegisterForm';

export const metadata = {
  title: 'Create account — PTE Academy',
  description: 'Create a PTE Academy account.',
};

export default function RegisterPage() {
  return (
    <main>
      <Container>
        <RegisterForm />
      </Container>
    </main>
  );
}
