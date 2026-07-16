import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
}

export function Input({ label, className = '', id, ...rest }: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
  return (
    <div className="ds-input-wrapper">
      {label && (
        <label htmlFor={inputId} className="ds-label">
          {label}
        </label>
      )}
      <input id={inputId} className={`ds-input ${className}`} {...rest} />
    </div>
  );
}
