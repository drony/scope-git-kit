import { ImagePlus, X } from 'lucide-react'
import { Field, Input, Textarea } from '@/kit/components/forms/Field'
import { Select } from '@/kit/components/forms/Select'
import { Button } from '@/kit/components/ui/Button'
import type { Id, Question, QuestionStatus, QuestionType } from '../data/types'
import { convertQuestion, QUESTION_TYPES } from '../lib/questionTypes'
import { AnswerOptionsEditor } from './AnswerOptionsEditor'
import type { MediaLookup } from './Answers'

/** What the person is attaching a picture or file to. */
export type MediaTarget = { kind: 'prompt' } | { kind: 'option'; id: Id }

interface QuestionComposerProps {
  question: Question
  onChange: (question: Question) => void
  media?: MediaLookup
  /** Opens your media picker for the chosen target; call `onChange` with the result. Leave out to hide the buttons. */
  onPickMedia?: (target: MediaTarget) => void
  className?: string
}

const STATUSES: Array<{ value: QuestionStatus; label: string; description: string }> = [
  { value: 'draft', label: 'Draft', description: 'Only you see it.' },
  { value: 'ready', label: 'Ready', description: 'Checked, waiting to go live.' },
  { value: 'published', label: 'Published', description: 'Participants can see it.' },
]

