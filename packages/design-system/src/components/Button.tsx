import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  const variantClass = variant === 'primary' ? '' : ` ds-button--${variant}`;
  return (
    <button className={`ds-button${variantClass} ${className}`} {...rest}>
      {children}
    </button>
  );
}
