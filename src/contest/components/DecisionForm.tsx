import { useEffect, useState } from 'react'
import { Input, Textarea } from '@/kit/components/forms/Field'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { Claim, ReportAction, ReportDecision } from '../data/types'
import { ACTIONS, MAX_SUSPENSION_DAYS, actionsFor, consequences, decisionProblem, type ReportCase, type Suggestion } from '../lib/moderation'

const DAYS = [1, 3, 7, 14, 30]
const QUICK = {
  player: ['Checked the answers and the times: normal.', 'The data and the reports agree.', 'No rule was broken.', 'First case: a warning is enough.'],
  question: ['The wording is clear enough.', 'The key is right.', 'Two readings are possible: it needs a rewrite.', 'The key is wrong.'],
}

interface DecisionFormProps {
  case: ReportCase
  /** The name of the player, or the text of the question, for the sentences about what the decision does. */
  targetName: string
  /** The next step on the ladder. It is chosen to begin with, and the form says why. */
  suggestion: Suggestion
  actor: string
  /** Who is working on the case. The form is off when it is someone else. */
  claim?: Claim
  /** The clock, in milliseconds. */
  now: number
  onSubmit: (decision: ReportDecision) => void
  busy?: boolean
  className?: string
}

/**
 * The decision on a case: pick an action (the suggested one is chosen), see in plain words what it does, give a reason, and
 * confirm. A suspension asks for days. The button stays off, and a line says why, until the decision is complete.
 */
export function DecisionForm({ case: c, targetName, suggestion, actor, claim, now, onSubmit, busy, className }: DecisionFormProps) {
  const [action, setAction] = useState<ReportAction>(suggestion.action)
  const [days, setDays] = useState(suggestion.days ?? 3)
  const [note, setNote] = useState('')
  useEffect(() => {
    setAction(suggestion.action)
    setDays(suggestion.days ?? 3)
    setNote('')
  }, [c.key, suggestion.action, suggestion.days])

  const decision: ReportDecision = { action, note, ...(action === 'suspend' ? { days } : {}) }
  const problem = decisionProblem(c, decision, { actor, claim })
  const add = (text: string) => setNote((n) => (n.trim() ? `${n.trim()} ${text}` : text))
  return (
    <form
      className={cn('mq-decide', className)}
      onSubmit={(e) => {
        e.preventDefault()
        if (!problem) onSubmit(decision)
      }}
    >
      <h3>Decide</h3>
      <p className="mq-suggest">
        <b>Suggested: {ACTIONS[suggestion.action].label}{suggestion.days ? ` ${suggestion.days} days` : ''}.</b> {suggestion.why}
      </p>
      <div className="mq-actions" role="radiogroup" aria-label="Action">
        {actionsFor(c.kind).map((a) => (
          <button key={a} type="button" role="radio" aria-checked={action === a} className={cn('mq-action', action === a && 'is-on', a === suggestion.action && 'is-suggested')} onClick={() => setAction(a)}>
            <strong>{ACTIONS[a].label}</strong>
            <span>{ACTIONS[a].hint}</span>
          </button>
        ))}
      </div>
      {action === 'suspend' && (
        <div className="mq-days">
          <label>
            Days <Input type="number" min={1} max={MAX_SUSPENSION_DAYS} value={days} onChange={(e) => setDays(Math.max(1, Math.min(MAX_SUSPENSION_DAYS, Math.round(Number(e.target.value) || 1))))} aria-label="Days of suspension" />
          </label>
          <span role="group" aria-label="Usual lengths">
            {DAYS.map((d) => (
              <button key={d} type="button" className={cn('mq-chip', days === d && 'is-on')} aria-pressed={days === d} onClick={() => setDays(d)}>
                {d} d
              </button>
            ))}
          </span>
        </div>
      )}
      <ul className="mq-effects" aria-label="What this does">
        {consequences(c, { action, days }, targetName, now).map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <label className="mq-note">
        Reason
        <Textarea rows={3} value={note} placeholder="Say what you checked and why you decided this." onChange={(e) => setNote(e.target.value)} />
      </label>
      <span className="mq-quick" role="group" aria-label="Quick reasons">
        {QUICK[c.kind].map((q) => (
          <button key={q} type="button" onClick={() => add(q)}>
            {q}
          </button>
        ))}
      </span>
      {problem && <p className="mq-problem">{problem}</p>}
      <Button type="submit" variant={action === 'dismiss' ? 'plain' : 'primary'} disabled={Boolean(problem) || busy} loading={busy}>
        {ACTIONS[action].label}
        {action === 'suspend' ? ` for ${days} day${days === 1 ? '' : 's'}` : ''}
      </Button>
    </form>
  )
}
