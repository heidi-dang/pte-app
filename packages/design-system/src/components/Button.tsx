import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  const variantClass = variant === 'primary' ? '' : ` ds-button--${variant}`;
  const sizeClass = size === 'md' ? '' : ` ds-button--${size}`;
  return (
    <button className={`ds-button${variantClass}${sizeClass} ${className}`} {...rest}>
      {children}
    </button>
  );
}
