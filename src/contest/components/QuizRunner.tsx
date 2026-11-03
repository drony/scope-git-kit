import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CircleCheck, ClipboardCheck } from 'lucide-react'
import { Modal } from '@/kit/components/overlays/Modal'
import { Alert, Meter } from '@/kit/components/ui/Feedback'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { Answer, AnswerKey, AnswerValue, Id, Question, Score, SubmissionStatus } from '../data/types'
import { isAnswered } from '../lib/questionTypes'
import type { MediaLookup } from './Answers'
import type { UploadHandler } from './MediaUploader'
import { QuestionView, type QuestionViewState } from './QuestionView'

interface QuizRunnerProps {
  /** The questions in play order. */
  questions: Question[]
  /**
   * The answers saved so far. They are read once, when the runner mounts: the runner keeps its own copy from then on and
   * reports every change through `onAnswer`. Give it a new `key` to start over for someone else.
   */
  answers?: Answer[]
  /** Called a moment after the person stops changing an answer, and when they leave the question. */
  onAnswer: (answer: Answer) => void
  /** Called when the person confirms the submit dialog. */
  onSubmit: () => void
  status?: SubmissionStatus
  /** Points per question, shown once the quiz is submitted. */
  scores?: Record<Id, Score>
  /** Answer keys. Pass them only after submitting: they reveal the right answers. */
  answerKeys?: Record<Id, AnswerKey>
  media?: MediaLookup
  upload?: UploadHandler
  title?: string
  /** How long to wait after the last change before `onAnswer` (ms). */
  saveDelay?: number
  className?: string
}

type Draft = { value: AnswerValue | null; spentSec: number }

/** The state a finished question is shown in, from its score. */
function finishedState(score: Score | undefined): QuestionViewState {
  if (!score || !score.auto) return 'locked'
  return score.points >= score.max ? 'correct' : 'wrong'
}

/**
 * The participant's whole quiz: one question at a time, a map of all questions, a timer for questions with a time limit, a
 * save indicator, an overview before submitting, and the result afterwards. It holds no data of its own beyond what the
 * person is typing: answers go out through `onAnswer`, the submit through `onSubmit`.
 */
