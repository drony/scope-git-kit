import { RotateCcw, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { Tag, type Tone } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { AuditEntry, Id } from '../data/types'
import { ACTION_LABEL, ENTITY_LABEL, diffEntry, groupByDay, revertedBy, sensitivity } from '../lib/audit'

const TONE: Record<AuditEntry['action'], Tone> = { create: 'success', update: 'neutral', delete: 'error', publish: 'accent', revert: 'warning' }

interface AuditFeedProps {
  /** The entries to show, newest first. */
  entries: AuditEntry[]
  /** Every entry, to tell which ones were reverted. Defaults to `entries`. */
  all?: AuditEntry[]
  selectedId?: Id | null
  onSelect: (id: Id) => void
  /** The clock, in milliseconds. */
  now: number
  /** How many entries to show at first. */
  pageSize?: number
  empty?: string
  className?: string
}

const time = (iso: string) => new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })

/**
 * The trail as a list in groups by day: the time, who, a sentence about what happened, what kind of thing it was, what was done,
 * how many fields changed, a shield when it is sensitive and a mark when it was reverted. Select one to read it. It starts with a
 * page of entries and has a button for more.
 */
export function AuditFeed({ entries, all, selectedId, onSelect, now, pageSize = 30, empty = 'No change matches.', className }: AuditFeedProps) {
  const [limit, setLimit] = useState(pageSize)
  const groups = groupByDay(entries.slice(0, limit), now)
  if (entries.length === 0) return <p className={cn('au-empty', className)}>{empty}</p>
  return (
    <div className={cn('au-feed', className)}>
      {groups.map((g) => (
        <section key={g.label} aria-label={g.label}>
          <h3>{g.label}</h3>
          <ul>
            {g.entries.map((e) => {
              const why = sensitivity(e)
              const reverted = revertedBy(e, all ?? entries)
              const fields = e.action === 'revert' ? 0 : diffEntry(e).length
              return (
                <li key={e.id}>
                  <button type="button" className={cn('au-row', selectedId === e.id && 'is-open', why && 'is-sensitive', reverted && 'is-reverted')} aria-current={selectedId === e.id ? 'true' : undefined} onClick={() => onSelect(e.id)}>
                    <time dateTime={e.at}>{time(e.at)}</time>
                    <span className="au-who" title={e.actor} aria-hidden="true">
                      {e.actor.slice(0, 1)}
                    </span>
                    <span className="au-what">
                      <strong>{e.summary}</strong>
                      <small>
                        {e.actor} · {ENTITY_LABEL[e.entity]}
                        {fields > 0 && ` · ${fields} field${fields === 1 ? '' : 's'} changed`}
                      </small>
                    </span>
                    <span className="au-marks">
                      {why && (
                        <span className="au-risk" title={why}>
                          <ShieldAlert aria-label={`Sensitive: ${why}`} />
                        </span>
                      )}
                      {reverted && (
                        <span className="au-undone" title={`Reverted by ${reverted.actor}`}>
                          <RotateCcw aria-label={`Reverted by ${reverted.actor}`} />
                        </span>
                      )}
                      <Tag tone={TONE[e.action]}>{ACTION_LABEL[e.action]}</Tag>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      {entries.length > limit && (
        <button type="button" className="au-more" onClick={() => setLimit((n) => n + pageSize)}>
          Show {Math.min(pageSize, entries.length - limit)} more ({(entries.length - limit).toLocaleString('en')} left)
        </button>
      )}
    </div>
  )
}
