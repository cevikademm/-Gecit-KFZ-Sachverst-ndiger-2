import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, SUPPORTED_LANGS } from './translations.js';

const LangContext = createContext();
const STORAGE_KEY = 'gecit_kfz_lang';
const SUPPORTED_CODES = SUPPORTED_LANGS.map((l) => l.code);
const DEFAULT_LANG = 'de';

function readInitialLang() {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_CODES.includes(saved)) return saved;
  } catch (_) {}
  const navLang = (window.navigator?.language || '').slice(0, 2).toLowerCase();
  if (SUPPORTED_CODES.includes(navLang)) return navLang;
  return DEFAULT_LANG;
}

function getPath(obj, path) {
  if (!obj) return undefined;
  return path.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

function getDir(code) {
  return SUPPORTED_LANGS.find((l) => l.code === code)?.dir || 'ltr';
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang);

  const setLang = (next) => {
    if (!SUPPORTED_CODES.includes(next)) return;
    setLangState(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch (_) {}
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const dir = getDir(lang);
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', dir);
    }
  }, [lang]);

  const t = (key) => {
    const value = getPath(translations[lang], key);
    if (value !== undefined && value !== null) return value;
    const fallback = getPath(translations[DEFAULT_LANG], key);
    return fallback !== undefined && fallback !== null ? fallback : key;
  };

  const dir = getDir(lang);
  const isRTL = dir === 'rtl';

  return (
    <LangContext.Provider value={{
      lang, setLang, t, dir, isRTL,
      supported: SUPPORTED_LANGS,
    }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
}
