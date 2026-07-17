'use client';

import { useState, useEffect } from 'react';

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const stored =
      typeof window !== 'undefined' ? (localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null) : null;
    setTheme(stored || 'system');
  }, []);

  const applyTheme = (next: 'light' | 'dark' | 'system') => {
    setTheme(next);
    if (typeof window === 'undefined') return;
    localStorage.setItem('theme', next);
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    if (next === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      root.classList.add(`theme-${next}`);
    }
  };

  return (
    <div className={`ds-theme-toggle ${className}`}>
      <button
        className={`ds-theme-toggle__btn ${theme === 'light' ? 'ds-theme-toggle__btn--active' : ''}`}
        onClick={() => applyTheme('light')}
        aria-label="Light mode"
        title="Light mode"
      >
        ☀
      </button>
      <button
        className={`ds-theme-toggle__btn ${theme === 'dark' ? 'ds-theme-toggle__btn--active' : ''}`}
        onClick={() => applyTheme('dark')}
        aria-label="Dark mode"
        title="Dark mode"
      >
        ☾
      </button>
      <button
        className={`ds-theme-toggle__btn ${theme === 'system' ? 'ds-theme-toggle__btn--active' : ''}`}
        onClick={() => applyTheme('system')}
        aria-label="System preference"
        title="System preference"
      >
        ⎚
      </button>
    </div>
  );
}
