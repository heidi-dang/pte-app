import type { TextareaHTMLAttributes } from 'react';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TextArea({ label, className = '', id, ...rest }: TextAreaProps) {
  const areaId = id || `textarea-${Math.random().toString(36).slice(2)}`;
  return (
    <div className={`ds-textarea-wrapper ${className}`}>
      {label && <label htmlFor={areaId} className="ds-label">{label}</label>}
      <textarea id={areaId} className="ds-textarea" {...rest} />
    </div>
  );
}
