import React from 'react';
import { useLocale } from '../contexts/LocaleContext';

export default function LocaleSwitcher({ compact = true }) {
  const { locale, setLocale, available } = useLocale();
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: compact ? '0.8rem' : '0.9rem' }}>
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        style={{
          background: 'transparent',
          color: 'inherit',
          border: '1px solid var(--border-soft, rgba(255,255,255,0.35))',
          borderRadius: 6,
          padding: '0.2rem 0.35rem',
        }}
      >
        {(available || ['en', 'de', 'fr']).map((code) => (
          <option key={code} value={code}>
            {code.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
