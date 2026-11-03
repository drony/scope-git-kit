/** The weekly program as plain functions: when each show happens, what a change does to people who registered, and what is wrong. */
import type { Id, ProgramSlot, Weekday, WeeklyProgram } from '../data/types'
import { addDays, clockIn, instantOn, weekdayOf, zonedDate } from './zoned'

export const WEEKDAYS: { id: Weekday; short: string; name: string }[] = [
  { id: 1, short: 'Mon', name: 'Monday' },
  { id: 2, short: 'Tue', name: 'Tuesday' },
  { id: 3, short: 'Wed', name: 'Wednesday' },
  { id: 4, short: 'Thu', name: 'Thursday' },
  { id: 5, short: 'Fri', name: 'Friday' },
  { id: 6, short: 'Sat', name: 'Saturday' },
  { id: 7, short: 'Sun', name: 'Sunday' },
]

export const weekdayName = (id: Weekday, short = false) => WEEKDAYS[id - 1][short ? 'short' : 'name']

const MIN = 60_000
const DAY = 86_400_000

/** One show on one date: a slot of the program made concrete. */
export interface Occurrence {
  /** `slotId@YYYY-MM-DD`: the key of its registrations. */
  key: string
  slot: ProgramSlot
  /** The date in the program's time zone. */
  date: string
  /** Start and end, in milliseconds. */
  at: number
  endsAt: number
}

export const occurrenceKey = (slotId: Id, date: string) => `${slotId}@${date}`

/** Every show that is still on or starts before `from + days`, in time order. */
export function occurrences(program: WeeklyProgram, from: number, days: number): Occurrence[] {
  const start = addDays(zonedDate(from, program.timezone), -1)
  const out: Occurrence[] = []
  for (let i = 0; i <= days + 1; i++) {
    const date = addDays(start, i)
    const weekday = weekdayOf(date)
    for (const slot of program.slots) {
      if (slot.weekday !== weekday) continue
      const at = instantOn(date, slot.time, program.timezone)
      const endsAt = at + slot.lengthMin * MIN
      if (endsAt > from && at < from + days * DAY) out.push({ key: occurrenceKey(slot.id, date), slot, date, at, endsAt })
    }
  }
  return out.sort((a, b) => a.at - b.at)
}

export type ShowState = 'upcoming' | 'soon' | 'live' | 'done'

/** `soon` is the last hour before the start: the lobby is open and nothing should change. */
export function showState(o: Pick<Occurrence, 'at' | 'endsAt'>, now: number): ShowState {
  if (now >= o.endsAt) return 'done'
  if (now >= o.at) return 'live'
  return o.at - now <= 60 * MIN ? 'soon' : 'upcoming'
}

export const nextOccurrence = (program: WeeklyProgram, now: number): Occurrence | undefined => occurrences(program, now, 8).find((o) => showState(o, now) !== 'done')

