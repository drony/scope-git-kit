import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/kit/components/forms/Field'
import { SortableList } from '@/kit/components/data/SortableList'
import { Button } from '@/kit/components/ui/Button'
import type { ChoiceOption, Id } from '../data/types'
import type { MediaLookup } from './Answers'

interface AnswerOptionsEditorProps {
  options: ChoiceOption[]
  onChange: (options: ChoiceOption[]) => void
  /** Names the list for screen readers, e.g. "Answer options". */
  label: string
  /** Prefix for new option ids, so ids stay unique per list. */
  idPrefix?: string
  min?: number
  max?: number
  /** Shows a picture button on each row and calls this with the option to attach one. */
  onPickMedia?: (optionId: Id) => void
  media?: MediaLookup
  /** Lets each option carry a note shown after the answer. */
  feedback?: boolean
  addLabel?: string
}

const nextId = (options: ChoiceOption[], prefix: string): Id => {
  const used = new Set(options.map((o) => o.id))
  let n = options.length + 1
  while (used.has(`${prefix}${n}`)) n++
  return `${prefix}${n}`
}

/** Edit the options of a question: add, remove, reorder, rename, attach a picture, and write a note per option. */
export function AnswerOptionsEditor({ options, onChange, label, idPrefix = 'o', min = 2, max = 8, onPickMedia, media, feedback, addLabel = 'Add option' }: AnswerOptionsEditorProps) {
  const patch = (id: Id, change: Partial<ChoiceOption>) => onChange(options.map((o) => (o.id === id ? { ...o, ...change } : o)))
  return (
    <div className="cs-options">
      <SortableList
        label={label}
        items={options}
        getId={(o) => o.id}
        onChange={onChange}
        renderItem={(o, { handle, index }) => {
          const picture = o.mediaId ? media?.(o.mediaId) : undefined
          return (
            <div className="cs-option-row">
              {handle}
              <div className="cs-option-fields">
                <div className="cs-option-main">
                  <Input value={o.label} aria-label={`Option ${index + 1}`} placeholder={`Option ${index + 1}`} onChange={(e) => patch(o.id, { label: e.target.value })} />
                  {onPickMedia && (
                    <Button variant="plain" size="sm" icon aria-label={`Picture for option ${index + 1}`} onClick={() => onPickMedia(o.id)}>
                      {picture ? <img className="cs-option-thumb" src={picture.url} alt="" /> : <ImageIcon aria-hidden="true" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" icon aria-label={`Remove option ${index + 1}`} disabled={options.length <= min} onClick={() => onChange(options.filter((x) => x.id !== o.id))}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
                {feedback && <Input value={o.feedback ?? ''} aria-label={`Note for option ${index + 1}`} placeholder="Note shown after answering (optional)" onChange={(e) => patch(o.id, { feedback: e.target.value || undefined })} />}
              </div>
            </div>
          )
        }}
      />
      <Button variant="plain" size="sm" disabled={options.length >= max} onClick={() => onChange([...options, { id: nextId(options, idPrefix), label: '' }])}>
        <Plus aria-hidden="true" /> {addLabel}
      </Button>
    </div>
  )
}
