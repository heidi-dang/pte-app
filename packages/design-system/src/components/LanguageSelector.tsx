'use client';

import { useState } from 'react';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'ar', label: 'العربية' },
  { value: 'vi', label: 'Tiếng Việt' },
];

export interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const [lang, setLang] = useState('en');
  return (
    <div className={`ds-language-selector ${className}`}>
      <span className="ds-language-selector__icon" aria-hidden="true">
        🌐
      </span>
      <select
        className="ds-language-selector__select"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        aria-label="Select language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
