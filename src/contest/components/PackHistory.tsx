import { Tag } from '@/kit/components/ui/Badge'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { ContentPack } from '../data/types'
import { relativeTime } from '../lib/dates'

interface PackHistoryProps {
  packs: ContentPack[]
  /** The clock, in milliseconds. */
  now: number
  /** Shows a "Restore" button on packs that are not in force. */
  onRestore?: (pack: ContentPack) => void
  className?: string
}

/** Every pack, newest first: its revision, whether it is in force, who made it, what changed, how many questions, and how that differs from the pack before it. A pack that is not in force can be restored. */
export function PackHistory({ packs, now, onRestore, className }: PackHistoryProps) {
  const sorted = [...packs].sort((a, b) => b.revision - a.revision)
  return (
    <ol className={cn('pk-history', className)} aria-label="Packs">
      {sorted.map((p, i) => {
        const before = sorted[i + 1]
        const delta = before ? p.items.length - before.items.length : undefined
        return (
          <li key={p.id} className={cn(!p.retiredAt && 'is-active')}>
            <span className="pk-rev">r{p.revision}</span>
            <span className="pk-what">
              <strong>
                {p.items.length.toLocaleString('en')} questions
                {delta !== undefined && delta !== 0 && <em className={delta > 0 ? 'is-more' : 'is-less'}> {delta > 0 ? '+' : '−'}{Math.abs(delta)}</em>}
                {!p.retiredAt ? <Tag tone="success">in force</Tag> : <Tag tone="neutral">retired</Tag>}
              </strong>
              <q>{p.note}</q>
              <small>
                {p.createdBy} · {relativeTime(p.createdAt, new Date(now))} · {p.topics.length} topics
              </small>
            </span>
            {onRestore && p.retiredAt && (
              <Button size="sm" variant="plain" onClick={() => onRestore(p)}>
                Restore
              </Button>
            )}
          </li>
        )
      })}
    </ol>
  )
}
