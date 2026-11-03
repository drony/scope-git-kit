import { useMemo, useState } from 'react'
import { CircleAlert, UserPlus } from 'lucide-react'
import { Textarea } from '@/kit/components/forms/Field'
import { Modal } from '@/kit/components/overlays/Modal'
import { Button } from '@/kit/components/ui/Button'
import { Tag } from '@/kit/components/ui/Badge'
import { INVITE_PROBLEMS, parseInvites, type InvitePerson } from '../lib/invites'

interface InviteDialogProps {
  open: boolean
  onClose: () => void
  /** E-mail addresses already in the contest, so a repeat is caught before it is sent. */
  existingEmails?: string[]
  /** Called with the people that read fine, when the person confirms. The dialog closes after it finishes. */
  onInvite: (people: InvitePerson[]) => void | Promise<void>
}

const EXAMPLE = 'ada@example.com\nBo Tanaka <bo@example.com>, Orbit\nCleo Mensah, cleo@example.com, Nova'

/**
 * Paste a list of people and invite them in one go. The list is read as you type: you see how many lines are fine, and
 * for every line that is not, the reason. Nothing is sent until you confirm, and only the lines that read fine are sent.
 */
export function InviteDialog({ open, onClose, existingEmails = [], onInvite }: InviteDialogProps) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const { lines, valid } = useMemo(() => parseInvites(text, existingEmails), [text, existingEmails])
  const bad = lines.filter((l) => l.problem)

  const close = () => {
    setText('')
    onClose()
  }
  const invite = async () => {
    setBusy(true)
    try {
      await onInvite(valid)
      close()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Invite people"
      description="One person per line. An e-mail address is enough; a name and a team are optional."
      actions={
        <>
          <Button variant="plain" onClick={close}>
            Cancel
          </Button>
          <Button disabled={valid.length === 0 || busy} loading={busy} onClick={() => void invite()}>
            <UserPlus aria-hidden="true" /> Invite {valid.length} {valid.length === 1 ? 'person' : 'people'}
          </Button>
        </>
      }
    >
      <div className="cs-invite">
        <Textarea rows={8} value={text} placeholder={EXAMPLE} aria-label="People to invite" onChange={(e) => setText(e.target.value)} />
        {lines.length > 0 && (
          <p className="cs-invite-sum" role="status">
            <Tag tone="success">{valid.length} ready</Tag>
            {bad.length > 0 && <Tag tone="error">{bad.length} to fix</Tag>}
          </p>
        )}
        {bad.length > 0 && (
          <ul className="cs-invite-bad" aria-label="Lines to fix">
            {bad.slice(0, 6).map((l) => (
              <li key={l.line}>
                <CircleAlert aria-hidden="true" />
                <span>
                  <strong>Line {l.line}:</strong> <code>{l.raw}</code>
                  <br />
                  {INVITE_PROBLEMS[l.problem!]}
                </span>
              </li>
            ))}
            {bad.length > 6 && <li>…and {bad.length - 6} more.</li>}
          </ul>
        )}
        {valid.length > 0 && (
          <p className="field-hint">
            {valid
              .slice(0, 4)
              .map((p) => p.name)
              .join(', ')}
            {valid.length > 4 ? ` and ${valid.length - 4} more` : ''} will get an invitation.
          </p>
        )}
      </div>
    </Modal>
  )
}
