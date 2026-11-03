import { Crown } from 'lucide-react'
import { Avatar } from '@/kit/components/ui/Avatar'
import { cn } from '@/kit/lib/cn'
import type { RankedRow } from '../lib/ranking'

/** The first three of a ranking on a podium: first in the middle and tallest, second on the left, third on the right. */
export function Podium({ rows, className }: { rows: RankedRow[]; className?: string }) {
  const top = rows.slice(0, 3)
  if (top.length === 0) return null
  // Left to right: second, first, third.
  const order = [top[1], top[0], top[2]].filter((r): r is RankedRow => Boolean(r))
  return (
    <ol className={cn('cs-podium', className)} aria-label="Podium">
      {order.map((r) => (
        <li key={r.id} className={cn('cs-podium-step', `is-place-${top.indexOf(r) + 1}`)}>
          <span className="cs-podium-who">
            {top.indexOf(r) === 0 && <Crown className="cs-podium-crown" aria-hidden="true" />}
            <Avatar name={r.name} size={top.indexOf(r) === 0 ? 56 : 44} />
            <strong>{r.name}</strong>
            {r.team && <small>{r.team}</small>}
          </span>
          <span className="cs-podium-block">
            <b>{r.rank}</b>
            <span>{r.points} points</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
