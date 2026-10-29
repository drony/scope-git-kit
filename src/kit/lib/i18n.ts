import { useSite } from '@/kit/context/ConfigContext'

export type Lang = 'en' | 'tr'

/** Screens that ship translated copy pick it from the site locale in app.config.json. */
export function langOf(locale: string): Lang {
  return locale.toLowerCase().startsWith('tr') ? 'tr' : 'en'
}

export function useLang(): Lang {
  return langOf(useSite().locale)
}

/** `const t = useText({ en: {...}, tr: {...} })` returns the dictionary for the current language. */
export function useText<T>(dict: Record<Lang, T>): T {
  return dict[useLang()]
}
