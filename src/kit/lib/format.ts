import { useMemo } from 'react'
import { useSite } from '@/kit/context/ConfigContext'

export interface Formatters {
  /** 12480.5 -> $12,480.50 */
  money: (n: number, digits?: number) => string
  /** 1250000 -> $1.25M */
  moneyCompact: (n: number) => string
  /** +$120.00 / -$45.00 */
  moneySigned: (n: number, digits?: number) => string
  /** 2.4 -> +2.40% (value is already in percent units) */
  pct: (n: number, digits?: number, signed?: boolean) => string
  num: (n: number, digits?: number) => string
  compact: (n: number) => string
  /** Percent value to plain "62" style integer-ish text. */
  date: (d: Date, style?: 'short' | 'long' | 'day' | 'month' | 'monthYear' | 'weekday') => string
  monthName: (month: number, style?: 'long' | 'short') => string
  weekdayName: (index: number, style?: 'narrow' | 'short' | 'long') => string
}

const cache = new Map<string, Intl.NumberFormat>()

function nf(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = locale + JSON.stringify(options)
  let f = cache.get(key)
  if (!f) {
    f = new Intl.NumberFormat(locale, options)
    cache.set(key, f)
  }
  return f
}

export function makeFormatters(locale: string, currency: string): Formatters {
  const safe = (options: Intl.NumberFormatOptions) => {
    try {
      return nf(locale, options)
    } catch {
      return nf('en-US', { ...options, currency: options.currency ? 'USD' : undefined })
    }
  }

  const dateFmt = (options: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat(locale, options)
    } catch {
      return new Intl.DateTimeFormat('en-US', options)
    }
  }

  const dateStyles = {
    short: dateFmt({ month: 'short', day: 'numeric', year: 'numeric' }),
    long: dateFmt({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    day: dateFmt({ month: 'short', day: 'numeric' }),
    month: dateFmt({ month: 'short' }),
    monthYear: dateFmt({ month: 'long', year: 'numeric' }),
    weekday: dateFmt({ weekday: 'short' }),
  }

  return {
    money: (n, digits = 2) =>
      safe({ style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n),
    moneyCompact: (n) =>
      safe({ style: 'currency', currency, notation: 'compact', maximumFractionDigits: 2 }).format(n),
    moneySigned: (n, digits = 2) =>
      safe({
        style: 'currency',
        currency,
        signDisplay: 'exceptZero',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(n),
    pct: (n, digits = 2, signed = true) =>
      safe({
        style: 'percent',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        signDisplay: signed ? 'exceptZero' : 'auto',
      }).format(n / 100),
    num: (n, digits = 0) => safe({ minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n),
    compact: (n) => safe({ notation: 'compact', maximumFractionDigits: 1 }).format(n),
    date: (d, style = 'short') => dateStyles[style].format(d),
    monthName: (month, style = 'long') => dateFmt({ month: style }).format(new Date(2024, month, 1)),
    weekdayName: (index, style = 'short') => dateFmt({ weekday: style }).format(new Date(2024, 0, 7 + index)),
  }
}

/** Number and date formatting that follows the locale and currency from app.config.json. */
export function useFormat(): Formatters {
  const { locale, currency } = useSite()
  return useMemo(() => makeFormatters(locale, currency), [locale, currency])
}
