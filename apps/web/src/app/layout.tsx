import type { Metadata } from 'next';
import './globals.css';
import '@pte-app/design-system/styles';
import { Header } from '@pte-app/design-system';
import { getCurrentUser, logoutAccount } from '../lib/auth';

export const metadata: Metadata = {
  title: 'PTE Academic Platform',
  description: 'PTE Academic learning platform',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <Header
          brand={<a href="/">PTE Academic</a>}
          nav={
            user ? (
              <>
                <a className="ds-header__link" href="/dashboard">
                  Dashboard
                </a>
                <form action={logoutAccount} style={{ display: 'inline' }}>
                  <button
                    type="submit"
                    className="ds-header__link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <a className="ds-header__link" href="/login">
                  Log in
                </a>
                <a className="ds-header__link" href="/register">
                  Create account
                </a>
              </>
            )
          }
        />
        {children}
      </body>
    </html>
  );
}
