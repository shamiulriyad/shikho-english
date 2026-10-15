import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { BilingualText } from '../types/api';

export type Language = 'en' | 'bn';

const STORAGE_KEY = 'explanationLanguage';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  /** Picks the text for the current language */
  pick: (text: BilingualText) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// Storage can be unavailable (private mode, blocked site data); the choice then lasts for the visit only
const loadLanguage = (): Language => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(loadLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Not persisted; the in-memory choice still applies
    }
  }, [language]);

  const pick = (text: BilingualText) => (language === 'bn' ? text.bn : text.en);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, pick }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside a LanguageProvider');
  }
  return context;
};
