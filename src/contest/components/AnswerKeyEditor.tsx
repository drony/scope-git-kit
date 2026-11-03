import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Checkbox, Switch } from '@/kit/components/forms/Controls'
import { Field, Input } from '@/kit/components/forms/Field'
import { Select } from '@/kit/components/forms/Select'
import { Alert } from '@/kit/components/ui/Feedback'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { AcceptedText, AnswerKey, AnswerValue, Question } from '../data/types'
import { blankKey, keyProblems, typeInfo } from '../lib/questionTypes'
import { sampleAnswer } from '../lib/sampleAnswers'
import { scoreAnswer } from '../lib/scoring'
import { AnswerInput, type MediaLookup } from './Answers'

interface AnswerKeyEditorProps {
  question: Question
  /** The key being edited, or null when the question has none yet. */
  value: AnswerKey | null
  onChange: (key: AnswerKey) => void
  media?: MediaLookup
  className?: string
}

const CREDITS = [1, 0.75, 0.5, 0.25].map((c) => ({ value: String(c), label: `${c * 100}% of the points` }))

const uid = (prefix: string, used: string[]) => {
  let n = used.length + 1
  while (used.includes(`${prefix}${n}`)) n++
  return `${prefix}${n}`
}

/**
 * The back-office editor for the answer key: which option is right, which wordings are accepted, the number and its
 * tolerance, the right order, the matching pairs, or the rubric. It warns when the key no longer fits the question, and has
 * a "try an answer" box that scores a sample answer the way a real one would be scored, so you can test the key before
 * anyone answers.
 */
