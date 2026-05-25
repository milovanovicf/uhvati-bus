'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import sr from './sr.json';
import en from './en.json';

export type Language = 'sr' | 'en';

const translations = { sr, en } as const;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'sr',
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({
  children,
  initialLanguage = 'sr',
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    if (!document.cookie.includes('language=')) {
      const stored = localStorage.getItem('language') as Language | null;
      if (stored === 'sr' || stored === 'en') {
        setLanguageState(stored);
        document.cookie = `language=${stored};path=/;max-age=${60 * 60 * 24 * 365}`;
      }
    }
    localStorage.removeItem('language');
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    document.cookie = `language=${lang};path=/;max-age=${60 * 60 * 24 * 365}`;
  }

  function t(key: string, vars?: Record<string, string | number>): string {
    const keys = key.split('.');
    let val: unknown = translations[language];
    for (const k of keys) val = (val as Record<string, unknown>)?.[k];
    if (typeof val !== 'string') return key;
    if (!vars) return val;
    return val.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
