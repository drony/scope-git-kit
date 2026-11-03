import { useState } from 'react'
import { ArrowLeft, ArrowRight, CircleCheck } from 'lucide-react'
import { Button } from '@/kit/components/ui/Button'
import { Meter } from '@/kit/components/ui/Feedback'
import { cn } from '@/kit/lib/cn'
import type { Survey, SurveyAnswer } from '../data/types'
import { SurveyQuestionInput } from './SurveyInputs'

interface SurveyRunnerProps {
  survey: Survey
  /** Called once with every answer, when the person finishes. Skipped questions are left out. */
  onSubmit: (answers: Record<string, SurveyAnswer>) => void | Promise<void>
  /** Shown on the thank-you screen, for example a link back. */
  thanks?: React.ReactNode
  className?: string
}

/**
 * A survey one question at a time, with a bar for progress and a "Skip" on every optional question. Short and calm: nothing
 * is required unless the survey says so, and the person can go back. After the last question comes a thank-you screen.
 */
export function SurveyRunner({ survey, onSubmit, thanks, className }: SurveyRunnerProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer>>({})
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const q = survey.questions[step]
  const last = step === survey.questions.length - 1

  if (done) {
    return (
      <div className={cn('svr is-done', className)} role="status">
        <CircleCheck aria-hidden="true" />
        <h3>Thank you</h3>
        <p>Your answers help us make the next show better.{survey.anonymous ? ' They are anonymous.' : ''}</p>
        {thanks}
      </div>
    )
  }
  if (!q) return null
  const answered = answers[q.id] !== undefined && answers[q.id] !== ''
  const finish = async () => {
    setBusy(true)
    try {
      await onSubmit(answers)
      setDone(true)
    } finally {
      setBusy(false)
    }
  }
  const next = () => (last ? void finish() : setStep(step + 1))

  return (
    <section className={cn('svr', className)} aria-label={survey.title}>
      <header>
        <span className="svr-count">
          Question {step + 1} of {survey.questions.length}
        </span>
        <Meter label="Progress" value={step + 1} max={survey.questions.length} />
      </header>
      <h3 className="svr-q">{q.prompt}</h3>
      <SurveyQuestionInput question={q} value={answers[q.id]} onChange={(v) => setAnswers((a) => (v === undefined ? Object.fromEntries(Object.entries(a).filter(([k]) => k !== q.id)) : { ...a, [q.id]: v }))} />
      <footer>
        <Button variant="plain" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ArrowLeft aria-hidden="true" /> Back
        </Button>
        <span className="svr-right">
          {q.optional && !answered && (
            <Button variant="ghost" onClick={next} loading={busy && last}>
              Skip
            </Button>
          )}
          <Button disabled={(!q.optional && !answered) || busy} loading={busy && last} onClick={next}>
            {last ? 'Send' : 'Next'} <ArrowRight aria-hidden="true" />
          </Button>
        </span>
      </footer>
    </section>
  )
}
