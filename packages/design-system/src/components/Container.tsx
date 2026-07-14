import type { HTMLAttributes, ReactNode } from 'react';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Container({ children, className = '', ...rest }: ContainerProps) {
  return (
    <div className={`ds-container ${className}`} {...rest}>
      {children}
    </div>
  );
}
