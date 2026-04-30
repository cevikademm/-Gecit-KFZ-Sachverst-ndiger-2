import React, { useEffect, useRef, useState } from 'react';
import { useLang } from './LangContext';

export function LanguageSelector({ variant = 'navbar' }) {
  const { lang, setLang, supported } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = supported.find((l) => l.code === lang) || supported[0];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (variant === 'mobile') {
    return (
      <div className="grid grid-cols-5 gap-2">
        {supported.map((l) => {
          const active = l.code === lang;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              aria-pressed={active}
              aria-label={l.name}
              title={l.name}
              className="aspect-square flex items-center justify-center rounded-lg border text-2xl transition-colors"
              style={{
                background: active ? '#E30613' : '#FFFFFF',
                borderColor: active ? '#E30613' : 'rgba(0,0,0,0.12)',
                boxShadow: active ? '0 4px 14px rgba(227,6,19,0.30)' : 'none',
              }}
            >
              <span aria-hidden="true">{l.flag}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${current.name} — Sprache / Language / Dil`}
        title={current.name}
        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white/80 hover:border-[#E30613] transition-colors text-xl leading-none"
      >
        <span aria-hidden="true">{current.flag}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-50 max-h-96 overflow-auto"
        >
          {supported.map((l) => {
            const active = l.code === lang;
            return (
              <li key={l.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    background: active ? 'rgba(227,6,19,0.08)' : 'transparent',
                    color: active ? '#E30613' : '#0A0A0A',
                    fontWeight: active ? 700 : 500,
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span aria-hidden="true" className="text-xl leading-none">{l.flag}</span>
                  <span className="flex-1 text-left">{l.name}</span>
                  {active && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
