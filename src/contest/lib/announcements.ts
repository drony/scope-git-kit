import type { Announcement } from '../data/types'
import { findUnknownFields } from './templates'

/** What stops an announcement from going out, in words. An empty list means it is ready. `reach` is how many people it reaches. */
export function announcementProblems(a: Pick<Announcement, 'title' | 'body' | 'channels' | 'status' | 'scheduledAt'>, reach: number, now: Date = new Date()): string[] {
  const problems: string[] = []
  if (!a.title.trim()) problems.push('Give it a title.')
  if (!a.body.trim()) problems.push('Write the message.')
  if (a.channels.length === 0) problems.push('Choose at least one channel.')
  if (reach === 0) problems.push('Nobody is in this audience yet.')
  const unknown = findUnknownFields(`${a.title} ${a.body}`)
  if (unknown.length) problems.push(`Unknown merge field${unknown.length > 1 ? 's' : ''}: ${unknown.map((u) => `{{${u}}}`).join(', ')}.`)
  if (a.status === 'scheduled' && (!a.scheduledAt || new Date(a.scheduledAt) <= now)) problems.push('Pick a time in the future to schedule it.')
  return problems
}
