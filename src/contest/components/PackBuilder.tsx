import { CircleAlert, TriangleAlert } from 'lucide-react'
import { Textarea } from '@/kit/components/forms/Field'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { Topic } from '../data/types'
import type { PackProblem, TopicCoverage } from '../lib/packs'

interface PackBuilderProps {
  topics: Topic[]
  /** The coverage rows, for the number of questions each topic would give. */
  rows: TopicCoverage[]
  /** The topics chosen for the pack. */
  selected: string[]
  onSelectedChange: (ids: string[]) => void
  /** What is wrong with publishing these topics. See `packProblems`. */
  problems: PackProblem[]
  note: string
  onNoteChange: (note: string) => void
  /** The revision the pack would get. */
  nextRevision: number
  onPublish: () => void
  busy?: boolean
  className?: string
}

/**
 * Making the next pack: tick the topics, read what is wrong, say what changed, and publish. The server builds the pack from the
 * approved questions, so the screen only chooses topics. An archived topic cannot be chosen; a topic with nothing approved is an
 * error, a thin one a warning. A show that has begun keeps the pack it was opened with.
 */
export function PackBuilder({ topics, rows, selected, onSelectedChange, problems, note, onNoteChange, nextRevision, onPublish, busy, className }: PackBuilderProps) {
  const errors = problems.filter((p) => p.level === 'error')
  const canPublish = errors.length === 0 && note.trim().length >= 5
  const total = rows.filter((r) => selected.includes(r.topic.id)).reduce((n, r) => n + r.available, 0)
  return (
    <form
      className={cn('pk-builder', className)}
      onSubmit={(e) => {
        e.preventDefault()
        if (canPublish) onPublish()
      }}
    >
      <fieldset>
        <legend>Topics</legend>
        <ul>
          {topics.map((t) => {
            const r = rows.find((x) => x.topic.id === t.id)
            return (
              <li key={t.id}>
                <label className={cn(t.archived && 'is-off')}>
                  <input type="checkbox" className="pk-check" checked={selected.includes(t.id)} disabled={t.archived} onChange={(e) => onSelectedChange(e.target.checked ? [...selected, t.id] : selected.filter((x) => x !== t.id))} />
                  <span>{t.name}</span>
                  <small>{t.archived ? 'archived' : `${r?.available ?? 0} questions`}</small>
                </label>
              </li>
            )
          })}
        </ul>
        <button type="button" className="pk-link" onClick={() => onSelectedChange(topics.filter((t) => !t.archived && (rows.find((r) => r.topic.id === t.id)?.available ?? 0) > 0).map((t) => t.id))}>
          Every topic that has questions
        </button>
      </fieldset>
      {problems.length > 0 && (
        <ul className="pk-problems" aria-label="Problems">
          {problems.map((p) => (
            <li key={p.text} className={`is-${p.level}`}>
              {p.level === 'error' ? <CircleAlert aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
              {p.text}
            </li>
          ))}
        </ul>
      )}
      <label className="pk-note">
        What changed
        <Textarea rows={2} value={note} placeholder="For example: The new geography questions." onChange={(e) => onNoteChange(e.target.value)} />
      </label>
      <p className="pk-promise">The pack holds {total.toLocaleString('en')} questions. A show that has begun keeps the pack it was opened with.</p>
      <Button type="submit" disabled={!canPublish} loading={busy}>
        Publish revision {nextRevision}
      </Button>
    </form>
  )
}
