import { storage } from '@/kit/lib/storage'
import {
  PALETTE_KEYS,
  type AppConfig,
  type FontId,
  type Mode,
  type Palette,
  type ShadowId,
  type Theme,
} from './schema'

export const DRAFT_KEY = 'kit.config.draft'

/* ------------------------------------------------------------------ */
/* Factory defaults. app.config.json is "what is saved in the project";
   these are what "Reset to factory" and the presets build on.         */
/* ------------------------------------------------------------------ */

export const FACTORY_LIGHT: Palette = {
  canvas: '#fafafa',
  surface: '#ffffff',
  soft: '#fafafa',
  hairline: '#f5f5f5',
  line: '#ebebeb',
  lineStrong: '#a1a1a1',
  ink: '#171717',
  body: '#4d4d4d',
  muted: '#666666',
  primary: '#171717',
  primaryText: '#ffffff',
  accent: '#0070f3',
  success: '#0cce6b',
  warning: '#f5a623',
  error: '#ee0000',
  terminal: '#171717',
}

export const FACTORY_DARK: Palette = {
  canvas: '#0a0a0a',
  surface: '#111111',
  soft: '#0d0d0d',
  hairline: '#1a1a1a',
  line: '#262626',
  lineStrong: '#5c5c5c',
  ink: '#ededed',
  body: '#a1a1a1',
  muted: '#8f8f8f',
  primary: '#ededed',
  primaryText: '#0a0a0a',
  accent: '#3291ff',
  success: '#0cce6b',
  warning: '#f5a623',
  error: '#ff5c5c',
  terminal: '#000000',
}

export const FACTORY: AppConfig = {
  version: 1,
  site: {
    name: 'Your product',
    tagline: 'Your money, in plain sight.',
    locale: 'en-US',
    currency: 'USD',
    weekStartsOn: 1,
    supportEmail: 'help@example.com',
  },
  theme: {
    mode: 'light',
    colors: { light: FACTORY_LIGHT, dark: FACTORY_DARK },
    gradient: ['#007cf0', '#00dfd8', '#7928ca', '#ff0080', '#ff4d4d', '#f9cb28'],
    chart: ['#0070f3', '#7928ca', '#00b8b0', '#ff0080', '#f5a623'],
    style: { radius: 10, shell: 1152, shellWide: 1440, navHeight: 104, shadow: 'soft', font: 'geist' },
  },
}