/** The seven dates ("YYYY-MM-DD") of the week that holds `ms`, Monday first. */
export function weekDates(ms: number, tz: string): string[] {
  const today = zonedDate(ms, tz)
  const monday = addDays(today, 1 - weekdayOf(today))
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export const slotLabel = (s: Pick<ProgramSlot, 'weekday' | 'time'>) => `${weekdayName(s.weekday, true)} ${s.time}`

/** The time zone's clock for an instant, for lists that show start times. */
export const startTime = (o: Pick<Occurrence, 'at'>, tz: string) => clockIn(o.at, tz)

/* ---- Changes and their effect on the people who registered ------------------------------------------------------ */

export type ChangeKind = 'added' | 'removed' | 'moved' | 'topic' | 'quota' | 'seats' | 'length' | 'kind'

export interface SlotChange {
  slotId: Id
  /** What the slot was (or is, when added). */
  label: string
  kinds: ChangeKind[]
}

/** What differs between two versions of the program, slot by slot. */
export function changesBetween(prev: WeeklyProgram, next: WeeklyProgram): SlotChange[] {
  const out: SlotChange[] = []
  for (const was of prev.slots) {
    const now = next.slots.find((s) => s.id === was.id)
    if (!now) {
      out.push({ slotId: was.id, label: slotLabel(was), kinds: ['removed'] })
      continue
    }
    const kinds: ChangeKind[] = []
    if (was.weekday !== now.weekday || was.time !== now.time) kinds.push('moved')
    if (was.topic !== now.topic) kinds.push('topic')
    if (was.quota !== now.quota) kinds.push('quota')
    if (was.seats !== now.seats) kinds.push('seats')
    if (was.lengthMin !== now.lengthMin) kinds.push('length')
    if (was.kind !== now.kind) kinds.push('kind')
    if (kinds.length) out.push({ slotId: was.id, label: slotLabel(was), kinds })
  }
  for (const now of next.slots) if (!prev.slots.some((s) => s.id === now.id)) out.push({ slotId: now.id, label: slotLabel(now), kinds: ['added'] })
  return out
}

/** `free` can be saved at once, `confirm` needs a yes because people registered, `blocked` cannot be saved at all. */
export type Severity = 'free' | 'confirm' | 'blocked'

export interface ImpactItem {
  change: SlotChange
  severity: Severity
  message: string
  /** People registered for the shows this change touches. */
  registered: number
}

const KIND_TEXT: Record<ChangeKind, string> = {
  added: 'added',
  removed: 'removed',
  moved: 'moved',
  topic: 'given another topic',
  quota: 'given another quota',
  seats: 'given other final seats',
  length: 'made a different length',
  kind: 'made a different kind of show',
}

const people = (n: number) => (n === 1 ? '1 person' : `${n.toLocaleString('en')} people`)

/** People registered for the next show of a slot, and for all its shows in the coming `horizonDays`. */
export function registeredFor(program: WeeklyProgram, slotId: Id, registrations: Record<string, number>, now: number, horizonDays = 14) {
  const slot = program.slots.find((s) => s.id === slotId)
  const shows = slot ? occurrences({ ...program, slots: [slot] }, now, horizonDays) : []
  const next = shows.find((o) => showState(o, now) !== 'done')
  return { next: next ? (registrations[next.key] ?? 0) : 0, total: shows.reduce((n, o) => n + (registrations[o.key] ?? 0), 0), shows }
}

/**
 * What saving `next` over `prev` does, per changed slot. A show that has started is locked. A show people registered for can
 * change only when the editor confirms it. Only the shows of the coming `horizonDays` count.
 */
export function impactOf(prev: WeeklyProgram, next: WeeklyProgram, registrations: Record<string, number>, now: number, horizonDays = 14): ImpactItem[] {
  return changesBetween(prev, next).map((change) => {
    const was = prev.slots.find((s) => s.id === change.slotId)
    if (!was) return { change, severity: 'free', message: 'A new show. No one has registered.', registered: 0 }
    const { shows, next: nextCount, total: registered } = registeredFor(prev, was.id, registrations, now, horizonDays)
    const onAir = shows.find((o) => showState(o, now) === 'live')
    const what = change.kinds.map((k) => KIND_TEXT[k]).join(' and ')
    if (onAir) return { change, severity: 'blocked', message: `${change.label} is on air. A show that has started cannot be ${what}.`, registered }
    if (registered > 0) {
      const lower = change.kinds.includes('quota') && (next.slots.find((s) => s.id === was.id)?.quota ?? Infinity) < registered
      const tail = lower ? ' The new quota is below the number who registered.' : ''
      const scope = registered === nextCount ? '' : ` (${registered.toLocaleString('en')} for the coming weeks)`
      return { change, severity: 'confirm', message: `${people(nextCount || registered)} registered for the next ${change.label} show${scope}. It would be ${what}.${tail}`, registered }
    }
    return { change, severity: 'free', message: shows.length ? `No one has registered for ${change.label} yet.` : `${change.label} has no show in the next ${horizonDays} days.`, registered }
  })
}

export const worstSeverity = (items: ImpactItem[]): Severity => (items.some((i) => i.severity === 'blocked') ? 'blocked' : items.some((i) => i.severity === 'confirm') ? 'confirm' : 'free')

/* ---- Checks ------------------------------------------------------------------------------------------------------ */

export interface ProgramCheck {
  level: 'error' | 'warning'
  slotId?: Id
  text: string
}

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** The final of the week and how many seats the daily shows give it. */
export function seatsSummary(program: WeeklyProgram) {
  const dailies = program.slots.filter((s) => s.kind === 'daily')
  const seats = dailies.reduce((n, s) => n + s.seats, 0)
  const finals = program.slots.filter((s) => s.kind === 'final')
  const capacity = finals.reduce((n, s) => n + s.quota, 0)
  return { dailies, finals, seats, capacity, open: Math.max(0, capacity - seats) }
}

/** What is wrong with the program, worst first. */
export function programChecks(program: WeeklyProgram): ProgramCheck[] {
  const out: ProgramCheck[] = []
  const { dailies, finals, seats, capacity } = seatsSummary(program)

  if (finals.length === 0) out.push({ level: 'warning', text: 'There is no final. The daily shows have nothing to lead to.' })
  if (finals.length > 1) out.push({ level: 'error', slotId: finals[1].id, text: 'There is more than one final. A week has one.' })
  if (finals.length && seats > capacity) out.push({ level: 'error', slotId: finals[0].id, text: `The daily shows give ${seats.toLocaleString('en')} seats, but the final has room for ${capacity.toLocaleString('en')}.` })

  for (const s of program.slots) {
    if (s.quota < 1) out.push({ level: 'error', slotId: s.id, text: `${slotLabel(s)} has no room for anyone. Set a quota.` })
    if (s.kind === 'daily' && s.seats > s.quota) out.push({ level: 'error', slotId: s.id, text: `${slotLabel(s)} gives ${s.seats.toLocaleString('en')} final seats but has only ${s.quota.toLocaleString('en')} places.` })
    if (s.kind === 'daily' && s.seats < 1) out.push({ level: 'warning', slotId: s.id, text: `${slotLabel(s)} gives no final seat. People have no reason to play it.` })
    if (!s.topic.trim()) out.push({ level: 'error', slotId: s.id, text: `${slotLabel(s)} has no topic.` })
    const start = toMin(s.time)
    if (start < 7 * 60) out.push({ level: 'warning', slotId: s.id, text: `${slotLabel(s)} starts in the night. Few people will be awake.` })
  }

  const byDay = new Map<Weekday, ProgramSlot[]>()
  for (const s of program.slots) byDay.set(s.weekday, [...(byDay.get(s.weekday) ?? []), s])
  for (const list of byDay.values()) {
    const sorted = [...list].sort((a, b) => toMin(a.time) - toMin(b.time))
    for (let i = 1; i < sorted.length; i++) {
      if (toMin(sorted[i - 1].time) + sorted[i - 1].lengthMin > toMin(sorted[i].time)) out.push({ level: 'error', slotId: sorted[i].id, text: `${slotLabel(sorted[i])} starts before ${slotLabel(sorted[i - 1])} is over.` })
    }
  }

  if (finals.length) {
    const final = finals[0]
    for (const s of dailies) if (s.weekday > final.weekday || (s.weekday === final.weekday && toMin(s.time) >= toMin(final.time))) out.push({ level: 'warning', slotId: s.id, text: `${slotLabel(s)} is after the final, so its seats come too late.` })
  }

  const ordered = [...dailies].sort((a, b) => a.weekday - b.weekday)
  for (let i = 2; i < ordered.length; i++) {
    const [a, b, c] = [ordered[i - 2], ordered[i - 1], ordered[i]]
    if (a.topic && a.topic === b.topic && b.topic === c.topic && c.weekday - a.weekday === 2) out.push({ level: 'warning', slotId: c.id, text: `The topic "${c.topic}" runs three days in a row. Vary it.` })
  }

  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1))
}

let counter = 0
/** A new slot for a day, with the sensible defaults of the program: the time of the day before, the same quota. */
export function newSlot(program: WeeklyProgram, weekday: Weekday): ProgramSlot {
  const daily = program.slots.filter((s) => s.kind === 'daily')
  const model = daily[daily.length - 1]
  counter += 1
  return { id: `slot-${Date.now().toString(36)}${counter}`, weekday, time: model?.time ?? '20:00', lengthMin: model?.lengthMin ?? 20, kind: 'daily', topic: '', quota: model?.quota ?? 1000, seats: model?.seats ?? 10 }
}
