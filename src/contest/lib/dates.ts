/** Small date helpers for lists of messages and events. `now` is a parameter so a demo or a test can fix the clock. */

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** "Today", "Yesterday", or the date ("Mar 3", with the year when it is not this year). */
export function dayLabel(iso: string, now: Date = new Date(), locale = 'en'): string {
  const d = new Date(iso)
  if (sameDay(d, now)) return 'Today'
  if (sameDay(d, new Date(now.getTime() - 86_400_000))) return 'Yesterday'
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', ...(d.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }) }).format(d)
}

/** "just now", "5 min ago", "3 h ago", then the day. */
export function relativeTime(iso: string, now: Date = new Date(), locale = 'en'): string {
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  if (mins < 60 * 24 && sameDay(new Date(iso), now)) return `${Math.floor(mins / 60)} h ago`
  return dayLabel(iso, now, locale)
}

export const timeLabel = (iso: string, locale = 'en'): string => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