export function AnswerKeyEditor({ question: q, value, onChange, media, className }: AnswerKeyEditorProps) {
  const [trial, setTrial] = useState<AnswerValue | null>(null)
  const key = value && value.type === typeInfo(q.type).key ? value : null
  const problems = keyProblems(q, value)
  const result = scoreAnswer(q, key, trial)

  if (!key) {
    return (
      <div className={cn('cs-keyed', className)}>
        {value && (
          <Alert tone="warning" title="The key does not fit this question">
            {problems[0]}
          </Alert>
        )}
        <Button onClick={() => onChange(blankKey(q))}>Create an answer key</Button>
      </div>
    )
  }

  return (
    <div className={cn('cs-keyed', className)}>
      {problems.length > 0 && (
        <Alert tone="warning" title={problems.length === 1 ? 'One thing to fix' : `${problems.length} things to fix`}>
          <span className="cs-problems">
            {problems.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </span>
        </Alert>
      )}

      {key.type === 'choice' && 'options' in q && (
        <fieldset className="cs-key-choice">
          <legend className="field-label">{q.type === 'multiple' ? 'Which options are right?' : 'Which option is right?'}</legend>
          {q.options.map((o) => {
            const on = key.correct.includes(o.id)
            const toggle = () => onChange({ ...key, correct: q.type === 'multiple' ? (on ? key.correct.filter((c) => c !== o.id) : [...key.correct, o.id]) : [o.id] })
            return q.type === 'multiple' ? (
              <Checkbox key={o.id} checked={on} onChange={toggle} label={o.label || '(empty option)'} />
            ) : (
              <label key={o.id} className="check">
                <input type="radio" name={`key-${q.id}`} checked={on} onChange={toggle} />
                <span>{o.label || '(empty option)'}</span>
              </label>
            )
          })}
          {q.type === 'multiple' && (
            <Switch checked={key.partialCredit} onChange={(partialCredit) => onChange({ ...key, partialCredit })} label="Partial credit" description="A share of the points for a partly right answer; wrong picks cancel right ones." />
          )}
        </fieldset>
      )}

      {key.type === 'text' && (
        <div className="cs-key-text">
          <span className="field-label">Accepted wordings</span>
          {key.accepted.map((a: AcceptedText, i) => (
            <div key={a.id} className="cs-accepted">
              <Input value={a.text} aria-label={`Accepted wording ${i + 1}`} placeholder="An accepted answer" onChange={(e) => onChange({ ...key, accepted: key.accepted.map((x) => (x.id === a.id ? { ...x, text: e.target.value } : x)) })} />
              <Select<string> ariaLabel={`Credit for wording ${i + 1}`} value={String(a.credit)} options={CREDITS} onChange={(v) => onChange({ ...key, accepted: key.accepted.map((x) => (x.id === a.id ? { ...x, credit: Number(v) } : x)) })} />
              <Button variant="ghost" size="sm" icon aria-label={`Remove wording ${i + 1}`} disabled={key.accepted.length <= 1} onClick={() => onChange({ ...key, accepted: key.accepted.filter((x) => x.id !== a.id) })}>
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button variant="plain" size="sm" onClick={() => onChange({ ...key, accepted: [...key.accepted, { id: uid('k', key.accepted.map((x) => x.id)), text: '', credit: 1 }] })}>
            <Plus aria-hidden="true" /> Add wording
          </Button>
          <Checkbox checked={!key.caseSensitive} onChange={(on) => onChange({ ...key, caseSensitive: !on })} label="Ignore capital letters" />
          <Checkbox checked={key.ignoreAccents} onChange={(ignoreAccents) => onChange({ ...key, ignoreAccents })} label="Ignore accents" description="é counts as e." />
          <Checkbox checked={key.ignorePunctuation} onChange={(ignorePunctuation) => onChange({ ...key, ignorePunctuation })} label="Ignore punctuation and extra spaces" />
        </div>
      )}

      {key.type === 'number' && (
        <div className="cs-grid-3">
          <Field label="Right answer">
            <Input type="number" step="any" value={key.value} affix={q.type === 'number' ? q.unit : undefined} onChange={(e) => onChange({ ...key, value: Number(e.target.value) })} />
          </Field>
          <Field label="Tolerance" hint="How far off still counts as right.">
            <Input type="number" min={0} step="any" value={key.tolerance} onChange={(e) => onChange({ ...key, tolerance: Math.max(0, Number(e.target.value)) })} />
          </Field>
        </div>
      )}

      {key.type === 'ordering' && q.type === 'ordering' && (
        <div className="cs-key-order">
          <span className="field-label">The right order</span>
          <ol>
            {key.order.map((id) => (
              <li key={id}>{q.items.find((i) => i.id === id)?.label ?? <em>removed item</em>}</li>
            ))}
          </ol>
          <Button variant="plain" size="sm" onClick={() => onChange({ ...key, order: q.items.map((i) => i.id) })}>
            Use the order of the items in the question
          </Button>
        </div>
      )}

      {key.type === 'matching' && q.type === 'matching' && (
        <div className="cs-key-match">
          <span className="field-label">Which pairs belong together?</span>
          {q.left.map((l) => (
            <div key={l.id} className="cs-match-row">
              <span>{l.label || '(empty)'}</span>
              <Select<string>
                ariaLabel={`Match for ${l.label}`}
                value={key.pairs[l.id] ?? ''}
                placeholder="Choose…"
                options={q.right.map((r) => ({ value: r.id, label: r.label || '(empty)' }))}
                onChange={(v) => onChange({ ...key, pairs: { ...key.pairs, [l.id]: v } })}
              />
            </div>
          ))}
        </div>
      )}

      {key.type === 'manual' && (
        <div className="cs-key-rubric">
          <span className="field-label">Rubric: a person scores this answer</span>
          {key.rubric.map((r, i) => (
            <div key={r.id} className="cs-accepted">
              <Input value={r.label} aria-label={`Criterion ${i + 1}`} placeholder="What to look for" onChange={(e) => onChange({ ...key, rubric: key.rubric.map((x) => (x.id === r.id ? { ...x, label: e.target.value } : x)) })} />
              <Input type="number" min={0} value={r.maxPoints} aria-label={`Points for criterion ${i + 1}`} onChange={(e) => onChange({ ...key, rubric: key.rubric.map((x) => (x.id === r.id ? { ...x, maxPoints: Math.max(0, Number(e.target.value)) } : x)) })} />
              <Button variant="ghost" size="sm" icon aria-label={`Remove criterion ${i + 1}`} disabled={key.rubric.length <= 1} onClick={() => onChange({ ...key, rubric: key.rubric.filter((x) => x.id !== r.id) })}>
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button variant="plain" size="sm" onClick={() => onChange({ ...key, rubric: [...key.rubric, { id: uid('r', key.rubric.map((x) => x.id)), label: '', maxPoints: 5 }] })}>
            <Plus aria-hidden="true" /> Add criterion
          </Button>
        </div>
      )}

      <details className="cs-try">
        <summary>Try an answer</summary>
        <p className="field-hint">Answer the question here and see the points it would get. Nothing is saved.</p>
        <div className="cs-try-actions">
          <Button variant="plain" size="sm" onClick={() => setTrial(sampleAnswer(q, key, true))}>
            Fill in a right answer
          </Button>
          <Button variant="plain" size="sm" onClick={() => setTrial(sampleAnswer(q, key, false))}>
            Fill in a wrong answer
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setTrial(null)}>
            Clear
          </Button>
        </div>
        <AnswerInput question={q} value={trial} onChange={setTrial} media={media} upload={undefined} />
        <div className={cn('cs-try-result', result.points === result.max && result.auto && 'is-full')} role="status">
          <strong>
            {result.points} / {result.max} points
          </strong>
          <span>{result.reason}</span>
        </div>
      </details>
    </div>
  )
}
