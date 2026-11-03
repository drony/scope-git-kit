import { cn } from '@/kit/lib/cn'
import type { ReviewEvent } from '../data/types'
import { relativeTime } from '../lib/dates'

interface ReviewHistoryProps {
  events: ReviewEvent[]
  /** Replaces the clock for "3 days ago", for tests and demos. */
  now?: Date
  className?: string
}

const WORDS: Record<ReviewEvent['action'], string> = {
  create: 'wrote it',
  edit: 'changed it',
  submit: 'sent it for review',
  preapprove: 'pre-approved it',
  approve: 'approved it',
  return: 'returned it',
  withdraw: 'withdrew it',
  trash: 'moved it to the trash',
  restore: 'restored it',
}

/** What happened to a question, newest first: who did what, when, and the reason when they gave one. */
export function ReviewHistory({ events, now, className }: ReviewHistoryProps) {
  if (events.length === 0) return <p className={cn('rv-none', className)}>No history yet.</p>
  return (
    <ol className={cn('rv-history', className)} aria-label="History">
      {[...events].reverse().map((e, i) => (
        <li key={`${e.at}-${i}`}>
          <i className={cn('rv-dot', `is-${e.to}`)} aria-hidden="true" />
          <span>
            <b>{e.actor}</b> {WORDS[e.action]}
            <time dateTime={e.at}>{relativeTime(e.at, now)}</time>
            {e.note && <q>{e.note}</q>}
          </span>
        </li>
      ))}
    </ol>
  )
}
