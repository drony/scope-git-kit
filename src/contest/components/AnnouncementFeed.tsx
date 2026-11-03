import { Pin } from 'lucide-react'
import { EmptyState } from '@/kit/components/ui/Feedback'
import { cn } from '@/kit/lib/cn'
import type { Announcement } from '../data/types'
import { dayLabel } from '../lib/dates'
import { renderTemplate, type TemplateVars } from '../lib/templates'

interface AnnouncementFeedProps {
  announcements: Announcement[]
  /** The reader's own values for the merge fields (name, team, contest). */
  vars?: TemplateVars
  now?: Date
  className?: string
}

/** What a participant reads: the announcements that were sent, pinned ones first, then the newest. */
export function AnnouncementFeed({ announcements, vars = {}, now = new Date(), className }: AnnouncementFeedProps) {
  const sent = announcements
    .filter((a) => a.status === 'sent')
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))

  if (sent.length === 0) return <EmptyState title="No announcements yet">News from the organisers shows up here.</EmptyState>

  return (
    <div className={cn('cs-feed', className)}>
      {sent.map((a) => (
        <article key={a.id} className={cn('cs-feed-item', a.pinned && 'is-pinned')}>
          <header>
            <h3>{renderTemplate(a.title, vars)}</h3>
            {a.pinned && (
              <span className="cs-feed-pin">
                <Pin aria-hidden="true" /> Pinned
              </span>
            )}
          </header>
          <p>{renderTemplate(a.body, vars)}</p>
          {a.sentAt && <time dateTime={a.sentAt}>{dayLabel(a.sentAt, now)}</time>}
        </article>
      ))}
    </div>
  )
}
