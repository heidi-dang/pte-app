import React from 'react';
import { colors } from '../tokens/colors.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly error?: string;
  readonly hint?: string;
}

export function Input({ label, error, hint, style, id, ...rest }: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text.primary }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        style={{
          padding: '0.5rem 0.75rem',
          fontSize: '1rem',
          border: `1px solid ${error ? colors.error[500] : colors.border}`,
          borderRadius: '0.375rem',
          outline: 'none',
          transition: 'border-color 0.15s',
          backgroundColor: colors.background,
          color: colors.text.primary,
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? colors.error[500] : colors.primary[500];
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? colors.error[500] : colors.border;
        }}
        {...rest}
      />
      {error && (
        <span id={`${inputId}-error`} style={{ fontSize: '0.75rem', color: colors.error[500] }}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={`${inputId}-hint`} style={{ fontSize: '0.75rem', color: colors.text.secondary }}>
          {hint}
        </span>
      )}
    </div>
  );
}
