import { cn } from '@/kit/lib/cn'
import type { Question } from '../data/types'
import type { PackDiff } from '../lib/packs'

interface PackDiffListProps {
  diff: PackDiff
  /** How many questions to show in each group before "and N more". */
  limit?: number
  className?: string
}

const Group = ({ title, tone, items, limit }: { title: string; tone: string; items: { id: string; text: string }[]; limit: number }) =>
  items.length === 0 ? null : (
    <section className={cn('pk-group', tone)}>
      <h4>
        {title} <b>{items.length}</b>
      </h4>
      <ul>
        {items.slice(0, limit).map((i) => (
          <li key={i.id}>
            <code>{i.id}</code>
            {i.text}
          </li>
        ))}
        {items.length > limit && <li className="pk-more">and {items.length - limit} more</li>}
      </ul>
    </section>
  )

const text = (q?: Question) => q?.prompt ?? 'The question was deleted.'

/** What changed in the bank since a pack was made, in four groups: still served but returned or deleted, edited, in an archived topic, and approved since. */
export function PackDiffList({ diff, limit = 4, className }: PackDiffListProps) {
  const empty = diff.withdrawn.length + diff.changed.length + diff.archived.length + diff.added.length === 0
  return (
    <div className={cn('pk-diff', className)}>
      <Group title="Returned or deleted, still served" tone="is-error" limit={limit} items={diff.withdrawn.map((w) => ({ id: w.item.questionId, text: text(w.question) }))} />
      <Group title="In an archived topic" tone="is-warning" limit={limit} items={diff.archived.map((q) => ({ id: q.id, text: text(q) }))} />
      <Group title="Edited since" tone="is-warning" limit={limit} items={diff.changed.map((q) => ({ id: q.id, text: text(q) }))} />
      <Group title="Approved since" tone="is-info" limit={limit} items={diff.added.map((q) => ({ id: q.id, text: text(q) }))} />
      {empty && <p className="pk-none">Nothing changed. {diff.unchanged.toLocaleString('en')} questions are as the pack has them.</p>}
    </div>
  )
}
