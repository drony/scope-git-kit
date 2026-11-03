import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { ContentPack } from '../data/types'
import { relativeTime } from '../lib/dates'
import { driftCount, type PackDiff } from '../lib/packs'

interface PackStatusProps {
  /** The pack in force, or undefined when none was published. */
  pack?: ContentPack
  /** How the bank has moved since it was made. See `diffPack`. */
  diff?: PackDiff
  /** The clock, in milliseconds. */
  now: number
  /** Shows a "Publish a new pack" button. */
  onPublish?: () => void
  className?: string
}

/**
 * The pack that is being served: its revision, who made it and when, how many questions and topics it holds, and how far the bank
 * has moved since. A question that was returned to review but is still served is called out first: players can still get it until
 * a new pack is published.
 */
export function PackStatus({ pack, diff, now, onPublish, className }: PackStatusProps) {
  if (!pack) {
    return (
      <section className={cn('pk-status is-none', className)} aria-label="Pack in force">
        <h3>No pack in force</h3>
        <p>Nothing is served until a pack is published.</p>
        {onPublish && <Button onClick={onPublish}>Publish a pack</Button>}
      </section>
    )
  }
  const drift = diff ? driftCount(diff) : 0
  return (
    <section className={cn('pk-status', diff && diff.withdrawn.length > 0 && 'is-bad', className)} aria-label="Pack in force">
      <header>
        <div>
          <span className="pk-eyebrow">In force</span>
          <h3>Revision {pack.revision}</h3>
          <p>
            {pack.items.length.toLocaleString('en')} questions in {pack.topics.length} topics · made by {pack.createdBy} {relativeTime(pack.createdAt, new Date(now))}
          </p>
          {pack.note && <q>{pack.note}</q>}
        </div>
        {onPublish && (
          <Button variant={drift > 0 ? 'primary' : 'plain'} onClick={onPublish}>
            Publish a new pack
          </Button>
        )}
      </header>
      {diff && (
        <ul className="pk-drift" aria-label="Since this pack was made">
          {diff.withdrawn.length > 0 && (
            <li className="is-error">
              <CircleAlert aria-hidden="true" />
              <b>{diff.withdrawn.length}</b> {diff.withdrawn.length === 1 ? 'question was' : 'questions were'} returned to review or deleted, but {diff.withdrawn.length === 1 ? 'is' : 'are'} still served.
            </li>
          )}
          {diff.archived.length > 0 && (
            <li className="is-warning">
              <TriangleAlert aria-hidden="true" />
              <b>{diff.archived.length}</b> {diff.archived.length === 1 ? 'question is' : 'questions are'} in a topic that was archived since.
            </li>
          )}
          {diff.changed.length > 0 && (
            <li className="is-warning">
              <TriangleAlert aria-hidden="true" />
              <b>{diff.changed.length}</b> {diff.changed.length === 1 ? 'question was' : 'questions were'} edited since. The pack serves the old {diff.changed.length === 1 ? 'version' : 'versions'}.
            </li>
          )}
          {diff.added.length > 0 && (
            <li>
              <TriangleAlert aria-hidden="true" />
              <b>{diff.added.length}</b> {diff.added.length === 1 ? 'question was' : 'questions were'} approved since and {diff.added.length === 1 ? 'is' : 'are'} not served yet.
            </li>
          )}
          {drift === 0 && (
            <li className="is-ok">
              <CircleCheck aria-hidden="true" />
              The pack is up to date with the bank.
            </li>
          )}
        </ul>
      )}
    </section>
  )
}
