'use client';

import { useEffect, type ReactNode } from 'react';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: 'left' | 'right';
}

export function Drawer({ open, onClose, children, side = 'left' }: DrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {open && <div className="ds-overlay" onClick={onClose} />}
      <div className={`ds-drawer ds-drawer--${side} ${open ? 'ds-drawer--open' : ''}`} aria-hidden={!open}>
        <button className="ds-drawer__close" onClick={onClose} aria-label="Close navigation">
          &times;
        </button>
        <nav className="ds-drawer__content">{children}</nav>
      </div>
    </>
  );
}
