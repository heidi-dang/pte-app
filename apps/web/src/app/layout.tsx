import type { Metadata } from 'next';
import './globals.css';
import '@pte-app/design-system/styles';
import { ToastProvider } from '@pte-app/design-system';
import { getCurrentUser } from '../lib/auth';
import { LayoutInner } from './layout-inner';

export const metadata: Metadata = {
  title: 'PTE Academic Platform',
  description: 'PTE Academic learning platform',
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
          <LayoutInner user={user}>{children}</LayoutInner>
        </ToastProvider>
      </body>
    </html>
  );
}
