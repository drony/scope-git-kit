import { CircleAlert, CircleCheck, Clock, Lightbulb, Lock } from 'lucide-react'
import { Tag } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { AnswerKey, AnswerValue, Question } from '../data/types'
import { formatDuration } from '../lib/mediaRules'
import { typeInfo } from '../lib/questionTypes'
import { AnswerInput, type MediaLookup } from './Answers'
import type { UploadHandler } from './MediaUploader'

/** How a question looks to the participant. `open` and `answered` can be edited; the others are locked. */
export type QuestionViewState = 'open' | 'answered' | 'correct' | 'wrong' | 'timeout' | 'locked'

export interface QuestionViewProps {
  question: Question
  value: AnswerValue | null
  onChange: (value: AnswerValue) => void
  state?: QuestionViewState
  /** Needed to show what was right once the question is locked. */
  answerKey?: AnswerKey | null
  /** Points earned, shown in the banner of a finished question. */
  earned?: number
  media?: MediaLookup
  upload?: UploadHandler
  /** Seconds left, shown as a timer. */
  secondsLeft?: number
  className?: string
}

const BANNER: Record<'correct' | 'wrong' | 'timeout' | 'locked', { tone: string; text: string }> = {
  correct: { tone: 'right', text: 'Correct' },
  wrong: { tone: 'wrong', text: 'Not quite' },
  timeout: { tone: 'wrong', text: 'Time is up' },
  locked: { tone: 'locked', text: 'Answers are locked' },
}

/** One question as the participant sees it: prompt, pictures and sounds, hint, the answer input, then the result. */
export function QuestionView({ question: q, value, onChange, state = 'open', answerKey, earned, media, upload, secondsLeft, className }: QuestionViewProps) {
  const info = typeInfo(q.type)
  const done = state === 'correct' || state === 'wrong' || state === 'timeout' || state === 'locked'
  const reveal = state === 'correct' || state === 'wrong' || state === 'timeout' ? answerKey : null
  const attachments = q.mediaIds.map((id) => media?.(id)).filter((a): a is NonNullable<typeof a> => Boolean(a))

  return (
    <article className={cn('cs-question', className)} aria-label={q.prompt || 'Question'}>
      <header className="cs-question-head">
        <Tag>
          <info.icon aria-hidden="true" /> {info.label}
        </Tag>
        <span className="cs-question-meta">
          {secondsLeft !== undefined && (
            <span className={cn('cs-timer', secondsLeft <= 10 && 'is-low')}>
              <Clock aria-hidden="true" /> {formatDuration(secondsLeft)}
            </span>
          )}
          <span>
            {q.points} point{q.points === 1 ? '' : 's'}
          </span>
        </span>
      </header>

      <p className="cs-prompt">{q.prompt || <em>Write the question to see it here.</em>}</p>

      {attachments.length > 0 && (
        <div className="cs-attachments">
          {attachments.map((a) =>
            a.kind === 'image' ? <img key={a.id} src={a.url} alt={a.alt ?? a.name} /> : a.kind === 'audio' ? <audio key={a.id} src={a.url} controls aria-label={a.name} /> : a.kind === 'video' ? <video key={a.id} src={a.url} controls aria-label={a.name} /> : null,
          )}
        </div>
      )}

      {q.hint && !done && (
        <details className="cs-hint">
          <summary>
            <Lightbulb aria-hidden="true" /> Need a hint?
          </summary>
          {q.hint}
        </details>
      )}

      <AnswerInput question={q} value={value} onChange={onChange} disabled={done} reveal={reveal} media={media} upload={upload} />

      {done && (
        <div className={cn('cs-banner', `is-${BANNER[state].tone}`)} role="status">
          {state === 'correct' ? <CircleCheck aria-hidden="true" /> : state === 'locked' ? <Lock aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
          <div>
            <strong>
              {BANNER[state].text}
              {earned !== undefined && ` · ${earned} / ${q.points} points`}
            </strong>
            {q.explanation && state !== 'locked' && <p>{q.explanation}</p>}
          </div>
        </div>
      )}
    </article>
  )
}
