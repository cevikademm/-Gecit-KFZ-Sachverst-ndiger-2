import React from 'react';
import { useLang } from './LangContext';

export function LanguageSelector() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex gap-2">
      <button 
        onClick={() => setLang('de')} 
        className={`text-xs font-bold ${lang === 'de' ? 'text-[#E30613]' : 'text-gray-400'}`}
      >
        DE
      </button>
      <button 
        onClick={() => setLang('tr')} 
        className={`text-xs font-bold ${lang === 'tr' ? 'text-[#E30613]' : 'text-gray-400'}`}
      >
        TR
      </button>
    </div>
  );
}
