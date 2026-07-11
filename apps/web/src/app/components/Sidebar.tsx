'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: '/app/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/app/onboarding', label: 'Onboarding', icon: '🚀' },
    { href: '/app/profile', label: 'My Profile', icon: '👤' },
    { href: '/', label: 'Landing Page', icon: '🏠' },
  ];

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`} aria-label="Portal Navigation">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: 0 }}>
          PTE Academic
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ display: 'none', padding: '0.25rem 0.5rem' }}
            id="sidebar-close-btn"
          >
            ✕
          </button>
        )}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={`nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="premium-card" style={{ padding: '1rem', background: 'rgba(37, 99, 235, 0.05)' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--primary)' }}>
          Tier Status
        </p>
        <p style={{ fontSize: '0.875rem', fontWeight: '600', marginTop: '0.25rem' }}>Free Student</p>
      </div>
    </aside>
  );
}