const num = (s: string, fallback: number) => {
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

/**
 * The form for one question: type, prompt, pictures and sounds, options, points, time limit, hint and explanation. It never
 * saves anything: it hands every change to `onChange`. The answer key is a separate editor (`AnswerKeyEditor`), because
 * the key is back-office only.
 */
export function QuestionComposer({ question: q, onChange, media, onPickMedia, className }: QuestionComposerProps) {
  const set = <K extends keyof Question>(key: K, value: Question[K]) => onChange({ ...q, [key]: value } as Question)
  const attachments = q.mediaIds.map((id) => media?.(id))

  return (
    <div className={className ? `cs-composer ${className}` : 'cs-composer'}>
      <Field label="Type" hint={QUESTION_TYPES.find((t) => t.type === q.type)?.description}>
        <Select<QuestionType>
          ariaLabel="Question type"
          value={q.type}
          onChange={(type) => onChange(convertQuestion(q, type))}
          options={QUESTION_TYPES.map((t) => ({ value: t.type, label: t.label, description: t.description }))}
        />
      </Field>

      <Field label="Question">
        <Textarea rows={3} value={q.prompt} placeholder="What do you want to ask?" onChange={(e) => set('prompt', e.target.value)} />
      </Field>

      {(onPickMedia || q.mediaIds.length > 0) && (
        <div className="cs-field">
          <span className="field-label">Pictures, sounds and video</span>
          <div className="cs-attach-row">
            {q.mediaIds.map((id, i) => (
              <span key={id} className="cs-attach">
                {attachments[i]?.kind === 'image' ? <img src={attachments[i]!.url} alt={attachments[i]!.alt ?? ''} /> : <span>{attachments[i]?.name ?? id}</span>}
                <button type="button" aria-label={`Remove ${attachments[i]?.name ?? id}`} onClick={() => set('mediaIds', q.mediaIds.filter((x) => x !== id))}>
                  <X aria-hidden="true" />
                </button>
              </span>
            ))}
            {onPickMedia && (
              <Button variant="plain" size="sm" onClick={() => onPickMedia({ kind: 'prompt' })}>
                <ImagePlus aria-hidden="true" /> Add media
              </Button>
            )}
          </div>
        </div>
      )}

      {'options' in q && (
        <div className="cs-field">
          <span className="field-label">{q.type === 'truefalse' ? 'Statements' : q.type === 'image-choice' ? 'Pictures' : 'Options'}</span>
          <AnswerOptionsEditor
            label="Answer options"
            options={q.options}
            onChange={(options) => onChange({ ...q, options })}
            min={q.type === 'truefalse' ? 2 : 2}
            max={q.type === 'truefalse' ? 2 : 8}
            feedback
            media={media}
            onPickMedia={q.type === 'image-choice' ? (id) => onPickMedia?.({ kind: 'option', id }) : undefined}
          />
        </div>
      )}

      {q.type === 'ordering' && (
        <div className="cs-field">
          <span className="field-label">Items, in the right order</span>
          <p className="field-hint">List them in the order that is correct. Participants see them shuffled.</p>
          <AnswerOptionsEditor label="Items in the right order" options={q.items} idPrefix="i" onChange={(items) => onChange({ ...q, items })} min={2} max={10} addLabel="Add item" />
        </div>
      )}

      {q.type === 'matching' && (
        <div className="cs-pair">
          <div className="cs-field">
            <span className="field-label">Left side</span>
            <AnswerOptionsEditor label="Left side" options={q.left} idPrefix="l" onChange={(left) => onChange({ ...q, left })} min={2} max={8} addLabel="Add item" />
          </div>
          <div className="cs-field">
            <span className="field-label">Right side</span>
            <AnswerOptionsEditor label="Right side" options={q.right} idPrefix="r" onChange={(right) => onChange({ ...q, right })} min={2} max={8} addLabel="Add item" />
          </div>
        </div>
      )}

      <div className="cs-grid-3">
        <Field label="Points">
          <Input type="number" min={0} value={q.points} onChange={(e) => set('points', num(e.target.value, q.points))} />
        </Field>
        <Field label="Time limit" optional hint="Seconds. Empty means no limit.">
          <Input type="number" min={0} value={q.timeLimitSec ?? ''} onChange={(e) => set('timeLimitSec', e.target.value === '' ? undefined : num(e.target.value, 0))} />
        </Field>
        <Field label="Status">
          <Select<QuestionStatus> ariaLabel="Status" value={q.status} onChange={(v) => set('status', v)} options={STATUSES} />
        </Field>
      </div>

      {(q.type === 'short' || q.type === 'long') && (
        <Field label="Longest answer" optional hint="Characters.">
          <Input type="number" min={0} value={q.maxLength ?? ''} onChange={(e) => onChange({ ...q, maxLength: e.target.value === '' ? undefined : num(e.target.value, 0) })} />
        </Field>
      )}
      {q.type === 'number' && (
        <Field label="Unit" optional hint="Shown after the box, e.g. km.">
          <Input value={q.unit ?? ''} onChange={(e) => onChange({ ...q, unit: e.target.value || undefined })} />
        </Field>
      )}
      {q.type === 'upload' && (
        <div className="cs-grid-3">
          <Field label="Accepted types" hint="For example image/* or application/pdf.">
            <Input value={q.accept} onChange={(e) => onChange({ ...q, accept: e.target.value })} />
          </Field>
          <Field label="Largest file (MB)">
            <Input type="number" min={1} value={q.maxMb} onChange={(e) => onChange({ ...q, maxMb: Math.max(1, num(e.target.value, q.maxMb)) })} />
          </Field>
          <Field label="Most files">
            <Input type="number" min={1} value={q.maxFiles} onChange={(e) => onChange({ ...q, maxFiles: Math.max(1, num(e.target.value, q.maxFiles)) })} />
          </Field>
        </div>
      )}

      <Field label="Tags" optional hint="Separate with commas. Tags help you find the question in the bank.">
        <Input value={q.tags.join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} />
      </Field>

      <details className="cs-more">
        <summary>Hint and explanation</summary>
        <Field label="Hint" optional hint="Participants can open it while answering.">
          <Textarea rows={2} value={q.hint ?? ''} onChange={(e) => set('hint', e.target.value || undefined)} />
        </Field>
        <Field label="Explanation" optional hint="Shown after the answer is locked.">
          <Textarea rows={2} value={q.explanation ?? ''} onChange={(e) => set('explanation', e.target.value || undefined)} />
        </Field>
      </details>
    </div>
  )
}
