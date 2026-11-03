import { Check } from 'lucide-react'
import { cn } from '@/kit/lib/cn'
import type { Id, Survey } from '../data/types'

interface PollCardProps {
  /** A survey whose first question is a choice. */
  survey: Survey
  /** The option this person picked, once they voted. */
  voted?: Id
  /** How many votes each option has, by option id. Shown after the vote. */
  counts?: Record<Id, number>
  onVote: (optionId: Id) => void
  className?: string
}

/**
 * A one-tap poll for a break: tap an option and the bars open with how everyone voted. Results stay hidden until the person
 * votes, so they do not copy the crowd. The vote cannot be changed.
 */
export function PollCard({ survey, voted, counts = {}, onVote, className }: PollCardProps) {
  const q = survey.questions[0]
  if (!q || (q.type !== 'choice' && q.type !== 'multiple')) return null
  const total = Object.values(counts).reduce((n, c) => n + c, 0)
  const top = Math.max(1, ...Object.values(counts))
  return (
    <div className={cn('poll', voted && 'is-voted', className)} role="group" aria-label={q.prompt}>
      <strong className="poll-q">{q.prompt}</strong>
      {q.options.map((o) => {
        const n = counts[o.id] ?? 0
        return (
          <button key={o.id} type="button" className={cn('poll-opt', voted === o.id && 'is-mine')} disabled={Boolean(voted)} aria-pressed={voted === o.id} onClick={() => onVote(o.id)}>
            <span className="poll-bar" aria-hidden="true" style={{ width: voted ? `${(n / top) * 100}%` : '0%' }} />
            <span className="poll-label">
              {voted === o.id && <Check aria-label="Your vote" />} {o.label}
            </span>
            {voted && <span className="poll-n">{total ? `${Math.round((n / total) * 100)}%` : '0%'}</span>}
          </button>
        )
      })}
      {voted && <small className="poll-total">{total} vote{total === 1 ? '' : 's'}</small>}
    </div>
  )
}
