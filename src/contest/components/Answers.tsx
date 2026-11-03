import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Input, Textarea } from '@/kit/components/forms/Field'
import { Select } from '@/kit/components/forms/Select'
import { SortableList } from '@/kit/components/data/SortableList'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { AnswerKey, AnswerValue, Id, MediaAsset, Question } from '../data/types'
import { shuffled } from '../lib/questionTypes'
import { MediaUploader, type UploadHandler } from './MediaUploader'

export type MediaLookup = (id: Id) => MediaAsset | undefined

interface InputProps<Q extends Question, V extends AnswerValue> {
  question: Q
  value: V | null
  onChange: (value: V) => void
  disabled?: boolean
  /** After the answer is locked: pass the key to show which parts were right. */
  reveal?: AnswerKey | null
}

type Of<T extends Question['type']> = Extract<Question, { type: T }>

/* ---- Choice -------------------------------------------------------------------------------------------------- */

/** Single choice, multiple choice, true or false, and picture choice. Native inputs, so the keyboard just works. */
export function ChoiceAnswer({ question, value, onChange, disabled, reveal, media }: InputProps<Of<'single' | 'multiple' | 'truefalse' | 'image-choice'>, Extract<AnswerValue, { type: 'choice' }>> & { media?: MediaLookup }) {
  const multiple = question.type === 'multiple'
  const selected = value?.selected ?? []
  const correct = reveal?.type === 'choice' ? reveal.correct : null
  const toggle = (id: Id) => onChange({ type: 'choice', selected: multiple ? (selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]) : [id] })

  return (
    <div className={cn('cs-choices', question.type === 'image-choice' && 'is-pictures')} role={multiple ? 'group' : 'radiogroup'} aria-label={question.prompt || 'Answer options'}>
      {question.options.map((o) => {
        const checked = selected.includes(o.id)
        const state = correct ? (correct.includes(o.id) ? 'is-right' : checked ? 'is-wrong' : '') : ''
        const picture = o.mediaId ? media?.(o.mediaId) : undefined
        return (
          <label key={o.id} className={cn('cs-choice', checked && 'is-checked', state, disabled && 'is-disabled')}>
            <input type={multiple ? 'checkbox' : 'radio'} name={question.id} checked={checked} disabled={disabled} onChange={() => toggle(o.id)} />
            {picture && <img src={picture.url} alt={picture.alt ?? o.label} />}
            <span className="cs-choice-text">
              <span>{o.label}</span>
              {correct && (checked || correct.includes(o.id)) && o.feedback && <small>{o.feedback}</small>}
            </span>
            {state === 'is-right' && <Check aria-label="Correct" className="cs-choice-mark" />}
            {state === 'is-wrong' && <X aria-label="Wrong" className="cs-choice-mark" />}
          </label>
        )
      })}
    </div>
  )
}

/* ---- Text ---------------------------------------------------------------------------------------------------- */

/** A short or a long written answer. */
export function TextAnswer({ question, value, onChange, disabled, reveal }: InputProps<Of<'short' | 'long'>, Extract<AnswerValue, { type: 'text' }>>) {
  const text = value?.text ?? ''
  const max = question.maxLength
  return (
    <div className="cs-text">
      {question.type === 'long' ? (
        <Textarea rows={7} value={text} maxLength={max} disabled={disabled} aria-label="Your answer" onChange={(e) => onChange({ type: 'text', text: e.target.value })} />
      ) : (
        <Input value={text} maxLength={max} disabled={disabled} aria-label="Your answer" autoComplete="off" onChange={(e) => onChange({ type: 'text', text: e.target.value })} />
      )}
      {max && question.type === 'long' && <small className="cs-count">{text.length} / {max}</small>}
      {reveal?.type === 'text' && (
        <p className="cs-reveal">Accepted: {reveal.accepted.filter((a) => a.text).map((a) => (a.credit < 1 ? `${a.text} (${Math.round(a.credit * 100)}%)` : a.text)).join(', ')}</p>
      )}
    </div>
  )
}

/* ---- Number -------------------------------------------------------------------------------------------------- */

const parseNumber = (s: string): number | null => {
  const n = Number.parseFloat(s.replace(/\s/g, '').replace(',', '.'))
  return Number.isNaN(n) ? null : n
}

