export type Mode = 'light' | 'dark' | 'system'
export type FontId = 'geist' | 'inter' | 'system'
export type ShadowId = 'none' | 'soft' | 'lifted'

export const PALETTE_KEYS = [
  'canvas',
  'surface',
  'soft',
  'hairline',
  'line',
  'lineStrong',
  'ink',
  'body',
  'muted',
  'primary',
  'primaryText',
  'accent',
  'success',
  'warning',
  'error',
  'terminal',
] as const

export type PaletteKey = (typeof PALETTE_KEYS)[number]
export type Palette = Record<PaletteKey, string>

export interface ThemeStyle {
  /** Base corner radius in px. Small and large radii are derived from it. */
  radius: number
  /** Max content width in px for text pages (home, help, sign in). */
  shell: number
  /** Max content width in px for data pages (dashboard, tables, markets). Never narrower than `shell`. */
  shellWide: number
  /** Header height in px (desktop). */
  navHeight: number
  shadow: ShadowId
  font: FontId
}

export interface Theme {
  mode: Mode
  colors: { light: Palette; dark: Palette }
  /** Six stops used by the brand gradient (hero text, accents). */
  gradient: string[]
  /** Five series colors used by charts, in order. */
  chart: string[]
  style: ThemeStyle
}

export interface SiteConfig {
  name: string
  tagline: string
  /** BCP 47 locale used for numbers and dates, e.g. "en-US" or "tr-TR". */
  locale: string
  /** ISO 4217 currency code, e.g. "USD" or "TRY". */
  currency: string
  weekStartsOn: 0 | 1
  supportEmail: string
}

export interface AppConfig {
  version: 1
  site: SiteConfig
  theme: Theme
}
