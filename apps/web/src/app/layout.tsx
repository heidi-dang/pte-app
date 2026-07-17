import type { Metadata } from 'next';
import './globals.css';
import '@pte-app/design-system/styles';
import { ToastProvider } from '@pte-app/design-system';
import { getCurrentUser } from '../lib/auth';
import { AppShell } from '../components/AppShell';

export const metadata: Metadata = {
  title: 'PTE Academy — Master PTE with AI Practice',
  description:
    'Adaptive PTE Academic practice, instant AI feedback, and progress tracking. Train for all 22 PTE task types.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
          <AppShell user={user}>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
