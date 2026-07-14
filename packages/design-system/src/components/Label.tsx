import type { LabelHTMLAttributes, ReactNode } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export function Label({ className = '', children, ...rest }: LabelProps) {
  return (
    <label className={`ds-label ${className}`} {...rest}>
      {children}
    </label>
  );
}
