/**
 * Sample finance data for the editable tables. The cash flow rows and the holdings are fictional.
 * Edits made in a table are kept as a flat map of overrides, so the original rows never change and
 * "undo" is just going back to an earlier map.
 */
import { storage } from './storage'
import { mulberry32 } from './mock'

export type RowType = 'expense' | 'income'
interface Text {
  en: string
  tr: string
}

export interface CashRowDef {
  id: string
  type: RowType
  label: Text
  /** Actual amounts for July to October 2026 (expenses are negative). */
  months: [number, number, number, number]
  budget: number
  note: Text
}

const K = 1000

export const CASH_ROWS: CashRowDef[] = [
  {
    id: 'payroll',
    type: 'expense',
    label: { en: 'Payroll', tr: 'Personel giderleri' },
    months: [-950 * K, -980 * K, -1020 * K, -1050 * K],
    budget: -1000 * K,
    note: { en: 'Includes the Q4 bonus accrual.', tr: '4. çeyrek prim karşılığını içerir.' },
  },
  {
    id: 'ops',
    type: 'expense',
    label: { en: 'Operating costs', tr: 'Operasyon giderleri' },
    months: [-380 * K, -410 * K, -400 * K, -420 * K],
    budget: -385 * K,
    note: { en: 'Cloud and office, renegotiated in September.', tr: 'Bulut ve ofis, eylülde yeniden pazarlık edildi.' },
  },
  {
    id: 'marketing',
    type: 'expense',
    label: { en: 'Marketing', tr: 'Pazarlama' },
    months: [-220 * K, -260 * K, -310 * K, -280 * K],
    budget: -300 * K,
    note: { en: 'Launch campaign wound down in October.', tr: 'Lansman kampanyası ekimde sona erdi.' },
  },
  {
    id: 'tax',
    type: 'expense',
    label: { en: 'Taxes and levies', tr: 'Vergi ve yükümlülükler' },
    months: [-180 * K, -190 * K, -210 * K, -220 * K],
    budget: -200 * K,
    note: { en: 'Estimated; final figure after the quarterly filing.', tr: 'Tahmini; kesin tutar çeyreklik beyandan sonra.' },
  },
  {
    id: 'sales',
    type: 'income',
    label: { en: 'Sales revenue', tr: 'Satış gelirleri' },
    months: [2150 * K, 2320 * K, 2380 * K, 2480 * K],
    budget: 2400 * K,
    note: { en: 'Two enterprise deals closed in October.', tr: 'Ekimde iki kurumsal anlaşma kapandı.' },
  },
  {
    id: 'subs',
    type: 'income',
    label: { en: 'Subscription revenue', tr: 'Abonelik gelirleri' },
    months: [620 * K, 690 * K, 740 * K, 760 * K],
    budget: 720 * K,
    note: { en: 'Annual plans renew in November.', tr: 'Yıllık planlar kasımda yenileniyor.' },
  },
  {
    id: 'other',
    type: 'income',
    label: { en: 'Other income', tr: 'Diğer gelirler' },
    months: [320 * K, 360 * K, 390 * K, 410 * K],
    budget: 380 * K,
    note: { en: 'Interest and one-off services.', tr: 'Faiz ve tek seferlik hizmetler.' },
  },
]

/** October 2026 is the month the sample amounts are anchored to. */
const ANCHOR = 2026 * 12 + 9

function hash(text: string): number {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

export const monthKey = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, '0')}`

/** Months outside July to October 2026 are generated from the nearest real month, so any month can be browsed. */
export function baseCash(def: CashRowDef, year: number, month: number): number {
  const d = year * 12 + month - ANCHOR
  if (d >= -3 && d <= 0) return def.months[d + 3]
  const edge = d < -3 ? def.months[0] : def.months[3]
  const steps = d < -3 ? d + 3 : d
  const rand = mulberry32(hash(def.id) + d * 977)
  return Math.round((edge * (1 + steps * 0.012 + (rand() - 0.5) * 0.06)) / 5000) * 5000
}

export type Edits = Record<string, number | string>

export const editKey = (rowId: string, part: string) => `${rowId}|${part}`

export function cashAmount(def: CashRowDef, edits: Edits, year: number, month: number): number {
  const v = edits[editKey(def.id, monthKey(year, month))]
  return typeof v === 'number' ? v : baseCash(def, year, month)
}

export function cashBudget(def: CashRowDef, edits: Edits): number {
  const v = edits[editKey(def.id, 'budget')]
  return typeof v === 'number' ? v : def.budget
}

export function cashNote(def: CashRowDef, edits: Edits, lang: 'en' | 'tr'): string {
  const v = edits[editKey(def.id, 'note')]
  return typeof v === 'string' ? v : def.note[lang]
}

/* ---- persistence of edits ------------------------------------------------------------------ */

export function loadEdits(key: string): Edits {
  const raw = storage.get(key)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Edits = {}
    for (const [k, v] of Object.entries(parsed)) if (typeof v === 'number' || typeof v === 'string') out[k] = v
    return out
  } catch {
    return {}
  }
}

export function saveEdits(key: string, edits: Edits) {
  storage.set(key, JSON.stringify(edits))
}

export function sameEdits(a: Edits, b: Edits): boolean {
  const ka = Object.keys(a)
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k])
}
