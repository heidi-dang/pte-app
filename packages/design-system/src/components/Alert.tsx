import type { HTMLAttributes, ReactNode } from 'react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Alert({ children, className = '', ...rest }: AlertProps) {
  return (
    <div className={`ds-alert ${className}`} {...rest}>
      {children}
    </div>
  );
}
