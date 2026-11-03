import { Sparkles } from 'lucide-react'
import { Input } from '@/kit/components/forms/Field'
import { cn } from '@/kit/lib/cn'
import type { Question } from '../data/types'
import { READING_SEC, suggestTimeSec, TIME_PRESETS } from '../lib/episode'

interface TimeDialProps {
  /** Seconds to answer. */
  value: number
  onChange: (seconds: number) => void
  /** The question, to suggest a time that fits its type and difficulty. */
  question?: Pick<Question, 'type' | 'difficulty'>
  className?: string
}

/**
 * How long people get to answer: a row of usual times, a box for any other, and a suggestion for this kind of question
 * (true or false needs about 15 seconds, a hard multiple choice more). The few seconds to read the question come on top and
 * are shown, so the host knows the real length.
 */
export function TimeDial({ value, onChange, question, className }: TimeDialProps) {
  const suggested = question ? suggestTimeSec(question) : undefined
  return (
    <div className={cn('td', className)}>
      <div className="td-row" role="radiogroup" aria-label="Time to answer">
        {TIME_PRESETS.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={value === s} className={cn('td-chip', value === s && 'is-on', suggested === s && 'is-suggested')} onClick={() => onChange(s)}>
            {s}
            <small>s</small>
          </button>
        ))}
        <span className="td-custom">
          <Input type="number" min={5} max={600} value={value} aria-label="Seconds to answer" affix="s" onChange={(e) => onChange(Math.max(5, Math.min(600, Number(e.target.value) || 5)))} />
        </span>
      </div>
      <p className="td-note">
        {READING_SEC} s to read, then {value} s to answer: <strong>{READING_SEC + value} s</strong> on air.
        {suggested !== undefined && value !== suggested && (
          <button type="button" className="td-suggest" onClick={() => onChange(suggested)}>
            <Sparkles aria-hidden="true" /> Suggested: {suggested} s
          </button>
        )}
      </p>
    </div>
  )
}
