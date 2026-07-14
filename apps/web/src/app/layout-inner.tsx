'use client';

import { useState, useEffect } from 'react';
import { Header, Drawer } from '@pte-app/design-system';
import { logoutAccount } from '../lib/auth';

interface LayoutInnerProps {
  user: { displayName?: string | null; roles: string[] } | null;
  children: React.ReactNode;
}

export function LayoutInner({ user, children }: LayoutInnerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const brand = (
    <a href="/" style={{ textDecoration: 'none' }}>
      PTE Academic
    </a>
  );

  const desktopNav = user ? (
    <>
      <a className="ds-header__link" href="/dashboard">
        Dashboard
      </a>
      <a className="ds-header__link" href="/profile">
        Profile
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
  );

  const mobileNav = (
    <>
      <a href="/" onClick={() => setDrawerOpen(false)}>
        Home
      </a>
      {user ? (
        <>
          <a href="/dashboard" onClick={() => setDrawerOpen(false)}>
            Dashboard
          </a>
          <a href="/profile" onClick={() => setDrawerOpen(false)}>
            Profile
          </a>
          <a href="/settings" onClick={() => setDrawerOpen(false)}>
            Settings
          </a>
          <a href="/sessions" onClick={() => setDrawerOpen(false)}>
            Sessions
          </a>
          {user.roles.includes('student') && (
            <a href="/student" onClick={() => setDrawerOpen(false)}>
              Student
            </a>
          )}
          {user.roles.includes('teacher') && (
            <a href="/teacher" onClick={() => setDrawerOpen(false)}>
              Teacher
            </a>
          )}
          {user.roles.includes('admin') && (
            <a href="/admin" onClick={() => setDrawerOpen(false)}>
              Admin
            </a>
          )}
          {user.roles.includes('content_editor') && (
            <a href="/content" onClick={() => setDrawerOpen(false)}>
              Content
            </a>
          )}
          {user.roles.includes('support') && (
            <a href="/support" onClick={() => setDrawerOpen(false)}>
              Support
            </a>
          )}
          <form action={logoutAccount} style={{ marginTop: '1rem' }}>
            <button type="submit" className="ds-button ds-button--secondary" style={{ width: '100%' }}>
              Log out
            </button>
          </form>
        </>
      ) : (
        <>
          <a href="/login" onClick={() => setDrawerOpen(false)}>
            Log in
          </a>
          <a href="/register" onClick={() => setDrawerOpen(false)}>
            Create account
          </a>
          <a href="/forgot-password" onClick={() => setDrawerOpen(false)}>
            Reset password
          </a>
        </>
      )}
      <hr style={{ margin: '1rem 0', borderColor: 'var(--color-border)' }} />
      <a href="/accessibility" onClick={() => setDrawerOpen(false)}>
        Accessibility
      </a>
      <a href="/privacy" onClick={() => setDrawerOpen(false)}>
        Privacy
      </a>
      <a href="/terms" onClick={() => setDrawerOpen(false)}>
        Terms
      </a>
    </>
  );

  if (!mounted) {
    return (
      <>
        <Header
          brand={brand}
          nav={
            <button
              className="ds-header__link"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{ display: 'none' }}
            >
              Menu
            </button>
          }
        />
        {children}
      </>
    );
  }

  return (
    <>
      <Header
        brand={brand}
        nav={
          <>
            <div className="ds-hide-mobile" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              {desktopNav}
            </div>
            <button
              className="ds-header__link ds-show-mobile"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{ fontSize: '1.25rem' }}
            >
              ☰
            </button>
          </>
        }
      />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} side="left">
        {mobileNav}
      </Drawer>
      {children}
      <style>{`
        @media (min-width: 640px) {
          .ds-show-mobile { display: none !important; }
        }
        @media (max-width: 639px) {
          .ds-hide-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