export function QuizRunner({ questions, answers = [], onAnswer, onSubmit, status = 'in-progress', scores = {}, answerKeys = {}, media, upload, title = 'Quiz', saveDelay = 700, className }: QuizRunnerProps) {
  const [drafts, setDrafts] = useState<Record<Id, Draft>>(() => Object.fromEntries(answers.map((a) => [a.questionId, { value: a.value, spentSec: a.spentSec ?? 0 }])))
  const [step, setStep] = useState(0) // 0..n-1 a question, n the overview
  const [expired, setExpired] = useState<Set<Id>>(new Set())
  const [confirm, setConfirm] = useState(false)
  const [pending, setPending] = useState<Set<Id>>(new Set())
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts
  const timers = useRef(new Map<Id, number>())
  const latest = useRef(onAnswer)
  latest.current = onAnswer

  const finished = status !== 'in-progress'
  const n = questions.length
  const overview = step >= n
  const q = overview ? undefined : questions[step]
  const answeredCount = questions.filter((x) => isAnswered(drafts[x.id]?.value)).length

  const flush = useCallback((id: Id) => {
    const t = timers.current.get(id)
    if (t !== undefined) window.clearTimeout(t)
    timers.current.delete(id)
    const d = draftsRef.current[id]
    if (!d?.value) return
    latest.current({ questionId: id, value: d.value, answeredAt: new Date().toISOString(), spentSec: d.spentSec })
    setPending((p) => {
      const next = new Set(p)
      next.delete(id)
      return next
    })
  }, [])

  const change = (id: Id, value: AnswerValue) => {
    setDrafts((d) => ({ ...d, [id]: { value, spentSec: d[id]?.spentSec ?? 0 } }))
    setPending((p) => new Set(p).add(id))
    const old = timers.current.get(id)
    if (old !== undefined) window.clearTimeout(old)
    timers.current.set(id, window.setTimeout(() => flush(id), saveDelay))
  }

  // Leaving the screen saves what is waiting.
  useEffect(() => {
    const map = timers.current
    return () => {
      for (const id of [...map.keys()]) flush(id)
    }
  }, [flush])

  // Time spent and the time limit of the question on screen.
  const limit = q?.timeLimitSec
  const spent = q ? (drafts[q.id]?.spentSec ?? 0) : 0
  const timedOut = q ? expired.has(q.id) || (limit !== undefined && spent >= limit && !finished) : false
  const qid = q?.id
  useEffect(() => {
    if (!qid || finished) return
    const id = window.setInterval(() => {
      setDrafts((d) => {
        const cur = d[qid]
        const secs = (cur?.spentSec ?? 0) + 1
        return { ...d, [qid]: { value: cur?.value ?? null, spentSec: secs } }
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [qid, finished, timedOut])

  useEffect(() => {
    if (qid && limit !== undefined && spent >= limit && !expired.has(qid) && !finished) {
      setExpired((e) => new Set(e).add(qid))
      flush(qid)
    }
  }, [qid, limit, spent, expired, finished, flush])

  const go = (to: number) => {
    if (q) flush(q.id)
    setStep(Math.max(0, Math.min(n, to)))
  }

  const total = useMemo(() => questions.reduce((s, x) => s + x.points, 0), [questions])
  const mine = questions.flatMap((x) => (scores[x.id] ? [scores[x.id]] : []))
  const earned = mine.reduce((s, x) => s + x.points, 0)

  const viewState = (x: Question): QuestionViewState => {
    if (finished) return finishedState(scores[x.id])
    if (expired.has(x.id) || (x.timeLimitSec !== undefined && (drafts[x.id]?.spentSec ?? 0) >= x.timeLimitSec)) return 'timeout'
    return isAnswered(drafts[x.id]?.value) ? 'answered' : 'open'
  }

  return (
    <section className={cn('cs-runner', className)} aria-label={title}>
      <header className="cs-runner-head">
        <div>
          <h2>{title}</h2>
          <p>{overview ? (finished ? 'Your result' : 'Check your answers') : `Question ${step + 1} of ${n}`}</p>
        </div>
        {!finished && (
          <span className={cn('cs-save', pending.size > 0 && 'is-saving')} role="status">
            {pending.size > 0 ? 'Saving…' : 'All answers saved'}
          </span>
        )}
      </header>

      <Meter label="Questions answered" value={finished ? n : answeredCount} max={Math.max(1, n)} tone={finished ? 'success' : undefined} />

      <nav className="cs-runner-map" aria-label="Questions">
        {questions.map((x, i) => {
          const s = viewState(x)
          return (
            <button key={x.id} type="button" className={cn('cs-runner-dot', `is-${s}`, i === step && 'is-current')} aria-current={i === step ? 'step' : undefined} aria-label={`Question ${i + 1}, ${s === 'open' ? 'not answered' : s}`} onClick={() => go(i)}>
              {i + 1}
            </button>
          )
        })}
        <button type="button" className={cn('cs-runner-dot is-overview', overview && 'is-current')} aria-current={overview ? 'step' : undefined} aria-label={finished ? 'Result' : 'Overview'} onClick={() => go(n)}>
          <ClipboardCheck aria-hidden="true" />
        </button>
      </nav>

      {q && (
        <>
          <QuestionView
            key={q.id}
            question={q}
            value={drafts[q.id]?.value ?? null}
            onChange={(v) => change(q.id, v)}
            state={viewState(q)}
            answerKey={finished ? answerKeys[q.id] : undefined}
            earned={finished ? scores[q.id]?.points : undefined}
            media={media}
            upload={upload}
            secondsLeft={q.timeLimitSec !== undefined && !finished ? Math.max(0, q.timeLimitSec - spent) : undefined}
          />
          {finished && scores[q.id]?.note && <p className="cs-runner-note">{scores[q.id].auto ? 'How it was scored' : 'Reviewer'}: {scores[q.id].note}</p>}
        </>
      )}

      {overview && (
        <div className="cs-runner-overview">
          {finished ? (
            <div className="cs-runner-result">
              <strong>
                {earned} <span>/ {total} points</span>
              </strong>
              <Meter label="Score" value={earned} max={Math.max(1, total)} tone="success" />
              {mine.some((s) => !s.auto) && <p className="field-hint">Some answers wait for a reviewer. Your score can still change.</p>}
            </div>
          ) : answeredCount < n ? (
            <Alert tone="warning" title={`${n - answeredCount} question${n - answeredCount === 1 ? ' is' : 's are'} not answered`}>
              You can still go back. Unanswered questions score 0.
            </Alert>
          ) : (
            <Alert tone="success" title="Every question has an answer">
              Read them once more, then submit.
            </Alert>
          )}
          <ol className="cs-runner-list">
            {questions.map((x, i) => {
              const ok = isAnswered(drafts[x.id]?.value)
              const sc = scores[x.id]
              return (
                <li key={x.id}>
                  <button type="button" onClick={() => go(i)}>
                    <span className="cs-order-n">{i + 1}</span>
                    <span className="cs-runner-list-prompt">{x.prompt}</span>
                    <span className={cn('cs-runner-list-state', ok ? 'is-yes' : 'is-no')}>{finished && sc ? `${sc.points} / ${sc.max}` : ok ? 'Answered' : 'Empty'}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      <footer className="cs-runner-foot">
        <Button variant="plain" disabled={step === 0} onClick={() => go(step - 1)}>
          <ArrowLeft aria-hidden="true" /> Back
        </Button>
        {overview ? (
          !finished && (
            <Button onClick={() => setConfirm(true)}>
              <CircleCheck aria-hidden="true" /> Submit answers
            </Button>
          )
        ) : (
          <Button onClick={() => go(step + 1)}>
            {step === n - 1 ? (finished ? 'Result' : 'Review answers') : 'Next'} <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </footer>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Submit your answers?"
        description={`You answered ${answeredCount} of ${n} questions. After you submit, you cannot change them.`}
        actions={
          <>
            <Button variant="plain" onClick={() => setConfirm(false)}>
              Keep working
            </Button>
            <Button
              onClick={() => {
                for (const id of [...timers.current.keys()]) flush(id)
                setConfirm(false)
                onSubmit()
              }}
            >
              Submit
            </Button>
          </>
        }
      />
    </section>
  )
}
