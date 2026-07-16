import type { SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export function Select({ label, options, className = '', id, ...rest }: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).slice(2)}`;
  return (
    <div className={`ds-select-wrapper ${className}`}>
      {label && <label htmlFor={selectId} className="ds-label">{label}</label>}
      <select id={selectId} className="ds-select" {...rest}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
