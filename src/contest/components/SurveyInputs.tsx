import { useId } from 'react'
import { Star } from 'lucide-react'
import { Input, Textarea } from '@/kit/components/forms/Field'
import { cn } from '@/kit/lib/cn'
import type { SurveyAnswer, SurveyQuestion } from '../data/types'

interface ScaleProps {
  value?: number
  onChange: (value: number) => void
  disabled?: boolean
  className?: string
}

/** The band an NPS score belongs to: 0–6 critics, 7–8 passives, 9–10 promoters. */
export const npsBand = (n: number): 'critic' | 'passive' | 'promoter' => (n >= 9 ? 'promoter' : n >= 7 ? 'passive' : 'critic')

/**
 * The standard 0 to 10 scale, in three coloured bands: critics (0–6), passives (7–8) and promoters (9–10). The eleven
 * choices are real radio buttons: arrow keys move between them, and the ends carry the words "Not at all likely" and "Extremely likely".
 */
export function NpsScale({ value, onChange, disabled, className }: ScaleProps) {
  const name = useId()
  return (
    <div className={cn('nps', className)}>
      <div className="nps-row" role="radiogroup" aria-label="0 is not at all likely, 10 is extremely likely">
        {Array.from({ length: 11 }, (_, n) => (
          <label key={n} className={cn('nps-cell', `is-${npsBand(n)}`, value === n && 'is-on')}>
            <input type="radio" name={name} checked={value === n} disabled={disabled} onChange={() => onChange(n)} />
            <span>{n}</span>
          </label>
        ))}
      </div>
      <div className="nps-ends">
        <span>Not at all likely</span>
        <span>Extremely likely</span>
      </div>
    </div>
  )
}

/** Five stars. Choosing a star fills it and every star before it. */
export function RatingScale({ value, onChange, disabled, className }: ScaleProps) {
  const name = useId()
  return (
    <div className={cn('rate', className)} role="radiogroup" aria-label="Rating from 1 to 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={cn('rate-star', (value ?? 0) >= n && 'is-on')}>
          <input type="radio" name={name} checked={value === n} disabled={disabled} onChange={() => onChange(n)} aria-label={`${n} star${n === 1 ? '' : 's'}`} />
          <Star aria-hidden="true" />
        </label>
      ))}
    </div>
  )
}

interface LikertProps extends ScaleProps {
  points?: 5 | 7
  low: string
  high: string
}

/** An agreement scale of 5 or 7 points, with words at both ends. */
export function LikertScale({ value, onChange, disabled, points = 5, low, high, className }: LikertProps) {
  const name = useId()
  return (
    <div className={cn('likert', className)}>
      <div className="likert-row" role="radiogroup" aria-label={`${low} to ${high}`}>
        {Array.from({ length: points }, (_, i) => i + 1).map((n) => (
          <label key={n} className={cn('likert-dot', value === n && 'is-on')}>
            <input type="radio" name={name} checked={value === n} disabled={disabled} onChange={() => onChange(n)} aria-label={`${n} of ${points}`} />
            <i />
          </label>
        ))}
      </div>
      <div className="nps-ends">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

interface SurveyQuestionInputProps {
  question: SurveyQuestion
  value: SurveyAnswer | undefined
  onChange: (value: SurveyAnswer | undefined) => void
  disabled?: boolean
}

/** The right answer input for any survey question: NPS, stars, an agreement scale, one or many options, or free text. */
export function SurveyQuestionInput({ question: q, value, onChange, disabled }: SurveyQuestionInputProps) {
  switch (q.type) {
    case 'nps':
      return <NpsScale value={typeof value === 'number' ? value : undefined} onChange={onChange} disabled={disabled} />
    case 'rating':
      return <RatingScale value={typeof value === 'number' ? value : undefined} onChange={onChange} disabled={disabled} />
    case 'likert':
      return <LikertScale value={typeof value === 'number' ? value : undefined} onChange={onChange} disabled={disabled} points={q.points} low={q.low} high={q.high} />
    case 'choice':
      return (
        <div className="sv-options" role="radiogroup" aria-label={q.prompt}>
          {q.options.map((o) => (
            <label key={o.id} className={cn('sv-option', value === o.id && 'is-on')}>
              <input type="radio" name={q.id} checked={value === o.id} disabled={disabled} onChange={() => onChange(o.id)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      )
    case 'multiple': {
      const list = Array.isArray(value) ? value : []
      return (
        <div className="sv-options" role="group" aria-label={q.prompt}>
          {q.options.map((o) => (
            <label key={o.id} className={cn('sv-option', list.includes(o.id) && 'is-on')}>
              <input type="checkbox" checked={list.includes(o.id)} disabled={disabled} onChange={() => onChange(list.includes(o.id) ? list.filter((x) => x !== o.id) : [...list, o.id])} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      )
    }
    case 'text':
      return q.maxLength && q.maxLength > 120 ? (
        <Textarea rows={4} maxLength={q.maxLength} value={typeof value === 'string' ? value : ''} disabled={disabled} aria-label={q.prompt} onChange={(e) => onChange(e.target.value || undefined)} />
      ) : (
        <Input value={typeof value === 'string' ? value : ''} maxLength={q.maxLength} disabled={disabled} aria-label={q.prompt} onChange={(e) => onChange(e.target.value || undefined)} />
      )
  }
}
