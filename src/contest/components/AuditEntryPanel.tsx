import { RotateCcw, ShieldAlert } from 'lucide-react'
import { Button } from '@/kit/components/ui/Button'
import { Alert } from '@/kit/components/ui/Feedback'
import { cn } from '@/kit/lib/cn'
import type { AuditEntry, Id } from '../data/types'
import { ACTION_LABEL, ENTITY_LABEL, diffEntry, laterChanges, relatedTo, revertRule, revertedBy, sensitivity } from '../lib/audit'
import { relativeTime } from '../lib/dates'
import { AuditDiff } from './AuditDiff'

interface AuditEntryPanelProps {
  entry: AuditEntry
  /** Every entry: the panel looks for other changes to the same thing and for a revert. */
  entries: AuditEntry[]
  /** The clock, in milliseconds. */
  now: number
  /** Called when the person asks to revert. Ask again before you do it: see the text of the button. */
  onRevert: (entry: AuditEntry) => void
  /** Called with the id of another entry that was chosen in the list of related changes. */
  onSelect: (id: Id) => void
  busy?: boolean
  className?: string
}

/**
 * One entry in full: who did what to which thing and when, why it is sensitive (if it is), what changed field by field, whether it
 * can be reverted and what a revert would also undo, and the other changes to the same thing. The trail is append-only: a revert
 * is a new entry, never an edit of this one.
 */
export function AuditEntryPanel({ entry: e, entries, now, onRevert, onSelect, busy, className }: AuditEntryPanelProps) {
  const why = sensitivity(e)
  const rule = revertRule(e)
  const reverted = revertedBy(e, entries)
  const later = laterChanges(e, entries)
  const related = relatedTo(e, entries).slice(0, 6)
  const changes = e.action === 'revert' ? [] : diffEntry(e)
  return (
    <article className={cn('au-panel', className)} aria-label="Change">
      <header>
        <span className="au-kind">
          {ACTION_LABEL[e.action]} · {ENTITY_LABEL[e.entity]}
        </span>
        <h2>{e.summary}</h2>
        <p>
          <b>{e.actor}</b> · <time dateTime={e.at}>{new Date(e.at).toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time> · {relativeTime(e.at, new Date(now))}
          <br />
          <code>{e.entityId}</code>
        </p>
      </header>

      {why && (
        <Alert tone="warning" title="Sensitive">
          <ShieldAlert aria-hidden="true" className="au-alert-icon" /> {why}
        </Alert>
      )}
      {reverted && (
        <Alert tone="info" title={`Reverted by ${reverted.actor}`}>
          {relativeTime(reverted.at, new Date(now))}. The thing was put back as it was before this change.{' '}
          <button type="button" className="au-link" onClick={() => onSelect(reverted.id)}>
            See the revert
          </button>
        </Alert>
      )}

      <section aria-label="What changed">
        <h3>What changed</h3>
        <AuditDiff changes={changes} empty={e.action === 'revert' ? 'A revert puts a thing back as it was. Open the change it reverted to see the fields.' : undefined} />
      </section>

      <section aria-label="Revert" className="au-revert">
        <h3>Revert</h3>
        {rule.can && !reverted ? (
          <>
            <p>Puts the {ENTITY_LABEL[e.entity].toLowerCase()} back the way it was before this change. The revert is a new entry in the trail.</p>
            {later.length > 0 && (
              <p className="au-warn">
                {later.length} later change{later.length === 1 ? '' : 's'} to the same thing will be undone too.
              </p>
            )}
            <Button variant="plain" size="sm" disabled={busy} onClick={() => onRevert(e)}>
              <RotateCcw aria-hidden="true" /> Revert this change
            </Button>
          </>
        ) : (
          <p className="au-muted">{reverted ? 'Already reverted.' : rule.why}</p>
        )}
      </section>

      {related.length > 0 && (
        <section aria-label="Other changes to this thing">
          <h3>Other changes to this {ENTITY_LABEL[e.entity].toLowerCase()}</h3>
          <ul className="au-related">
            {related.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => onSelect(r.id)}>
                  <span>{r.summary}</span>
                  <small>
                    {r.actor} · {relativeTime(r.at, new Date(now))}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
