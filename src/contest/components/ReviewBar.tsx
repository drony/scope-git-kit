import { X } from 'lucide-react'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { AnswerKey, Id, Question, ReviewAction } from '../data/types'
import { ACTIONS, DEFAULT_POLICY, bulkPlan, reviewActions, type ReviewPolicy } from '../lib/review'

const ORDER: ReviewAction[] = ['submit', 'preapprove', 'approve', 'return', 'withdraw', 'trash', 'restore']
const FORWARD: ReviewAction[] = ['submit', 'preapprove', 'approve', 'restore']

interface ReviewBarProps {
  /** The questions that are ticked. The bar shows nothing when there are none. */
  selected: Question[]
  keys: Record<Id, AnswerKey>
  /** Who is acting. */
  actor: string
  policy?: ReviewPolicy
  /** Called with the action and the ids it can be done to. The ones that cannot are left out. */
  onAction: (action: ReviewAction, ids: Id[]) => void
  onClear: () => void
  busy?: boolean
  className?: string
}

/**
 * The bar for acting on many questions at once. Each button says how many of the ticked questions it will change, and the line
 * under it says why the others are left out, so nothing is skipped in silence. A button appears only for actions that apply to
 * at least one ticked question.
 */
export function ReviewBar({ selected, keys, actor, policy = DEFAULT_POLICY, onAction, onClear, busy, className }: ReviewBarProps) {
  if (selected.length === 0) return null
  const ctx = { actor, policy }
  const offered = ORDER.filter((a) => selected.some((q) => reviewActions(q, keys[q.id], ctx).some((x) => x.action === a)))
  const plans = offered.map((a) => ({ action: a, plan: bulkPlan(selected, a, keys, ctx) }))
  const main = plans.find((p) => FORWARD.includes(p.action) && p.plan.ok.length > 0)
  const left = main ? main.plan.skipped.reduce((m, s) => m.set(s.why, (m.get(s.why) ?? 0) + 1), new Map<string, number>()) : new Map<string, number>()
  return (
    <div className={cn('rv-bar', className)} role="region" aria-label="Actions for the selected questions">
      <span className="rv-bar-count">
        <strong>{selected.length.toLocaleString('en')} selected</strong>
        <Button size="sm" variant="ghost" icon aria-label="Clear the selection" onClick={onClear}>
          <X aria-hidden="true" />
        </Button>
      </span>
      <span className="rv-bar-actions">
        {plans.map(({ action, plan }) => (
          <Button key={action} size="sm" variant={main?.action === action ? 'primary' : 'plain'} disabled={plan.ok.length === 0 || busy} onClick={() => onAction(action, plan.ok.map((q) => q.id))} title={plan.skipped.length ? `Left out: ${plan.skipped.map((s) => s.why).join(' ')}` : undefined}>
            {ACTIONS[action].label} {plan.ok.length}
            {plan.ok.length < selected.length ? ` of ${selected.length}` : ''}
          </Button>
        ))}
      </span>
      {main && left.size > 0 && (
        <p className="rv-bar-left" role="status">
          {ACTIONS[main.action].label} leaves out {main.plan.skipped.length}: {[...left].map(([why, n]) => (n > 1 ? `${n} × ${why}` : why)).join(' ')}
        </p>
      )}
    </div>
  )
}
