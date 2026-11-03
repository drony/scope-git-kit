import { useEffect, useRef } from 'react'
import { Check, Clock, ExternalLink, TriangleAlert } from 'lucide-react'
import { Button } from '@/kit/components/ui/Button'
import { Alert } from '@/kit/components/ui/Feedback'
import { Tag, type Tone } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { AnswerKey, Question, ReviewAction, ReviewStage } from '../data/types'
import { describeKey, optionsOf, typeInfo } from '../lib/questionTypes'
import { DEFAULT_POLICY, reviewActions, reviewFlags, reviewOf, stageName, stageOf, waitingDays, type ReviewPolicy } from '../lib/review'
import { DifficultyMeter } from './DifficultyMeter'
import { ReviewHistory } from './ReviewHistory'
import { SourceBadge } from './SourceBadge'

const TONE: Record<ReviewStage, Tone> = { draft: 'neutral', pending: 'warning', preapproved: 'accent', approved: 'success', returned: 'error', trashed: 'neutral' }

interface ReviewPanelProps {
  question: Question
  /** The answer key: the reviewer sees what is right. */
  answerKey?: AnswerKey | null
  /** Who is acting. */
  actor: string
  policy?: ReviewPolicy
  /** The clock, in milliseconds. */
  now: number
  /** Called with the action the person chose. A return or withdrawal still needs a reason: ask for it in the handler. */
  onAction: (action: ReviewAction) => void
  busy?: boolean
  className?: string
}

/**
 * One question for a reviewer: where it is in the review and for how long, the question with the right answer marked, the
 * things to check, the reason it was returned (if it was), the buttons for what this person can do (with the reason shown when
 * they cannot), and the history. A takes the main step and R returns it, while nobody is typing.
 */
export function ReviewPanel({ question: q, answerKey, actor, policy = DEFAULT_POLICY, now, onAction, busy, className }: ReviewPanelProps) {
  const stage = stageOf(q)
  const review = reviewOf(q)
  const actions = reviewActions(q, answerKey, { actor, policy })
  const primary = actions.find((a) => a.primary)
  const flags = reviewFlags(q, answerKey)
  const correct = answerKey?.type === 'choice' ? answerKey.correct : []
  const options = optionsOf(q)
  const last = [...review.history].reverse().find((e) => e.action === 'return' || e.action === 'withdraw')

  const latest = useRef({ primary, actions, onAction, busy })
  latest.current = { primary, actions, onAction, busy }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable], [role=dialog]') || e.ctrlKey || e.metaKey || e.altKey) return
      const { primary: p, actions: list, onAction: act, busy: b } = latest.current
      if (b) return
      const k = e.key.toLowerCase()
      if (k === 'a' && p?.enabled) act(p.action)
      else if (k === 'r' && list.find((x) => x.action === 'return')?.enabled) act('return')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const disabled = actions.filter((a) => !a.enabled && a.why)
  return (
    <article className={cn('rv-panel', className)} aria-label="Question under review">
      <header>
        <Tag tone={TONE[stage]}>{stageName(stage)}</Tag>
        <span className="rv-who">
          {waitingDays(q, now) === 0 ? 'Today' : `${waitingDays(q, now)} d`} · by {review.author}
          {review.preapprovedBy && ` · pre-approved by ${review.preapprovedBy}`}
        </span>
      </header>

      {stage === 'returned' && review.note && (
        <Alert tone="warning" title={last ? `${last.action === 'withdraw' ? 'Withdrawn' : 'Returned'} by ${last.actor}` : 'Returned'}>
          {review.note}
        </Alert>
      )}

      <h2 className="rv-prompt">{q.prompt || 'Untitled question'}</h2>
      {options.length > 0 && (
        <ul className="rv-options">
          {options.map((o) => (
            <li key={o.id} className={cn(correct.includes(o.id) && 'is-right')}>
              {correct.includes(o.id) ? <Check aria-label="Right answer" /> : <i aria-hidden="true" />}
              {o.label || <em>Empty option</em>}
            </li>
          ))}
        </ul>
      )}
      {(options.length === 0 || answerKey?.type !== 'choice') && <p className="rv-key">{describeKey(q, answerKey)}</p>}
      {q.explanation && <p className="rv-explain">{q.explanation}</p>}

      <dl className="rv-facts">
        <div>
          <dt>Type</dt>
          <dd>{typeInfo(q.type).label}</dd>
        </div>
        <div>
          <dt>Level</dt>
          <dd>
            <DifficultyMeter value={q.difficulty} size="sm" />
          </dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>
            <Clock aria-hidden="true" /> {q.timeLimitSec ? `${q.timeLimitSec} s` : 'none'} · {q.points} points
          </dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>
            <SourceBadge source={q.source} />
            {q.source?.url && (
              <a href={q.source.url} target="_blank" rel="noreferrer">
                {q.source.title} <ExternalLink aria-hidden="true" />
              </a>
            )}
            {q.source && !q.source.url && <span>{q.source.title}</span>}
          </dd>
        </div>
      </dl>

      {flags.length > 0 && stage !== 'approved' && stage !== 'trashed' && (
        <section className="rv-flags-list" aria-label="To check">
          <h3>To check</h3>
          <ul>
            {flags.map((f) => (
              <li key={f}>
                <TriangleAlert aria-hidden="true" /> {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="rv-actions">
        {actions.map((a) => (
          <Button key={a.action} variant={a.primary ? 'primary' : 'plain'} size="sm" disabled={!a.enabled || busy} onClick={() => onAction(a.action)}>
            {a.label} {a.primary && <kbd>A</kbd>}
            {a.action === 'return' && <kbd>R</kbd>}
          </Button>
        ))}
      </div>
      {disabled.length > 0 && (
        <ul className="rv-why">
          {disabled.map((a) => (
            <li key={a.action}>
              <b>{a.label}:</b> {a.why}
            </li>
          ))}
        </ul>
      )}

      <section aria-label="History">
        <h3>History</h3>
        <ReviewHistory events={review.history} now={new Date(now)} />
      </section>
    </article>
  )
}
