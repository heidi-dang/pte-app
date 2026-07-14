'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label, Card, Alert } from '@pte-app/design-system';
import { loginAccount } from '../lib/auth';

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await loginAccount(formData);
      if (result.success) {
        router.push('/dashboard');
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    { success: false, error: '' },
  );

  return (
    <Card style={{ maxWidth: '24rem', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Log in</h1>
      {state && !state.success && state.error && <Alert>{state.error}</Alert>}
      <form action={formAction} className="ds-stack">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" minLength={8} />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </Card>
  );
}
