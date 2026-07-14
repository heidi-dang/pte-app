'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';

export interface DropdownItem {
  label: string;
  onClick: () => void;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, items, align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="ds-dropdown" ref={ref}>
      <button className="ds-dropdown__trigger" onClick={() => setOpen(!open)}>
        {trigger}
      </button>
      {open && (
        <ul className={`ds-dropdown__menu ds-dropdown__menu--${align}`} role="menu">
          {items.map((item, i) => (
            <li key={i} role="menuitem">
              <button
                className="ds-dropdown__item"
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
