/** Notification preferences: who wants what, and whether a message may go out right now. */
import type { Channel, NotificationCategory, NotificationPrefs, Id } from '../data/types'

export const CATEGORIES: Array<{ value: NotificationCategory; label: string; hint: string }> = [
  { value: 'episode', label: 'Show reminders', hint: 'Before a live show, and when it starts.' },
  { value: 'results', label: 'Results', hint: 'Your score and the leaderboard after a show.' },
  { value: 'announcement', label: 'Announcements', hint: 'News from the organisers.' },
  { value: 'survey', label: 'Surveys', hint: 'A short question after a show.' },
]
export const CHANNELS: Array<{ value: Channel; label: string }> = [
  { value: 'in-app', label: 'In the app' },
  { value: 'email', label: 'E-mail' },
  { value: 'push', label: 'Push' },
]

export function defaultPrefs(participantId: Id): NotificationPrefs {
  const row = (email: boolean, push: boolean): Record<Channel, boolean> => ({ 'in-app': true, email, push })
  return {
    participantId,
    matrix: { episode: row(true, true), results: row(false, true), announcement: row(true, false), survey: row(false, false) },
    quiet: { from: '22:00', to: '08:00', timezone: 'UTC' },
    digest: 'off',
  }
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** The time of day (minutes since midnight) in a time zone. */
export function minutesIn(timezone: string, at: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone }).formatToParts(at)
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24
    return h * 60 + Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  } catch {
    return at.getUTCHours() * 60 + at.getUTCMinutes()
  }
}

/** True when `at` falls inside the quiet hours. A range such as 22:00 to 08:00 runs past midnight. */
export function inQuietHours(quiet: NotificationPrefs['quiet'], at: Date): boolean {
  if (!quiet) return false
  const now = minutesIn(quiet.timezone, at)
  const from = minutes(quiet.from)
  const to = minutes(quiet.to)
  return from === to ? false : from < to ? now >= from && now < to : now >= from || now < to
}

export type Verdict = 'send' | 'off' | 'held'

/**
 * May this message go out? `off`: the person turned the channel off for this kind of message. `held`: it waits for the end of
 * the quiet hours, or for the daily digest. A critical message ("the show is starting") ignores both, except an "off" switch.
 * In-app messages are never held: they sit quietly in the bell.
 */
export function allowed(prefs: NotificationPrefs, category: NotificationCategory, channel: Channel, at: Date, critical = false): Verdict {
  if (!prefs.matrix[category][channel]) return 'off'
  if (channel === 'in-app' || critical) return 'send'
  if (inQuietHours(prefs.quiet, at)) return 'held'
  if (prefs.digest === 'daily') return 'held'
  return 'send'
}
