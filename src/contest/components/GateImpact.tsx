import { CircleAlert, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Checkbox } from '@/kit/components/forms/Controls'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { BuildUsage, VersionGate } from '../data/types'
import { gateProblems, percent, reviewGate, stopped, storeName, type Impact, type ShowWindow } from '../lib/gate'

interface GateImpactProps {
  /** The gate in force. */
  prev: VersionGate
  /** The gate with the edits. */
  next: VersionGate
  usage: BuildUsage[]
  /** The clock, in milliseconds. */
  now: number
  /** Shows that are on or about to start, so a start time in the middle of one is flagged. */
  shows?: ShowWindow[]
  /** Called with `true` when the editor ticked the confirm box. */
  onSave: (confirmed: boolean) => void
  onDiscard: () => void
  saving?: boolean
  className?: string
}

const Bar = ({ i }: { i: Impact }) => (
  <span className="gt-split" role="img" aria-label={`Current ${percent(i.ok, i.total)}%, suggested ${percent(i.recommended, i.total)}%, required ${percent(i.required, i.total)}%, stopped ${percent(i.blocked, i.total)}%`}>
    <i className="is-ok" style={{ width: `${percent(i.ok, i.total)}%` }} />
    <i className="is-recommended" style={{ width: `${percent(i.recommended, i.total)}%` }} />
    <i className="is-required" style={{ width: `${percent(i.required, i.total)}%` }} />
    <i className="is-blocked" style={{ width: `${percent(i.blocked, i.total)}%` }} />
  </span>
)

/**
 * The review before a save, in numbers of people: for every store that changed, how many players cannot play before and after,
 * and who is newly stopped. It says why a confirmation is needed (an emergency, or a tenth of a store's players or more), warns
 * when the start time falls in a show, lists errors that stop the save, and shows nothing while nothing has changed.
 */
export function GateImpact({ prev, next, usage, now, shows = [], onSave, onDiscard, saving, className }: GateImpactProps) {
  const [confirmed, setConfirmed] = useState(false)
  const review = reviewGate(prev, next, usage, now, shows)
  if (!review.changed) return null
  const errors = gateProblems(next, usage).filter((p) => p.level === 'error')
  const later = !next.emergency && next.effectiveAt && Date.parse(next.effectiveAt) > now
  const canSave = errors.length === 0 && (!review.needsConfirm || confirmed)
  return (
    <section className={cn('gt-impact', review.needsConfirm && 'is-confirm', next.emergency && 'is-emergency', className)} aria-label="Review the changes">
      <header>
        <strong>{next.emergency ? 'Emergency change' : later ? 'Scheduled change' : 'Review the change'}</strong>
        <span>
          Revision {prev.revision} → {prev.revision + 1}
        </span>
      </header>
      <ul className="gt-stores">
        {review.stores
          .filter((s) => s.changed || s.newlyStopped !== 0)
          .map((s) => (
            <li key={s.store}>
              <b>{storeName(s.store)}</b>
              <span className="gt-before">
                <small>Before</small>
                <Bar i={s.before} />
                <em>{stopped(s.before).toLocaleString('en')} cannot play</em>
              </span>
              <span className="gt-after">
                <small>After</small>
                <Bar i={s.after} />
                <em>
                  {stopped(s.after).toLocaleString('en')} cannot play
                  {s.newlyStopped !== 0 && (
                    <strong className={s.newlyStopped > 0 ? 'is-more' : 'is-less'}>
                      {' '}
                      ({s.newlyStopped > 0 ? '+' : '−'}
                      {Math.abs(s.newlyStopped).toLocaleString('en')})
                    </strong>
                  )}
                </em>
              </span>
            </li>
          ))}
      </ul>
      {(review.reasons.length > 0 || review.timing.length > 0) && (
        <ul className="gt-notes">
          {[...review.reasons, ...review.timing].map((t) => (
            <li key={t}>
              <TriangleAlert aria-hidden="true" /> {t}
            </li>
          ))}
        </ul>
      )}
      {errors.length > 0 && (
        <ul className="gt-notes is-error" aria-label="Fix first">
          {errors.map((e) => (
            <li key={e.text}>
              <CircleAlert aria-hidden="true" /> {e.text}
            </li>
          ))}
        </ul>
      )}
      {review.needsConfirm && <Checkbox checked={confirmed} onChange={setConfirmed} label={next.emergency ? 'I understand that this applies at once and stops people who are playing.' : 'I understand that these players cannot play until they update.'} />}
      <footer>
        <Button variant="plain" size="sm" onClick={onDiscard}>
          Discard
        </Button>
        <Button size="sm" disabled={!canSave} loading={saving} onClick={() => onSave(review.needsConfirm && confirmed)}>
          {later ? 'Schedule' : 'Save'} revision {prev.revision + 1}
        </Button>
      </footer>
    </section>
  )
}
