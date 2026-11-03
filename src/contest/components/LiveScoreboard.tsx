import { Flame } from 'lucide-react'
import { useFlip } from '@/kit/hooks/useFlip'
import { cn } from '@/kit/lib/cn'
import type { Id } from '../data/types'
import type { LiveRow } from '../lib/live'

interface LiveScoreboardProps {
  rows: LiveRow[]
  /** Shows the best N. The person in `highlightId` is always shown, even below the line. */
  limit?: number
  highlightId?: Id
  className?: string
}

/** The scoreboard of a live show: place, name, points, the points just won, and a flame for a streak of right answers. Rows slide when the order changes. */
export function LiveScoreboard({ rows, limit = 5, highlightId, className }: LiveScoreboardProps) {
  const top = rows.slice(0, limit)
  const me = highlightId ? rows.find((r) => r.id === highlightId) : undefined
  const shown = me && !top.includes(me) ? [...top, me] : top
  const list = useFlip<HTMLOListElement>(shown.map((r) => r.id))
  return (
    <ol ref={list} className={cn('lsb', className)} aria-label="Scoreboard">
      {shown.map((r) => (
        <li key={r.id} data-flip={r.id} className={cn('lsb-row', r.id === highlightId && 'is-you')}>
          <span className="lsb-rank">{rows.every((x) => x.points === 0) ? '–' : r.rank}</span>
          <span className="lsb-name">{r.name}</span>
          {r.streak >= 2 && (
            <span className="lsb-streak" title={`${r.streak} right in a row`}>
              <Flame aria-hidden="true" /> {r.streak}
            </span>
          )}
          {r.gained > 0 && <span className="lsb-gain">+{r.gained}</span>}
          <span className="lsb-points">{r.points}</span>
        </li>
      ))}
      {shown.length === 0 && <li className="lsb-empty">Nobody has scored yet.</li>}
    </ol>
  )
}
