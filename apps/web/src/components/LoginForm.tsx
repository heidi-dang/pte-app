'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label, Card, Alert, Badge } from '@pte-app/design-system';
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
      <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>Log in</h1>
      <p style={{ color: 'var(--color-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
        Demo credentials: <Badge>student@pte.app</Badge> / <Badge>Password123</Badge>
      </p>
      {state && !state.success && state.error && <Alert>{state.error}</Alert>}
      <form action={formAction} className="ds-stack">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" defaultValue="student@pte.app" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            minLength={8}
            defaultValue="Password123"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </Card>
  );
}
