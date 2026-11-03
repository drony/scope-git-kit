import { useEffect, useMemo, useState } from 'react'
import { Segmented } from '@/kit/components/nav/Segmented'
import { PreviewFrame, type PreviewDevice } from '@/kit/components/ui/PreviewFrame'
import type { AnswerKey, AnswerValue, Question } from '../data/types'
import { sampleAnswer } from '../lib/sampleAnswers'
import type { MediaLookup } from './Answers'
import { QuestionView, type QuestionViewState } from './QuestionView'

const STATES: Array<{ value: QuestionViewState; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'answered', label: 'Answered' },
  { value: 'correct', label: 'Right' },
  { value: 'wrong', label: 'Wrong' },
  { value: 'timeout', label: 'Time up' },
  { value: 'locked', label: 'Locked' },
]

interface QuestionPreviewProps {
  question: Question
  answerKey?: AnswerKey | null
  media?: MediaLookup
  /** Which state to show first. */
  initialState?: QuestionViewState
  device?: PreviewDevice
  className?: string
}

/**
 * The question exactly as a participant sees it, on a phone, tablet or desktop frame, with a state scrubber: step through
 * open, answered, right, wrong, time up and locked without answering anything. The answers it shows come from the key.
 */
export function QuestionPreview({ question, answerKey, media, initialState = 'open', device: initialDevice = 'phone', className }: QuestionPreviewProps) {
  const [device, setDevice] = useState<PreviewDevice>(initialDevice)
  const [state, setState] = useState<QuestionViewState>(initialState)
  const [typed, setTyped] = useState<AnswerValue | null>(null)

  // A different question starts again from nothing.
  useEffect(() => setTyped(null), [question.id, question.type])

  const shown = useMemo<AnswerValue | null>(() => {
    if (state === 'open' || state === 'timeout') return typed
    if (state === 'wrong') return sampleAnswer(question, answerKey, false)
    if (state === 'answered' && typed) return typed
    return sampleAnswer(question, answerKey, true)
  }, [state, typed, question, answerKey])

  const earned = state === 'correct' ? question.points : state === 'wrong' || state === 'timeout' ? 0 : undefined

  return (
    <div className={className}>
      <div className="cs-preview-states">
        <Segmented<QuestionViewState> ariaLabel="State of the question" value={state} onChange={setState} options={STATES} />
      </div>
      <PreviewFrame device={device} onDeviceChange={setDevice} label="Participant preview" height={720}>
        <div className="cs-screen">
          <div className="cs-screen-bar">
            <strong>Question 1 of 10</strong>
          </div>
          <QuestionView
            question={question}
            value={shown}
            onChange={(v) => {
              setTyped(v)
              if (state === 'open') setState('answered')
            }}
            state={state}
            answerKey={answerKey}
            earned={earned}
            media={media}
            secondsLeft={question.timeLimitSec}
          />
        </div>
      </PreviewFrame>
    </div>
  )
}
