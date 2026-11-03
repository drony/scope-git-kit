/** Wall-clock time in a named time zone, with no library: `Intl` knows the zones and their summer-time rules. */

interface Parts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  /** ISO weekday: 1 is Monday, 7 is Sunday. */
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7
}

const formatters = new Map<string, Intl.DateTimeFormat>()
const formatterFor = (tz: string) => {
  let f = formatters.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
    formatters.set(tz, f)
  }
  return f
}

const isoWeekday = (utcDay: number): Parts['weekday'] => (utcDay === 0 ? 7 : utcDay) as Parts['weekday']

/** What the wall clock of `tz` reads at the instant `ms`. */
export function zonedParts(ms: number, tz: string): Parts {
  const p = formatterFor(tz).formatToParts(new Date(ms))
  const n = (type: string) => Number(p.find((x) => x.type === type)?.value ?? 0)
  const [year, month, day, hour, minute] = [n('year'), n('month'), n('day'), n('hour'), n('minute')]
  return { year, month, day, hour, minute, weekday: isoWeekday(new Date(Date.UTC(year, month - 1, day)).getUTCDay()) }
}

/** Minutes the zone is ahead of UTC at the instant `ms`. */
export function zoneOffsetMin(ms: number, tz: string): number {
  const p = zonedParts(ms, tz)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
  return Math.round((asUtc - Math.floor(ms / 60_000) * 60_000) / 60_000)
}

/** The instant at which the wall clock of `tz` reads this date and time. */
export function zonedInstant(year: number, month: number, day: number, hour: number, minute: number, tz: string): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const first = guess - zoneOffsetMin(guess, tz) * 60_000
  return guess - zoneOffsetMin(first, tz) * 60_000
}

/** "YYYY-MM-DD" of the instant in the zone. */
export function zonedDate(ms: number, tz: string): string {
  const p = zonedParts(ms, tz)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

/** The calendar date `n` days after a "YYYY-MM-DD" date. */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

/** ISO weekday of a "YYYY-MM-DD" date. */
export function weekdayOf(date: string): Parts['weekday'] {
  const [y, m, d] = date.split('-').map(Number)
  return isoWeekday(new Date(Date.UTC(y, m - 1, d)).getUTCDay())
}

/** The instant of `HH:MM` on a "YYYY-MM-DD" date in the zone. */
export function instantOn(date: string, time: string, tz: string): number {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return zonedInstant(y, m, d, h, min, tz)
}

/** "20:00" for the instant, read in the zone. */
export function clockIn(ms: number, tz: string): string {
  const p = zonedParts(ms, tz)
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
}
