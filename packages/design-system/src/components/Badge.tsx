import type { ReactNode } from 'react';

import type { CSSProperties } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  style?: CSSProperties;
}

export function Badge({ children, variant = 'default', className = '', style }: BadgeProps) {
  return (
    <span className={`ds-badge ds-badge--${variant} ${className}`} style={style}>
      {children}
    </span>
  );
}
