import type { Metadata } from 'next';
import './globals.css';
import '@pte-app/design-system/styles';
import { ToastProvider } from '@pte-app/design-system';
import { getCurrentUser } from '../lib/auth';
import { AppShell } from '../components/AppShell';

export const metadata: Metadata = {
  title: 'PTE Academy — Prepare with Confidence',
  description: 'Adaptive PTE Academic practice, instant AI feedback, and progress tracking.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <ToastProvider>
          <AppShell user={user}>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
