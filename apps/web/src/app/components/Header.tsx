'use client';

import { useState, useEffect } from 'react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary"
          style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}
          aria-label="Toggle Sidebar"
          id="sidebar-toggle"
        >
          ☰
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Student Portal</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
        <button
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{ padding: '0.5rem', fontSize: '1rem', borderRadius: '50%' }}
          aria-label="Toggle Color Theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="btn btn-primary"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
            aria-haspopup="true"
            aria-expanded={showProfileMenu}
            aria-label="User menu"
            id="user-menu-btn"
          >
            JD
          </button>

          {showProfileMenu && (
            <div
              className="premium-card animate-slide"
              style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '200px',
                zIndex: 200,
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ padding: '0.25rem 0.5rem' }}>
                <p style={{ fontWeight: '600', fontSize: '0.875rem' }}>Jane Doe</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>jane@doe.com</p>
              </div>
              <hr style={{ borderColor: 'var(--border-color)' }} />
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '0.5rem', border: 'none' }}
                onClick={() => {
                  alert('Logout clicked');
                  setShowProfileMenu(false);
                }}
              >
                Logout 🚪
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
