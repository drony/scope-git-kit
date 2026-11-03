/**
 * Fictional data for the weekly program: one daily show from Monday to Saturday, a final on Sunday, and registration
 * counts for the next two weeks. The counts are generated from a fixed seed, so every visitor sees the same numbers; they are
 * highest for the nearest shows, and one show is full.
 */
import type { ProgramSlot, WeeklyProgram } from '@/contest/data/types'
import { occurrences } from '@/contest/lib/program'
import { mulberry32 } from '@/kit/lib/random'
import { day } from './time'

const TOPICS = ['science', 'geography', 'history', 'space', 'maths', 'arts'] as const

const dailies: ProgramSlot[] = TOPICS.map((topic, i) => ({
  id: `d${i + 1}`,
  weekday: (i + 1) as ProgramSlot['weekday'],
  time: '20:00',
  lengthMin: 20,
  kind: 'daily',
  topic,
  quota: 1000,
  seats: 60,
}))

export const PROGRAM: WeeklyProgram = {
  id: 'program',
  revision: 2,
  timezone: 'Europe/Istanbul',
  slots: [...dailies, { id: 'final', weekday: 7, time: '20:00', lengthMin: 45, kind: 'final', topic: 'general', quota: 500, seats: 0 }],
  savedAt: day(-9, 10),
  savedBy: 'Ada',
}

export function registrations(): Record<string, number> {
  const rand = mulberry32(2026)
  const out: Record<string, number> = {}
  occurrences(PROGRAM, Date.now(), 14).forEach((o, i) => {
    const share = Math.max(0.03, 0.88 - i * 0.07) * (0.8 + 0.4 * rand())
    out[o.key] = i === 1 ? o.slot.quota : Math.min(o.slot.quota, Math.round(o.slot.quota * share))
  })
  return out
}