export const FONT_STACKS: Record<FontId, string> = {
  geist: '"Geist Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  inter: '"Inter Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

export const FONT_LABELS: Record<FontId, string> = { geist: 'Geist', inter: 'Inter', system: 'System' }

/* ------------------------------------------------------------------ */
/* Validation / merge                                                  */
/* ------------------------------------------------------------------ */

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export function normHex(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const s = value.trim()
  if (!HEX.test(s)) return fallback
  const six = s.length === 4 ? '#' + [...s.slice(1)].map((c) => c + c).join('') : s
  return six.toLowerCase()
}

export function isHex(value: string): boolean {
  return HEX.test(value.trim())
}

type Dict = Record<string, unknown>
const isObj = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, d: string) => (typeof v === 'string' && v.trim() ? v.trim() : d)
const num = (v: unknown, d: number, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d
const pick = <T extends string>(v: unknown, list: readonly T[], d: T): T =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : d

function mergePalette(src: unknown, base: Palette): Palette {
  const o = isObj(src) ? src : {}
  const out = {} as Palette
  for (const k of PALETTE_KEYS) out[k] = normHex(o[k], base[k])
  return out
}

function mergeColorList(src: unknown, base: string[]): string[] {
  const list = Array.isArray(src) ? src : []
  return base.map((b, i) => normHex(list[i], b))
}

/** Fills anything missing or invalid from `base`, so old or partial JSON never breaks the site. */
export function mergeConfig(input: unknown, base: AppConfig = FACTORY): AppConfig {
  const i = isObj(input) ? input : {}
  const site = isObj(i.site) ? i.site : {}
  const theme = isObj(i.theme) ? i.theme : {}
  const colors = isObj(theme.colors) ? theme.colors : {}
  const style = isObj(theme.style) ? theme.style : {}
  const bs = base.site
  const bt = base.theme
  const shell = num(style.shell, bt.style.shell, 880, 1440)

  return {
    version: 1,
    site: {
      name: str(site.name, bs.name),
      tagline: str(site.tagline, bs.tagline),
      locale: str(site.locale, bs.locale),
      currency: str(site.currency, bs.currency).toUpperCase(),
      weekStartsOn: site.weekStartsOn === 0 ? 0 : site.weekStartsOn === 1 ? 1 : bs.weekStartsOn,
      supportEmail: str(site.supportEmail, bs.supportEmail),
    },
    theme: {
      mode: pick<Mode>(theme.mode, ['light', 'dark', 'system'], bt.mode),
      colors: {
        light: mergePalette(colors.light, bt.colors.light),
        dark: mergePalette(colors.dark, bt.colors.dark),
      },
      gradient: mergeColorList(theme.gradient, bt.gradient),
      chart: mergeColorList(theme.chart, bt.chart),
      style: {
        radius: num(style.radius, bt.style.radius, 0, 24),
        shell,
        // Missing in configs saved before this option existed, so it falls back to the default.
        shellWide: Math.max(shell, num(style.shellWide, bt.style.shellWide, 1000, 1920)),
        navHeight: num(style.navHeight, bt.style.navHeight, 56, 120),
        shadow: pick<ShadowId>(style.shadow, ['none', 'soft', 'lifted'], bt.style.shadow),
        font: pick<FontId>(style.font, ['geist', 'inter', 'system'], bt.style.font),
      },
    },
  }
}

export function sameConfig(a: AppConfig, b: AppConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** Unsaved edits made in the theme editor, merged onto `saved`. Null when there are none. */
export function loadDraft(saved: AppConfig): AppConfig | null {
  const raw = storage.get(DRAFT_KEY)
  if (!raw) return null
  try {
    return mergeConfig(JSON.parse(raw), saved)
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* Applying a theme to the document                                    */
/* ------------------------------------------------------------------ */

export type Resolved = 'light' | 'dark'

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveMode(mode: Mode): Resolved {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return mode
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())

export function applyTheme(theme: Theme, resolved: Resolved) {
  const root = document.documentElement
  const set = (name: string, value: string) => root.style.setProperty(name, value)
  const palette = theme.colors[resolved]

  for (const key of PALETTE_KEYS) set('--' + kebab(key), palette[key])
  theme.gradient.forEach((c, i) => set(`--g${i + 1}`, c))
  theme.chart.forEach((c, i) => set(`--chart-${i + 1}`, c))

  const r = theme.style.radius
  set('--radius', `${r}px`)
  set('--radius-sm', `${Math.round(r * 0.6)}px`)
  set('--radius-lg', `${Math.round(r * 1.4)}px`)
  set('--shell', `${theme.style.shell}px`)
  set('--shell-wide', `${theme.style.shellWide}px`)
  set('--nav-h', `${theme.style.navHeight}px`)
  set('--shadow-k', String({ none: 0, soft: 1, lifted: 2 }[theme.style.shadow]))
  set('--edge', resolved === 'dark' ? '#ffffff1f' : '#0000000a')
  set('--overlay', resolved === 'dark' ? '#000000a6' : '#17171766')
  set('--sans', FONT_STACKS[theme.style.font])

  root.dataset.theme = resolved
  root.style.colorScheme = resolved
}

/** Runs before React renders so the first paint already has the right colors. */
export function bootstrapTheme(saved: AppConfig) {
  const cfg = loadDraft(saved) ?? saved
  applyTheme(cfg.theme, resolveMode(cfg.theme.mode))
}

/* ------------------------------------------------------------------ */
/* WCAG contrast                                                       */
/* ------------------------------------------------------------------ */

function channel(c: number) {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string): number {
  const n = parseInt(normHex(hex, '#000000').slice(1), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/* ------------------------------------------------------------------ */
/* Presets                                                             */
/* ------------------------------------------------------------------ */

export interface Preset {
  id: string
  name: string
  swatch: string[]
  theme: Pick<Theme, 'colors' | 'gradient' | 'chart'>
}

export const PRESETS: Preset[] = [
  {
    id: 'default',
    name: 'Default',
    swatch: ['#171717', '#0070f3', '#7928ca', '#ff0080'],
    theme: {
      colors: { light: FACTORY_LIGHT, dark: FACTORY_DARK },
      gradient: FACTORY.theme.gradient,
      chart: FACTORY.theme.chart,
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    swatch: ['#0b1730', '#2563eb', '#6366f1', '#06b6d4'],
    theme: {
      colors: {
        light: {
          ...FACTORY_LIGHT,
          canvas: '#f5f7fb',
          soft: '#f5f7fb',
          hairline: '#eef1f6',
          line: '#e1e6ee',
          lineStrong: '#9aa5b8',
          ink: '#0b1730',
          body: '#44506a',
          muted: '#667189',
          primary: '#0b1730',
          accent: '#2563eb',
          terminal: '#0b1730',
        },
        dark: {
          ...FACTORY_DARK,
          canvas: '#070b14',
          surface: '#0d1423',
          soft: '#0a101c',
          hairline: '#131c30',
          line: '#1d2840',
          lineStrong: '#4a5a7a',
          ink: '#e8eefc',
          body: '#9fb0cf',
          muted: '#7f8fb0',
          primary: '#e8eefc',
          primaryText: '#070b14',
          accent: '#5b9bff',
          terminal: '#04070d',
        },
      },
      gradient: ['#2563eb', '#06b6d4', '#6366f1', '#a855f7', '#ec4899', '#f59e0b'],
      chart: ['#2563eb', '#6366f1', '#06b6d4', '#ec4899', '#f59e0b'],
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    swatch: ['#064e3b', '#059669', '#14b8a6', '#0ea5e9'],
    theme: {
      colors: {
        light: {
          ...FACTORY_LIGHT,
          canvas: '#f7faf8',
          soft: '#f7faf8',
          hairline: '#f0f4f1',
          line: '#e1e8e3',
          lineStrong: '#9bab9f',
          ink: '#0f1f17',
          body: '#41534a',
          muted: '#64766b',
          primary: '#064e3b',
          accent: '#059669',
          terminal: '#0f1f17',
        },
        dark: {
          ...FACTORY_DARK,
          canvas: '#07100b',
          surface: '#0d1913',
          soft: '#0a140f',
          hairline: '#12201a',
          line: '#1c2e25',
          lineStrong: '#4b6a59',
          ink: '#e6f4ec',
          body: '#9ab5a5',
          muted: '#7e9a8b',
          primary: '#34d399',
          primaryText: '#04120b',
          accent: '#34d399',
          terminal: '#030a06',
        },
      },
      gradient: ['#059669', '#14b8a6', '#0ea5e9', '#6366f1', '#a3e635', '#facc15'],
      chart: ['#059669', '#0ea5e9', '#6366f1', '#f59e0b', '#14b8a6'],
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    swatch: ['#1c1410', '#ea580c', '#ec4899', '#a855f7'],
    theme: {
      colors: {
        light: {
          ...FACTORY_LIGHT,
          canvas: '#fffaf5',
          soft: '#fff6ee',
          hairline: '#fbf1e7',
          line: '#f1e3d3',
          lineStrong: '#b9a58f',
          ink: '#1c1410',
          body: '#5a4a3f',
          muted: '#7a695c',
          primary: '#1c1410',
          accent: '#ea580c',
          terminal: '#1c1410',
        },
        dark: {
          ...FACTORY_DARK,
          canvas: '#120c08',
          surface: '#1a110c',
          soft: '#150e0a',
          hairline: '#21160f',
          line: '#2e2017',
          lineStrong: '#6b5444',
          ink: '#fbeee2',
          body: '#c1a995',
          muted: '#9c8573',
          primary: '#fb923c',
          primaryText: '#120c08',
          accent: '#fb923c',
          terminal: '#080503',
        },
      },
      gradient: ['#f97316', '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#6366f1'],
      chart: ['#ea580c', '#a855f7', '#0ea5e9', '#ec4899', '#16a34a'],
    },
  },
  {
    id: 'violet',
    name: 'Violet',
    swatch: ['#6d28d9', '#7c3aed', '#06b6d4', '#ec4899'],
    theme: {
      colors: {
        light: {
          ...FACTORY_LIGHT,
          canvas: '#faf8ff',
          soft: '#faf8ff',
          hairline: '#f3effc',
          line: '#e8e1f7',
          lineStrong: '#a99cc7',
          ink: '#1a1230',
          body: '#4d4466',
          muted: '#6c6385',
          primary: '#6d28d9',
          accent: '#7c3aed',
          terminal: '#1a1230',
        },
        dark: {
          ...FACTORY_DARK,
          canvas: '#0b0813',
          surface: '#120e1f',
          soft: '#0e0a18',
          hairline: '#181228',
          line: '#241b3a',
          lineStrong: '#5b4b80',
          ink: '#f0eafc',
          body: '#b3a6d1',
          muted: '#9185b3',
          primary: '#a78bfa',
          primaryText: '#0b0813',
          accent: '#a78bfa',
          terminal: '#06040b',
        },
      },
      gradient: ['#7c3aed', '#06b6d4', '#6366f1', '#ec4899', '#f43f5e', '#fbbf24'],
      chart: ['#7c3aed', '#06b6d4', '#ec4899', '#f59e0b', '#22c55e'],
    },
  },
]
