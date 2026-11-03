import { useEffect, useRef } from 'react'
import { cn } from '@/kit/lib/cn'
import { Tag, type Tone } from '@/kit/components/ui/Badge'
import type { AnswerKey, Id, Question, ReviewStage } from '../data/types'
import { DEFAULT_POLICY, isStale, isWaiting, reviewOf, stageName, stageOf, waitingDays, type ReviewPolicy } from '../lib/review'
import { reviewFlags } from '../lib/review'
import { typeInfo } from '../lib/questionTypes'
import { DifficultyMeter } from './DifficultyMeter'
import { SourceBadge } from './SourceBadge'

const TONE: Record<ReviewStage, Tone> = { draft: 'neutral', pending: 'warning', preapproved: 'accent', approved: 'success', returned: 'error', trashed: 'neutral' }

interface ReviewQueueProps {
  questions: Question[]
  keys: Record<Id, AnswerKey>
  selectedId?: Id | null
  onSelect: (question: Question) => void
  /** Ids ticked for a bulk action. */
  checked: Id[]
  onCheckedChange: (ids: Id[]) => void
  /** The clock, in milliseconds. */
  now: number
  policy?: ReviewPolicy
  /** Shown when the list is empty. */
  empty?: string
  className?: string
}

/**
 * The questions of one view as a list to work through: a tick box, the question, its level, topic, writer, source trust and how
 * long it has waited (amber when too long). Click to open one; J and K move, X ticks. Select-all sits in the header.
 */
export function ReviewQueue({ questions, keys, selectedId, onSelect, checked, onCheckedChange, now, policy = DEFAULT_POLICY, empty = 'Nothing here.', className }: ReviewQueueProps) {
  const all = useRef<HTMLInputElement>(null)
  const state = checked.length === 0 ? 'none' : checked.length === questions.length ? 'all' : 'some'
  useEffect(() => {
    if (all.current) all.current.indeterminate = state === 'some'
  }, [state])

  const latest = useRef({ questions, selectedId, checked, onSelect, onCheckedChange })
  latest.current = { questions, selectedId, checked, onSelect, onCheckedChange }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable], [role=dialog]') || e.ctrlKey || e.metaKey || e.altKey) return
      const { questions: list, selectedId: id, checked: ticked, onSelect: select, onCheckedChange: tick } = latest.current
      const i = list.findIndex((q) => q.id === id)
      const k = e.key.toLowerCase()
      if (k === 'j' || k === 'k') {
        const next = list[k === 'j' ? Math.min(list.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1)]
        if (next) {
          e.preventDefault()
          select(next)
          document.getElementById(`rv-row-${next.id}`)?.scrollIntoView({ block: 'nearest' })
        }
      } else if (k === 'x' && id) {
        e.preventDefault()
        tick(ticked.includes(id) ? ticked.filter((x) => x !== id) : [...ticked, id])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={cn('rv-queue', className)}>
      <div className="rv-queue-head">
        <label>
          <input ref={all} type="checkbox" className="rv-check" checked={state === 'all'} disabled={questions.length === 0} aria-label="Select all questions in this view" onChange={() => onCheckedChange(state === 'all' ? [] : questions.map((q) => q.id))} />
          <span>{questions.length.toLocaleString('en')} question{questions.length === 1 ? '' : 's'}</span>
        </label>
        <span className="rv-keys">
          <kbd>J</kbd> <kbd>K</kbd> move <kbd>X</kbd> tick
        </span>
      </div>
      {questions.length === 0 ? (
        <p className="rv-empty">{empty}</p>
      ) : (
        <ul>
          {questions.map((q) => {
            const stage = stageOf(q)
            const review = reviewOf(q)
            const flags = reviewFlags(q, keys[q.id])
            const stale = isStale(q, now, policy)
            const on = selectedId === q.id
            return (
              <li key={q.id} className={cn('rv-row', on && 'is-open', checked.includes(q.id) && 'is-checked')}>
                <input type="checkbox" className="rv-check" checked={checked.includes(q.id)} aria-label={`Select: ${q.prompt}`} onChange={(e) => onCheckedChange(e.target.checked ? [...checked, q.id] : checked.filter((x) => x !== q.id))} />
                <button id={`rv-row-${q.id}`} type="button" className="rv-open" aria-current={on ? 'true' : undefined} onClick={() => onSelect(q)}>
                  <strong>{q.prompt || 'Untitled question'}</strong>
                  <span className="rv-meta">
                    {typeInfo(q.type).label}
                    <DifficultyMeter value={q.difficulty} size="sm" showName={false} />
                    {q.tags[0] && <span>{q.tags[0]}</span>}
                    <span>by {review.author}</span>
                    <SourceBadge source={q.source} />
                    {flags.length > 0 && stage !== 'approved' && stage !== 'trashed' && (
                      <span className="rv-flags" title={flags.join(' ')}>
                        {flags.length} to check
                      </span>
                    )}
                  </span>
                </button>
                <span className="rv-state">
                  <Tag tone={TONE[stage]}>{stageName(stage)}</Tag>
                  {isWaiting(q) && <small className={cn(stale && 'is-stale')}>{waitingDays(q, now) === 0 ? 'today' : `${waitingDays(q, now)} d`}</small>}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
