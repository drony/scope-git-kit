/** Reminders before a show: when each one is due, and which are due now. */
import type { Episode, Reminder } from '../data/types'

/** The usual ladder: a day before, an hour before, ten minutes before, and "it is starting". */
export const DEFAULT_REMINDERS: Array<Omit<Reminder, 'id'>> = [
  { offsetMin: 1440, channels: ['in-app', 'email'] },
  { offsetMin: 60, channels: ['in-app', 'push'] },
  { offsetMin: 10, channels: ['push'] },
  { offsetMin: 0, channels: ['in-app', 'push'] },
]

export const reminderTime = (episode: Episode, r: Reminder): number => new Date(episode.startsAt).getTime() - r.offsetMin * 60_000

/** "1 day before", "10 minutes before", "At the start". */
export function offsetLabel(offsetMin: number): string {
  if (offsetMin === 0) return 'At the start'
  if (offsetMin % 1440 === 0) return `${offsetMin / 1440} day${offsetMin === 1440 ? '' : 's'} before`
  if (offsetMin % 60 === 0) return `${offsetMin / 60} hour${offsetMin === 60 ? '' : 's'} before`
  return `${offsetMin} minutes before`
}

/** The reminders that are due and not sent. A show that already started sends nothing except the "starting now" one. */
export function dueReminders(episode: Episode, now: number): Reminder[] {
  if (episode.status === 'draft' || episode.status === 'finished') return []
  const start = new Date(episode.startsAt).getTime()
  return episode.reminders.filter((r) => !r.sentAt && reminderTime(episode, r) <= now && (now < start || r.offsetMin === 0))
}