/** A number. The box keeps what the person typed ("3." stays "3.") while the answer holds the parsed value. */
export function NumericAnswer({ question, value, onChange, disabled, reveal }: InputProps<Of<'number'>, Extract<AnswerValue, { type: 'number' }>>) {
  const [raw, setRaw] = useState(value?.value == null ? '' : String(value.value))
  useEffect(() => {
    if (parseNumber(raw) !== (value?.value ?? null)) setRaw(value?.value == null ? '' : String(value.value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.value])
  return (
    <div className="cs-text">
      <Input
        inputMode="decimal"
        value={raw}
        disabled={disabled}
        aria-label={`Your answer${question.unit ? ` in ${question.unit}` : ''}`}
        affix={question.unit}
        onChange={(e) => {
          setRaw(e.target.value)
          onChange({ type: 'number', value: parseNumber(e.target.value) })
        }}
      />
      {reveal?.type === 'number' && (
        <p className="cs-reveal">
          Answer: {reveal.value}
          {question.unit ? ` ${question.unit}` : ''}
          {reveal.tolerance ? ` (anything within ${reveal.tolerance} counts)` : ''}
        </p>
      )}
    </div>
  )
}

/* ---- Ordering ------------------------------------------------------------------------------------------------ */

/** Put the items in order. The items start shuffled (the same way every time); moving one saves the order. */
export function OrderingAnswer({ question, value, onChange, disabled, reveal }: InputProps<Of<'ordering'>, Extract<AnswerValue, { type: 'ordering' }>>) {
  const start = shuffled(question.items, question.id)
  const order = value?.order.length ? value.order.map((id) => question.items.find((i) => i.id === id)).filter((i): i is NonNullable<typeof i> => Boolean(i)) : start
  const label = (id: Id) => question.items.find((i) => i.id === id)?.label ?? id
  return (
    <div className="cs-ordering">
      <SortableList
        label="Put the items in order"
        items={order}
        getId={(i) => i.id}
        onChange={(next) => !disabled && onChange({ type: 'ordering', order: next.map((i) => i.id) })}
        renderItem={(item, { handle, index }) => (
          <div className="cs-order-row">
            {!disabled && handle}
            <span className="cs-order-n">{index + 1}</span>
            <span>{item.label}</span>
          </div>
        )}
      />
      {!disabled && !value && (
        <Button variant="plain" size="sm" onClick={() => onChange({ type: 'ordering', order: order.map((i) => i.id) })}>
          Keep this order
        </Button>
      )}
      {reveal?.type === 'ordering' && <p className="cs-reveal">Right order: {reveal.order.map(label).join(' → ')}</p>}
    </div>
  )
}

/* ---- Matching ------------------------------------------------------------------------------------------------ */

/** Pair each item on the left with one on the right. */
export function MatchingAnswer({ question, value, onChange, disabled, reveal }: InputProps<Of<'matching'>, Extract<AnswerValue, { type: 'matching' }>>) {
  const pairs = value?.pairs ?? {}
  const key = reveal?.type === 'matching' ? reveal.pairs : null
  const options = question.right.map((r) => ({ value: r.id, label: r.label }))
  return (
    <div className="cs-matching">
      {question.left.map((l) => {
        const right = key ? (pairs[l.id] === key[l.id] ? 'is-right' : 'is-wrong') : ''
        return (
          <div key={l.id} className={cn('cs-match-row', right)}>
            <span>{l.label}</span>
            <Select<string> ariaLabel={`Match for ${l.label}`} options={options} value={pairs[l.id] ?? ''} disabled={disabled} placeholder="Choose…" onChange={(v) => onChange({ type: 'matching', pairs: { ...pairs, [l.id]: v } })} />
            {key && right === 'is-wrong' && <small className="cs-reveal">Right: {question.right.find((r) => r.id === key[l.id])?.label}</small>}
          </div>
        )
      })}
    </div>
  )
}

/* ---- Upload -------------------------------------------------------------------------------------------------- */

/** Upload a file as the answer. Without an `upload` handler (a preview, say) it explains that and stays disabled. */
export function UploadAnswer({ question, value, onChange, disabled, upload, media }: InputProps<Of<'upload'>, Extract<AnswerValue, { type: 'upload' }>> & { upload?: UploadHandler; media?: MediaLookup }) {
  const ids = value?.mediaIds ?? []
  return (
    <div className="cs-upload">
      <MediaUploader
        accept={question.accept}
        maxMb={question.maxMb}
        maxFiles={question.maxFiles}
        multiple={question.maxFiles > 1}
        disabled={disabled || !upload}
        onUpload={upload ?? (() => Promise.reject(new Error('Uploads are not available in this preview.')))}
        onUploaded={(a) => onChange({ type: 'upload', mediaIds: question.maxFiles > 1 ? [...ids, a.id] : [a.id] })}
      />
      {!upload && <p className="cs-reveal">Uploads are switched off in this preview.</p>}
      {ids.length > 0 && (
        <ul className="cs-thumbs">
          {ids.map((id) => {
            const a = media?.(id)
            return (
              <li key={id}>
                {a ? <img src={a.url} alt={a.alt ?? a.name} /> : <span>{id}</span>}
                {!disabled && (
                  <button type="button" aria-label={`Remove ${a?.name ?? id}`} onClick={() => onChange({ type: 'upload', mediaIds: ids.filter((x) => x !== id) })}>
                    <X aria-hidden="true" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ---- The switch ---------------------------------------------------------------------------------------------- */

export interface AnswerInputProps {
  question: Question
  value: AnswerValue | null
  onChange: (value: AnswerValue) => void
  disabled?: boolean
  reveal?: AnswerKey | null
  media?: MediaLookup
  upload?: UploadHandler
}

/** The right answer input for any question. Quiz screens and previews use this, so they can never drift apart. */
export function AnswerInput({ question: q, value, onChange, disabled, reveal, media, upload }: AnswerInputProps) {
  const common = { disabled, reveal, onChange: onChange as never }
  switch (q.type) {
    case 'single': case 'multiple': case 'truefalse': case 'image-choice':
      return <ChoiceAnswer question={q} value={value?.type === 'choice' ? value : null} media={media} {...common} />
    case 'short': case 'long':
      return <TextAnswer question={q} value={value?.type === 'text' ? value : null} {...common} />
    case 'number':
      return <NumericAnswer question={q} value={value?.type === 'number' ? value : null} {...common} />
    case 'ordering':
      return <OrderingAnswer question={q} value={value?.type === 'ordering' ? value : null} {...common} />
    case 'matching':
      return <MatchingAnswer question={q} value={value?.type === 'matching' ? value : null} {...common} />
    case 'upload':
      return <UploadAnswer question={q} value={value?.type === 'upload' ? value : null} upload={upload} media={media} {...common} />
  }
}
