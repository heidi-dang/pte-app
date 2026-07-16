'use client';

import { useState, useEffect } from 'react';
import { Header, Drawer, Avatar, ThemeToggle, LanguageSelector, Button, Badge } from '@pte-app/design-system';
import {
  IconSearch,
  IconBell,
  IconMenu,
  IconHome,
  IconBook,
  IconUser,
  IconSettings,
  IconChart,
} from '@pte-app/design-system';
import { logoutAccount } from '../lib/auth';
import type { User } from '../lib/auth';

interface NavSection {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const MAIN_NAV: NavSection[] = [
  { label: 'Home', href: '/', icon: <IconHome /> },
  { label: 'Student Portal', href: '/student', icon: <IconUser />, roles: ['student'] },
  { label: 'Courses', href: '/learn/catalogue', icon: <IconBook /> },
  { label: 'Practice', href: '/practice', icon: <IconChart /> },
  { label: 'Mock Exam', href: '/mock-exam', icon: <IconChart /> },
  { label: 'Progress', href: '/progress', icon: <IconChart />, roles: ['student'] },
];

const ACCOUNT_NAV: NavSection[] = [
  { label: 'Profile', href: '/profile', icon: <IconUser /> },
  { label: 'Settings', href: '/settings', icon: <IconSettings /> },
];

const ROLE_NAV: NavSection[] = [
  { label: 'Teacher Portal', href: '/teacher', icon: <IconUser />, roles: ['teacher'] },
  { label: 'Content Management', href: '/content', icon: <IconBook />, roles: ['content_editor', 'admin'] },
  { label: 'Admin Portal', href: '/admin', icon: <IconSettings />, roles: ['admin'] },
  { label: 'Support', href: '/support', icon: <IconUser />, roles: ['support', 'admin'] },
];

interface AppShellProps {
  user: User | null;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveUser = user;
  const userRoles = effectiveUser?.roles || [];

  const filterByRole = (items: NavSection[]) =>
    items.filter((item) => !item.roles || item.roles.some((r) => userRoles.includes(r)));

  const desktopNav = effectiveUser ? (
    <>
      {filterByRole(MAIN_NAV).map((item) => (
        <a key={item.href} className="app-shell__top-link" href={item.href}>
          {item.label}
        </a>
      ))}
    </>
  ) : (
    <>
      <a className="app-shell__top-link" href="/features">
        Features
      </a>
      <a className="app-shell__top-link" href="/pricing">
        Pricing
      </a>
      <a className="app-shell__top-link" href="/about">
        About
      </a>
    </>
  );

  const brand = (
    <a href="/" className="app-shell__brand">
      <span className="app-shell__brand-icon">🎓</span>
      <span>PTE Academy</span>
    </a>
  );

