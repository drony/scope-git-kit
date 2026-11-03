import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, RotateCcw, Save } from 'lucide-react'
import { Field, Input, Textarea } from '@/kit/components/forms/Field'
import { Button } from '@/kit/components/ui/Button'
import { Tag } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { AnswerKey, Id, Question, Score, Submission } from '../data/types'
import { describeKey, typeInfo } from '../lib/questionTypes'
import { isPending } from '../lib/ranking'
import { scoreAnswer } from '../lib/scoring'
import { AnswerInput, type MediaLookup } from './Answers'
import { RubricScorer } from './RubricScorer'

interface SubmissionReviewProps {
  /** The questions of the submission, in order. */
  questions: Question[]
  submission: Submission
  answerKeys: Record<Id, AnswerKey>
  participantName?: string
  media?: MediaLookup
  /** Called with the score the reviewer saved. The review moves on to the next answer that still needs a person. */
  onScore: (questionId: Id, score: Score) => void
  /** Opens this question first, instead of the first answer that is waiting for a person. */
  initialQuestionId?: Id
  /** Written into every score saved here. */
  reviewer?: string
  className?: string
}

const round2 = (n: number) => Math.round(n * 100) / 100

type Mark = 'pending' | 'auto' | 'reviewed'
const markOf = (s: Score | undefined): Mark => (!s ? 'auto' : isPending(s) ? 'pending' : s.auto ? 'auto' : 'reviewed')

/**
 * Look at what a participant answered next to the answer key, see the points the key gave and why, and change them: type
 * another number, or score a written answer or a photo with its rubric. Every saved score carries the reviewer's name and
 * note. Ctrl+Enter (or ⌘+Enter) saves from anywhere in the scoring box.
 */
export function SubmissionReview({ questions, submission, answerKeys, participantName, media, onScore, initialQuestionId, reviewer = 'Reviewer', className }: SubmissionReviewProps) {
  const firstPending = Math.max(0, questions.findIndex((q) => isPending(submission.scores[q.id] ?? { points: 0, max: 0, auto: true })))
  const startAt = (initialQuestionId ? questions.findIndex((x) => x.id === initialQuestionId) : -1) >= 0 ? questions.findIndex((x) => x.id === initialQuestionId) : firstPending
  const [index, setIndex] = useState(startAt)
  const q = questions[Math.min(index, questions.length - 1)]
  const key = q ? (answerKeys[q.id] ?? null) : null
  const given = q ? submission.answers.find((a) => a.questionId === q.id) : undefined
  const saved = q ? submission.scores[q.id] : undefined

  // The form starts from the saved score every time another answer (or another person) is opened.
  const [points, setPoints] = useState('0')
  const [note, setNote] = useState('')
  const [breakdown, setBreakdown] = useState<Record<Id, number>>({})
  const reset = () => {
    setPoints(String(saved?.points ?? 0))
    setNote(saved && !saved.auto && !isPending(saved) ? (saved.note ?? '') : '')
    setBreakdown(saved?.breakdown ?? {})
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reset, [submission.id, q?.id, saved?.points, saved?.reviewer])
  useEffect(() => setIndex(startAt), [submission.id, initialQuestionId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!q) return <p className="cs-review-empty">This submission has no scored questions.</p>

  const rubric = key?.type === 'manual' ? key.rubric : null
  const total = rubric ? rubric.reduce((n, r) => n + (breakdown[r.id] ?? 0), 0) : Number(points)
  const valid = Number.isFinite(total) && total >= 0 && total <= q.points
  const auto = scoreAnswer(q, key, given?.value)
  const dirty = saved ? total !== saved.points || (saved.auto ? true : note !== (saved.note ?? '')) : true
  const all = questions.reduce((n, x) => n + (submission.scores[x.id]?.points ?? 0), 0)
  const nextPending = questions.findIndex((x, i) => i !== index && isPending(submission.scores[x.id] ?? { points: 0, max: 0, auto: true }))

  const save = () => {
    if (!valid) return
    onScore(q.id, { points: round2(total), max: q.points, auto: false, note: note.trim() || undefined, reviewer, ...(rubric ? { breakdown } : {}) })
    if (nextPending >= 0) setIndex(nextPending)
  }
  const useAuto = () => {
    onScore(q.id, { points: auto.points, max: auto.max, auto: true, note: auto.reason })
  }

  return (
    <section className={cn('cs-review', className)} aria-label={participantName ? `Answers of ${participantName}` : 'Answers'}>
      <header className="cs-review-head">
        <div>
          <h3>{participantName ?? 'Submission'}</h3>
          <p>
            {round2(all)} points so far · {questions.filter((x) => isPending(submission.scores[x.id] ?? { points: 0, max: 0, auto: true })).length} waiting for you
          </p>
        </div>
        <nav className="cs-review-map" aria-label="Questions">
          {questions.map((x, i) => (
            <button key={x.id} type="button" className={cn('cs-runner-dot', `is-m-${markOf(submission.scores[x.id])}`, i === index && 'is-current')} aria-current={i === index ? 'step' : undefined} aria-label={`Question ${i + 1}, ${markOf(submission.scores[x.id])}`} onClick={() => setIndex(i)}>
              {i + 1}
            </button>
          ))}
        </nav>
      </header>

      <div className="cs-review-body">
        <div className="cs-review-answer">
          <p className="cs-review-q">
            <Tag>{typeInfo(q.type).label}</Tag> {q.prompt}
          </p>
          <h4>What they answered</h4>
          {given ? <AnswerInput question={q} value={given.value} onChange={() => undefined} disabled reveal={key?.type === 'manual' ? null : key} media={media} /> : <p className="cs-review-none">No answer was given.</p>}
          <h4>Answer key</h4>
          <p className="cs-review-key">{describeKey(q, key)}</p>
        </div>

        <div
          className="cs-review-score"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              save()
            }
          }}
        >
          <h4>Score</h4>
          {saved && (
            <p className="cs-review-reason" role="status">
              <strong>
                {saved.points} / {saved.max}
              </strong>{' '}
              {isPending(saved) ? 'Waiting for you. ' : saved.auto ? 'By the answer key. ' : `Scored by ${saved.reviewer ?? 'a reviewer'}. `}
              {saved.auto || isPending(saved) ? saved.note : ''}
            </p>
          )}
          {rubric ? (
            <RubricScorer rubric={rubric} value={breakdown} onChange={setBreakdown} />
          ) : (
            <Field label={`Points, out of ${q.points}`} error={valid ? undefined : `Enter a number from 0 to ${q.points}.`}>
              <Input type="number" min={0} max={q.points} step="0.5" value={points} onChange={(e) => setPoints(e.target.value)} />
            </Field>
          )}
          <Field label="Note" optional hint="The participant sees it with the score.">
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="cs-review-actions">
            {saved && !saved.auto && key?.type !== 'manual' && (
              <Button variant="ghost" size="sm" onClick={useAuto}>
                <RotateCcw aria-hidden="true" /> Use the key's score ({auto.points})
              </Button>
            )}
            <Button disabled={!valid || !dirty} onClick={save}>
              <Save aria-hidden="true" /> Save score
            </Button>
          </div>
        </div>
      </div>

      <footer className="cs-review-foot">
        <Button variant="plain" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          <ArrowLeft aria-hidden="true" /> Previous
        </Button>
        <Button variant="plain" disabled={index >= questions.length - 1} onClick={() => setIndex(index + 1)}>
          Next <ArrowRight aria-hidden="true" />
        </Button>
      </footer>
    </section>
  )
}
