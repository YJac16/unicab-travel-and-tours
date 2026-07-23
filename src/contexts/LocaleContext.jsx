/**
 * Lightweight i18n (EN default + DE/FR).
 */
import React, { createContext, useContext, useMemo, useState } from 'react';

const STRINGS = {
  en: {
    bookNow: 'Book Now',
    signIn: 'Sign In',
    tours: 'Tours',
    home: 'Home',
    book: 'Book',
    packages: 'Packages',
    chooseExperience: 'Choose your experience',
    membership: 'Membership',
  },
  de: {
    bookNow: 'Jetzt buchen',
    signIn: 'Anmelden',
    tours: 'Touren',
    home: 'Start',
    book: 'Buchen',
    packages: 'Pakete',
    chooseExperience: 'Wählen Sie Ihr Erlebnis',
    membership: 'Mitgliedschaft',
  },
  fr: {
    bookNow: 'Réserver',
    signIn: 'Connexion',
    tours: 'Circuits',
    home: 'Accueil',
    book: 'Réserver',
    packages: 'Forfaits',
    chooseExperience: 'Choisissez votre expérience',
    membership: 'Adhésion',
  },
};

const LocaleContext = createContext({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
  available: ['en'],
});

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    try {
      return localStorage.getItem('unicab-locale') || 'en';
    } catch {
      return 'en';
    }
  });

  const value = useMemo(() => {
    const dict = STRINGS[locale] || STRINGS.en;
    return {
      locale,
      setLocale: (next) => {
        setLocale(next);
        try {
          localStorage.setItem('unicab-locale', next);
        } catch {
          // ignore
        }
      },
      t: (key) => dict[key] || STRINGS.en[key] || key,
      available: Object.keys(STRINGS),
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
