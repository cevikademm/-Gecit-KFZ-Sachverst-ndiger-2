import React, { createContext, useContext, useState } from 'react';
import { translations } from './translations.js';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState('de');

  const t = (key) => {
    return translations[lang]?.[key] || translations['de']?.[key] || key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
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
