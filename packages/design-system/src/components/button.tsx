import React from 'react';
import { colors } from '../tokens/colors.js';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { backgroundColor: colors.primary[600], color: colors.text.inverse, border: 'none' },
  secondary: { backgroundColor: colors.neutral[100], color: colors.text.primary, border: `1px solid ${colors.border}` },
  ghost: { backgroundColor: 'transparent', color: colors.primary[600], border: 'none' },
  danger: { backgroundColor: colors.error[500], color: colors.text.inverse, border: 'none' },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
  md: { padding: '0.5rem 1rem', fontSize: '1rem' },
  lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        borderRadius: '0.375rem',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        fontWeight: 500,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span
          style={{
            width: '1rem',
            height: '1rem',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite' as React.CSSProperties['animation'],
          }}
        />
      )}
      {children}
    </button>
  );
}
