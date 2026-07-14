import type { ReactNode } from 'react';

export interface HeaderProps {
  brand: ReactNode;
  nav?: ReactNode;
}

export function Header({ brand, nav }: HeaderProps) {
  return (
    <header className="ds-header">
      <div className="ds-container ds-header__inner">
        <div className="ds-header__brand">{brand}</div>
        {nav && <nav className="ds-header__nav">{nav}</nav>}
      </div>
    </header>
  );
}
