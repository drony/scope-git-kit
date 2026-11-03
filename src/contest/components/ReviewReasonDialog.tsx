import { useEffect, useState } from 'react'
import { Textarea } from '@/kit/components/forms/Field'
import { Modal } from '@/kit/components/overlays/Modal'
import { Button } from '@/kit/components/ui/Button'
import type { ReviewAction } from '../data/types'
import { ACTIONS } from '../lib/review'

interface ReviewReasonDialogProps {
  /** The action that needs a reason, or null to close the dialog. */
  action: ReviewAction | null
  /** How many questions it is for. */
  count: number
  /** Called with the reason when the person confirms. */
  onConfirm: (note: string) => void
  onCancel: () => void
  busy?: boolean
}

const SUGGESTIONS = ['Add a source.', 'The source is only Wikipedia.', 'Two options are alike.', 'The answer in the key is wrong.', 'The level does not fit.']

/**
 * Asks why, before a question is returned or withdrawn. The reason goes to the writer, so the button stays off until it is at
 * least a few words. Quick reasons add a common sentence with one tap.
 */
export function ReviewReasonDialog({ action, count, onConfirm, onCancel, busy }: ReviewReasonDialogProps) {
  const [note, setNote] = useState('')
  useEffect(() => setNote(''), [action])
  if (!action) return null
  const verb = ACTIONS[action].label
  const ok = note.trim().length >= 5
  const add = (text: string) => setNote((n) => (n.trim() ? `${n.trim()} ${text}` : text))
  return (
    <Modal
      open
      onClose={onCancel}
      title={`${verb} ${count === 1 ? 'this question' : `${count} questions`}`}
      description="The writer reads this. Say what to change."
      actions={
        <>
          <Button variant="plain" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!ok} loading={busy} onClick={() => onConfirm(note.trim())}>
            {verb}
          </Button>
        </>
      }
    >
      <Textarea rows={3} value={note} placeholder="For example: Add a second source." aria-label="Reason" autoFocus onChange={(e) => setNote(e.target.value)} />
      <span className="rv-quick" role="group" aria-label="Quick reasons">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => add(s)}>
            {s}
          </button>
        ))}
      </span>
    </Modal>
  )
}