  const sidebarContent = (
    <aside className="app-shell__sidebar" aria-label="Main navigation">
      <div className="app-shell__brand-sidebar">
        <a href="/" className="app-shell__brand">
          <span className="app-shell__brand-icon">🎓</span>
          <span>PTE Academy</span>
        </a>
      </div>

      {effectiveUser && (
        <div className="app-shell__user">
          <Avatar
            initials={getInitials(effectiveUser.displayName || effectiveUser.email)}
            alt={effectiveUser.displayName || effectiveUser.email}
            size="md"
          />
          <div className="app-shell__user-info">
            <p className="app-shell__user-name">{effectiveUser.displayName || effectiveUser.email.split('@')[0]}</p>
            <p className="app-shell__user-email">{effectiveUser.email}</p>
          </div>
        </div>
      )}

      <nav className="app-shell__nav" aria-label="Sidebar">
        <div className="app-shell__nav-section">
          <span className="app-shell__nav-label">Menu</span>
          <ul className="app-shell__nav-list">
            {(effectiveUser
              ? filterByRole(MAIN_NAV)
              : MAIN_NAV.filter((i) => ['Home', 'Courses'].includes(i.label))
            ).map((item) => (
              <li key={item.href}>
                <a href={item.href} className="app-shell__nav-link">
                  <span className="app-shell__nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {effectiveUser && (
          <>
            <div className="app-shell__nav-section">
              <span className="app-shell__nav-label">Account</span>
              <ul className="app-shell__nav-list">
                {ACCOUNT_NAV.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="app-shell__nav-link">
                      <span className="app-shell__nav-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {filterByRole(ROLE_NAV).length > 0 && (
              <div className="app-shell__nav-section">
                <span className="app-shell__nav-label">Portals</span>
                <ul className="app-shell__nav-list">
                  {filterByRole(ROLE_NAV).map((item) => (
                    <li key={item.href}>
                      <a href={item.href} className="app-shell__nav-link">
                        <span className="app-shell__nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </nav>

      <div className="app-shell__sidebar-footer">
        <ThemeToggle />
        <LanguageSelector />
      </div>
    </aside>
  );

  const mobileDrawerContent = (
    <div className="app-shell__drawer-nav">
      {effectiveUser && (
        <div className="app-shell__drawer-user">
          <Avatar
            initials={getInitials(effectiveUser.displayName || effectiveUser.email)}
            alt={effectiveUser.displayName || effectiveUser.email}
            size="lg"
          />
          <div>
            <p className="app-shell__drawer-user-name">
              {effectiveUser.displayName || effectiveUser.email.split('@')[0]}
            </p>
            <p className="app-shell__drawer-user-email">{effectiveUser.email}</p>
          </div>
        </div>
      )}

      <ul className="app-shell__drawer-list">
        {(effectiveUser ? filterByRole(MAIN_NAV) : MAIN_NAV.filter((i) => ['Home', 'Courses'].includes(i.label))).map(
          (item) => (
            <li key={item.href}>
              <a href={item.href} onClick={() => setDrawerOpen(false)} className="app-shell__drawer-link">
                <span className="app-shell__drawer-icon">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </li>
          ),
        )}
        {effectiveUser &&
          ACCOUNT_NAV.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={() => setDrawerOpen(false)} className="app-shell__drawer-link">
                <span className="app-shell__drawer-icon">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        {effectiveUser &&
          filterByRole(ROLE_NAV).map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={() => setDrawerOpen(false)} className="app-shell__drawer-link">
                <span className="app-shell__drawer-icon">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        {!effectiveUser && (
          <>
            <li>
              <a href="/features" onClick={() => setDrawerOpen(false)} className="app-shell__drawer-link">
                Features
              </a>
            </li>
            <li>
              <a href="/pricing" onClick={() => setDrawerOpen(false)} className="app-shell__drawer-link">
                Pricing
              </a>
            </li>
            <li>
              <a href="/about" onClick={() => setDrawerOpen(false)} className="app-shell__drawer-link">
                About
              </a>
            </li>
          </>
        )}
      </ul>

      <div className="app-shell__drawer-footer">
        <ThemeToggle />
        <LanguageSelector />
      </div>

      {effectiveUser && (
        <form action={logoutAccount} className="app-shell__drawer-logout">
          <Button type="submit" variant="secondary" style={{ width: '100%' }}>
            Log out
          </Button>
        </form>
      )}
    </div>
  );

  const topBar = (
    <div className="app-shell__topbar">
      <div className="app-shell__topbar-left">
        <button
          className="app-shell__menu-btn ds-show-mobile"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <IconMenu />
        </button>
        <div className="app-shell__search">
          <IconSearch className="app-shell__search-icon" />
          <input
            type="search"
            placeholder="Search courses, tasks, help..."
            className="app-shell__search-input"
            aria-label="Search"
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          />
          {searchOpen && (
            <div className="app-shell__search-dropdown">
              <p className="app-shell__search-hint">
                Try searching for &quot;Read Aloud&quot;, &quot;Essay&quot;, or &quot;Mock exam&quot;
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="app-shell__topbar-right">
        <div className="app-shell__notifications">
          <button
            className="app-shell__icon-btn"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen((v) => !v)}
          >
            <IconBell />
            <Badge className="app-shell__notification-badge" variant="danger">
              3
            </Badge>
          </button>
          {notificationsOpen && (
            <div className="app-shell__notifications-dropdown">
              <div className="app-shell__notifications-header">
                <strong>Notifications</strong>
                <a href="/account/notifications">View all</a>
              </div>
              <ul className="app-shell__notifications-list">
                <li>
                  <p className="app-shell__notification-title">Study reminder</p>
                  <p className="app-shell__notification-text">Keep your streak alive.</p>
                </li>
                <li>
                  <p className="app-shell__notification-title">AI feedback ready</p>
                  <p className="app-shell__notification-text">Your Read Aloud response is analysed.</p>
                </li>
                <li>
                  <p className="app-shell__notification-title">Mock exam tomorrow</p>
                  <p className="app-shell__notification-text">Full mock at 10:00 AM.</p>
                </li>
              </ul>
            </div>
          )}
        </div>

        {effectiveUser ? (
          <div className="app-shell__profile">
            <Avatar
              initials={getInitials(effectiveUser.displayName || effectiveUser.email)}
              alt={effectiveUser.displayName || effectiveUser.email}
              size="sm"
            />
            <form action={logoutAccount} className="ds-hide-mobile">
              <Button type="submit" variant="secondary" size="sm">
                Log out
              </Button>
            </form>
          </div>
        ) : (
          <div className="app-shell__auth">
            <a href="/login" className="ds-hide-mobile">
              <Button variant="secondary">Log in</Button>
            </a>
            <a href="/register">
              <Button>Get started</Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );

  if (!mounted) {
    return (
      <>
        <Header brand={brand} nav={null} />
        <main className="app-shell__main app-shell__main--loading">{children}</main>
      </>
    );
  }

  return (
    <div className="app-shell">
      <Header
        brand={brand}
        nav={
          <div className="ds-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            {desktopNav}
          </div>
        }
      />
      <div className="app-shell__body">
        {topBar}
        <div className="app-shell__content-wrapper">
          <div className="app-shell__sidebar-container">{sidebarContent}</div>
          <main className="app-shell__main">
            <div className="app-shell__main-inner">{children}</div>
            <footer className="app-shell__footer">
              <div className="app-shell__footer-inner">
                <p>© {new Date().getFullYear()} PTE Academy. Independent PTE Academic preparation platform.</p>
                <div className="app-shell__footer-links">
                  <a href="/privacy">Privacy</a>
                  <a href="/terms">Terms</a>
                  <a href="/accessibility">Accessibility</a>
                  <a href="/contact">Contact</a>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} side="left">
        {mobileDrawerContent}
      </Drawer>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
