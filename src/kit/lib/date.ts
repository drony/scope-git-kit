/** Local-time date helpers. Every Date handled by the calendar components is a local midnight. */

export interface DateRange {
  from: Date | null
  to: Date | null
}

export type WeekStart = 0 | 1

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const today = () => startOfDay(new Date())
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
export const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

export function addMonths(d: Date, n: number) {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1)
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), daysInMonth(first.getFullYear(), first.getMonth())))
}

export const isSameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

export const isBefore = (a: Date, b: Date) => startOfDay(a).getTime() < startOfDay(b).getTime()
export const isAfter = (a: Date, b: Date) => startOfDay(a).getTime() > startOfDay(b).getTime()

export function isBetween(d: Date, from: Date, to: Date) {
  const t = startOfDay(d).getTime()
  return t >= startOfDay(from).getTime() && t <= startOfDay(to).getTime()
}

export function clampDate(d: Date, min?: Date, max?: Date) {
  if (min && isBefore(d, min)) return startOfDay(min)
  if (max && isAfter(d, max)) return startOfDay(max)
  return d
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 2026-10-29 */
export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function startOfWeek(d: Date, weekStartsOn: WeekStart) {
  const diff = (d.getDay() - weekStartsOn + 7) % 7
  return addDays(d, -diff)
}

/** Six rows of seven cells. Days outside the month are null. */
export function monthGrid(year: number, month: number, weekStartsOn: WeekStart): (Date | null)[][] {
  const offset = (new Date(year, month, 1).getDay() - weekStartsOn + 7) % 7
  const total = daysInMonth(year, month)
  const rows: (Date | null)[][] = []
  for (let r = 0; r < 6; r++) {
    const row: (Date | null)[] = []
    for (let c = 0; c < 7; c++) {
      const day = r * 7 + c - offset + 1
      row.push(day >= 1 && day <= total ? new Date(year, month, day) : null)
    }
    rows.push(row)
  }
  return rows
}

/** Six rows of seven real dates, including the neighbouring months (for the event calendar). */
export function fullMonthGrid(year: number, month: number, weekStartsOn: WeekStart): Date[][] {
  const start = startOfWeek(new Date(year, month, 1), weekStartsOn)
  return Array.from({ length: 6 }, (_, r) => Array.from({ length: 7 }, (_, c) => addDays(start, r * 7 + c)))
}

export interface RangePreset {
  id: string
  label: string
  range: { from: Date; to: Date }
}

export function rangePresets(now: Date = today()): RangePreset[] {
  const y = now.getFullYear()
  const m = now.getMonth()
  return [
    { id: '7d', label: 'Last 7 days', range: { from: addDays(now, -6), to: now } },
    { id: '30d', label: 'Last 30 days', range: { from: addDays(now, -29), to: now } },
    { id: 'mtd', label: 'This month', range: { from: new Date(y, m, 1), to: now } },
    { id: 'last-month', label: 'Last month', range: { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) } },
    { id: 'qtd', label: 'This quarter', range: { from: new Date(y, Math.floor(m / 3) * 3, 1), to: now } },
    { id: 'ytd', label: 'Year to date', range: { from: new Date(y, 0, 1), to: now } },
    { id: '12m', label: 'Last 12 months', range: { from: addDays(addMonths(now, -12), 1), to: now } },
  ]
}
