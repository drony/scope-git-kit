import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/kit/components/ui/Card'
import { Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { useNow } from '@/kit/hooks/useNow'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { ReviewBar } from '@/contest/components/ReviewBar'
import { ReviewPanel } from '@/contest/components/ReviewPanel'
import { ReviewQueue } from '@/contest/components/ReviewQueue'
import { ReviewRail } from '@/contest/components/ReviewRail'
import { ReviewReasonDialog } from '@/contest/components/ReviewReasonDialog'
import type { Id, Question, ReviewAction } from '@/contest/data/types'
import { useAnswerKeys, useQuestions } from '@/contest/hooks/useContestData'
import { ACTIONS, DEFAULT_POLICY, inView, reviewCounts, reviewOf, type ReviewView } from '@/contest/lib/review'
import { EDITOR } from '@/apps/contest/data'

const EMPTY: Record<ReviewView, string> = {
  mine: 'Nothing waits for you. Questions you wrote, and ones you already pre-approved, wait for someone else.',
  all: 'The bank is empty.',
  draft: 'No drafts.',
  pending: 'No question waits for a first reviewer.',
  preapproved: 'No question waits for a second reviewer.',
  approved: 'No approved question yet.',
  returned: 'No question was returned.',
  trashed: 'The trash is empty.',
  stale: 'Nothing has waited too long.',
}

/** The review of questions: views with counts, the queue, a bulk bar and one question at a time with its history. */
export default function Review() {
  usePageTitle('Review')
  const toast = useToast()
  const questions = useQuestions()
  const list = useMemo(() => questions.data ?? [], [questions.data])
  const keys = useAnswerKeys(list.map((q) => q.id))
  const now = useNow(60_000)
  const [view, setView] = useState<ReviewView>('mine')
  const [selectedId, setSelectedId] = useState<Id | null>(null)
  const [checked, setChecked] = useState<Id[]>([])
  const [asking, setAsking] = useState<{ action: ReviewAction; ids: Id[] } | null>(null)
  const [busy, setBusy] = useState(false)
  /** Where to go when the open question leaves the view: the one that was next to it. */
  const fallback = useRef<Id | null>(null)

  const ctx = useMemo(() => ({ actor: EDITOR, policy: DEFAULT_POLICY, now }), [now])
  const counts = useMemo(() => reviewCounts(list, ctx), [list, ctx])
  const shown = useMemo(() => {
    const items = list.filter((q) => inView(q, view, ctx))
    // what waits goes oldest first, so the longest wait is on top; the rest goes newest first
    const dir = view === 'mine' || view === 'stale' || view === 'pending' || view === 'preapproved' ? 1 : -1
    return items.sort((a, b) => dir * (Date.parse(reviewOf(a).since) - Date.parse(reviewOf(b).since)))
  }, [list, view, ctx])
  const keyMap = keys.data ?? {}
  const selected = list.find((q) => q.id === selectedId)

  // the open question follows the view: it stays if it is in it, else the first one opens
  useEffect(() => {
    if (shown.length === 0) setSelectedId(null)
    else if (!shown.some((q) => q.id === selectedId)) setSelectedId(shown.find((q) => q.id === fallback.current)?.id ?? shown[0].id)
  }, [shown, selectedId])
  useEffect(() => setChecked((c) => c.filter((id) => shown.some((q) => q.id === id))), [shown])

  if (!questions.data || !keys.data) return <Skeleton height="20rem" radius="0.75rem" />

  const run = async (action: ReviewAction, ids: Id[], note?: string) => {
    setBusy(true)
    const at = shown.findIndex((q) => q.id === selectedId)
    const free = (q: Question) => !ids.includes(q.id)
    fallback.current = (shown.slice(at + 1).find(free) ?? shown.slice(0, Math.max(0, at)).reverse().find(free))?.id ?? null
    try {
      const res = await questions.review(ids, action, { note }, EDITOR)
      const skipped = res.skipped.length
      toast.push({
        tone: res.changed.length ? 'success' : 'error',
        title: res.changed.length ? `${ACTIONS[action].past} ${res.changed.length} question${res.changed.length === 1 ? '' : 's'}` : 'Nothing changed',
        description: skipped ? `${skipped} left out: ${res.skipped[0].reason}` : undefined,
        key: 'review-done',
      })
      setChecked([])
    } catch (e) {
      toast.push({ tone: 'error', title: 'Could not save', description: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(false)
      setAsking(null)
    }
  }
  const ask = (action: ReviewAction, ids: Id[]) => (ACTIONS[action].needsNote ? setAsking({ action, ids }) : void run(action, ids))

  const ticked = checked.map((id) => list.find((q) => q.id === id)).filter((q): q is Question => Boolean(q))
  return (
    <div className="rv">
      <p className="rv-note muted">
        You are reviewing as <b>{EDITOR}</b>. Two reviewers see every question: nobody approves their own, and the final approval comes from someone other than the first reviewer.
      </p>
      <div className="rv-grid">
        <ReviewRail counts={counts} value={view} onChange={setView} />
        <div className="rv-mid">
          <ReviewBar selected={ticked} keys={keyMap} actor={EDITOR} onAction={ask} onClear={() => setChecked([])} busy={busy} />
          <ReviewQueue questions={shown} keys={keyMap} selectedId={selectedId} onSelect={(q) => setSelectedId(q.id)} checked={checked} onCheckedChange={setChecked} now={now} empty={EMPTY[view]} />
        </div>
        <aside className="rv-side" aria-label="Question">
          {selected ? (
            <ReviewPanel question={selected} answerKey={keyMap[selected.id]} actor={EDITOR} now={now} busy={busy} onAction={(a) => ask(a, [selected.id])} />
          ) : (
            <Card>
              <p className="muted">Pick a question to read it with its answer and its history.</p>
            </Card>
          )}
        </aside>
      </div>
      <ReviewReasonDialog action={asking?.action ?? null} count={asking?.ids.length ?? 0} busy={busy} onCancel={() => setAsking(null)} onConfirm={(note) => asking && void run(asking.action, asking.ids, note)} />
    </div>
  )
}
