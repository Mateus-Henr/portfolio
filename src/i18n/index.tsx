import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SHOTS } from '../lib/env';
import { STRINGS, type Strings } from './strings';

/** The page speaks English or Brazilian Portuguese. */
export type Lang = 'en' | 'pt';

const KEY = 'lang';

/**
 * First visit: `?lang=pt` or `?lang=en` in the address wins, then the choice
 * the visitor made before, then the browser's language.
 */
function initialLang(): Lang {
  const asked = new URLSearchParams(window.location.search).get('lang')?.toLowerCase();
  if (asked?.startsWith('pt')) return 'pt';
  if (asked?.startsWith('en')) return 'en';
  if (SHOTS) return 'en';
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === 'pt' || saved === 'en') return saved;
  } catch {
    // storage can be blocked (private windows); the browser's language decides
  }
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({ lang: 'en', setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    const t = STRINGS[lang];
    document.documentElement.lang = t.meta.htmlLang;
    document.title = t.meta.title;
    try {
      window.localStorage.setItem(KEY, lang);
    } catch {
      // nothing to remember it in
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** The texts for the current language. */
export const useT = (): Strings => STRINGS[useContext(LangContext).lang];

export { STRINGS, type Strings };
