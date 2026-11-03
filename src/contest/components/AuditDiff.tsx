import { cn } from '@/kit/lib/cn'
import type { FieldChange } from '../lib/audit'

interface AuditDiffProps {
  /** What changed, field by field. See `diffEntry`. */
  changes: FieldChange[]
  /** Shown when there is nothing to list. */
  empty?: string
  className?: string
}

/**
 * What an entry changed, as phrases and not as JSON: the name of the field, the value it had and the value it has now. A list of
 * things says what was added, removed and changed in it. Added values are green, removed ones red, and each says so in words too.
 */
export function AuditDiff({ changes, empty = 'No field changed. The entry records that something happened.', className }: AuditDiffProps) {
  if (changes.length === 0) return <p className={cn('au-none', className)}>{empty}</p>
  return (
    <dl className={cn('au-diff', className)} aria-label="What changed">
      {changes.map((c) => (
        <div key={c.path} className={`is-${c.kind}`}>
          <dt>{c.label}</dt>
          <dd>
            {c.detail ? (
              <ul>
                {c.detail.map((d) => (
                  <li key={d} className={cn(d.startsWith('Added') && 'is-added', d.startsWith('Removed') && 'is-removed')}>
                    {d}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                {c.kind !== 'added' && <del title={c.from}>{c.from}</del>}
                {c.kind === 'changed' && <span aria-label="became"> → </span>}
                {c.kind === 'added' && <b className="au-tag">Added</b>}
                {c.kind === 'removed' && <b className="au-tag">Removed</b>}
                {c.kind !== 'removed' && <ins title={c.to}>{c.to}</ins>}
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
