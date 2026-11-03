import { useMemo, useState } from 'react'
import { CircleAlert, FileUp } from 'lucide-react'
import { Textarea } from '@/kit/components/forms/Field'
import { Modal } from '@/kit/components/overlays/Modal'
import { Button } from '@/kit/components/ui/Button'
import { Tag } from '@/kit/components/ui/Badge'
import type { AnswerKey, Question } from '../data/types'
import { parseQuestions } from '../lib/quick'
import { typeInfo } from '../lib/questionTypes'

interface QuestionImportProps {
  open: boolean
  onClose: () => void
  /** Called with the questions that were read, as drafts. The dialog closes after it finishes. */
  onImport: (items: Array<{ question: Question; key: AnswerKey }>) => void | Promise<void>
}

const EXAMPLE = `Which planet is closest to the Sun?
a) Venus
*b) Mercury
c) Mars
Tags: space
Level: 2

The Great Wall of China is visible from the Moon.
True
*False

What is the capital of Australia?
Answer: Canberra`

/**
 * Write or paste many questions at once. Blocks are split by a blank line: the first line is the question, the lines below
 * are options, and a `*` marks the right one. The list is read as you type, so you see how each question will turn out
 * before anything is saved. Everything comes in as a draft.
 */
export function QuestionImport({ open, onClose, onImport }: QuestionImportProps) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const parsed = useMemo(() => parseQuestions(text), [text])
  const close = () => {
    setText('')
    onClose()
  }
  const add = async () => {
    setBusy(true)
    try {
      await onImport(parsed.map(({ question, key }) => ({ question, key })))
      close()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Paste questions"
      description="One question per block, blocks split by a blank line. Mark the right option with *, or add a line “Answer: …”."
      actions={
        <>
          <Button variant="plain" onClick={close}>
            Cancel
          </Button>
          <Button disabled={parsed.length === 0 || busy} loading={busy} onClick={() => void add()}>
            <FileUp aria-hidden="true" /> Add {parsed.length} draft{parsed.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="qi">
        <Textarea rows={12} value={text} placeholder={EXAMPLE} aria-label="Questions to import" onChange={(e) => setText(e.target.value)} />
        <div className="qi-out" aria-label="What was read">
          {parsed.length === 0 ? (
            <p className="qi-empty">Your questions show up here as you type.</p>
          ) : (
            <ol>
              {parsed.map((p, i) => (
                <li key={i} className={p.problems.length ? 'has-problem' : undefined}>
                  <strong>{p.question.prompt}</strong>
                  <span className="qi-meta">
                    <Tag>{typeInfo(p.question.type).label}</Tag>
                    {p.question.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </span>
                  {p.problems.length > 0 && (
                    <small>
                      <CircleAlert aria-hidden="true" /> {p.problems.join(' ')}
                    </small>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Modal>
  )
}
