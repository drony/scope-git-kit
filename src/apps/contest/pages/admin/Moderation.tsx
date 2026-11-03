import { useEffect, useMemo, useState } from 'react'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Tag } from '@/kit/components/ui/Badge'
import { Card } from '@/kit/components/ui/Card'
import { Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { useNow } from '@/kit/hooks/useNow'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { CasePanel } from '@/contest/components/CasePanel'
import { CaseQueue, type CaseItem } from '@/contest/components/CaseQueue'
import { ReportLog } from '@/contest/components/ReportLog'
import { ViolationHistory } from '@/contest/components/ViolationHistory'
import type { Report } from '@/contest/data/types'
import { useAnswerKeys, useModeration, useParticipants, useQuestions, useSubmissions } from '@/contest/hooks/useContestData'
import { ACTIONS, activeSuspension, byPriority, groupReports, playerSignals, priorityOf, questionSignals } from '@/contest/lib/moderation'
import { describeKey, typeInfo } from '@/contest/lib/questionTypes'
import { EDITOR } from '@/apps/contest/data'

type View = 'queue' | 'handled' | 'people'
type Filter = 'all' | 'mine' | 'unclaimed' | 'overdue'

/** Moderation: the open cases most urgent first, one case at a time with its reports, evidence and decision, what was decided, and the record of each player. */
export default function Moderation() {
  usePageTitle('Moderation')
  const toast = useToast()
  const moderation = useModeration()
  const people = useParticipants()
  const questions = useQuestions()
  const submissions = useSubmissions()
  const now = useNow(60_000)
  const reportedQuestions = useMemo(() => [...new Set((moderation.data?.reports ?? []).filter((r) => r.kind === 'question').map((r) => r.targetId))], [moderation.data])
  const keys = useAnswerKeys(reportedQuestions)
  const [view, setView] = useState<View>('queue')
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const snapshot = moderation.data
  const nameOf = (r: Pick<Report, 'kind' | 'targetId'>) => (r.kind === 'player' ? (people.data?.find((p) => p.id === r.targetId)?.name ?? r.targetId) : (questions.data?.find((q) => q.id === r.targetId)?.prompt ?? r.targetId))
  const personName = (id: string) => people.data?.find((p) => p.id === id)?.name ?? id

  const items = useMemo<CaseItem[]>(() => {
    if (!snapshot || !people.data || !questions.data || !submissions.data) return []
    return groupReports(snapshot.reports)
      .map((c) => {
        const q = c.kind === 'question' ? questions.data!.find((x) => x.id === c.targetId) : undefined
        const p = c.kind === 'player' ? people.data!.find((x) => x.id === c.targetId) : undefined
        const signals = c.kind === 'player' ? playerSignals(c.targetId, submissions.data!, people.data!) : questionSignals(q, submissions.data!)
        return { case: c, priority: priorityOf(c, { reports: snapshot.reports, violations: snapshot.violations, signals, now }), title: p?.name ?? q?.prompt ?? c.targetId, detail: p ? [p.team, p.status].filter(Boolean).join(' · ') : q ? typeInfo(q.type).label : undefined, signals }
      })
      .sort(byPriority)
  }, [snapshot, people.data, questions.data, submissions.data, now])

  const counts = {
    all: items.length,
    mine: items.filter((i) => snapshot?.claims[i.case.key]?.by === EDITOR).length,
    unclaimed: items.filter((i) => !snapshot?.claims[i.case.key]).length,
    overdue: items.filter((i) => i.priority.overdue).length,
  }
  const shown = items.filter((i) => (filter === 'mine' ? snapshot?.claims[i.case.key]?.by === EDITOR : filter === 'unclaimed' ? !snapshot?.claims[i.case.key] : filter === 'overdue' ? i.priority.overdue : true))
  const selected = shown.find((i) => i.case.key === selectedKey)

  useEffect(() => {
    if (shown.length && !shown.some((i) => i.case.key === selectedKey)) setSelectedKey(shown[0].case.key)
    if (!shown.length) setSelectedKey(null)
  }, [shown, selectedKey])

  if (!snapshot || !people.data || !questions.data || !submissions.data) return <Skeleton height="20rem" radius="0.75rem" />

  const fail = (title: string) => (e: unknown) => toast.push({ tone: 'error', title, description: e instanceof Error ? e.message : undefined })
  const handled = snapshot.reports.filter((r) => r.resolution)
  const byPlayer = new Map<string, typeof snapshot.violations>()
  for (const v of snapshot.violations) byPlayer.set(v.participantId, [...(byPlayer.get(v.participantId) ?? []), v])
  const strikes = [...byPlayer.entries()].sort((a, b) => b[1].length - a[1].length)

  return (
    <div className="mq">
      <Segmented<View>
        ariaLabel="Moderation"
        value={view}
        onChange={setView}
        options={[
          { value: 'queue', label: `Queue ${items.length}` },
          { value: 'handled', label: `Handled ${new Set(handled.map((r) => `${r.targetId}|${r.resolution!.at}`)).size}` },
          { value: 'people', label: `Violations ${byPlayer.size}` },
        ]}
      />

      {view === 'queue' && (
        <div className="mq-grid">
          <div className="mq-list">
            <Segmented<Filter>
              ariaLabel="Show"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: `All ${counts.all}` },
                { value: 'mine', label: `Mine ${counts.mine}` },
                { value: 'unclaimed', label: `Free ${counts.unclaimed}` },
                { value: 'overdue', label: `Overdue ${counts.overdue}` },
              ]}
            />
            <CaseQueue items={shown} claims={snapshot.claims} selectedKey={selectedKey} onSelect={setSelectedKey} now={now} actor={EDITOR} empty={filter === 'all' ? 'No open cases. Nothing waits for a decision.' : 'No case in this view.'} />
          </div>
          <aside className="mq-side" aria-label="Case">
            {selected ? (
              <CasePanel
                case={selected.case}
                targetName={selected.title}
                preview={
                  selected.case.kind === 'question' ? (
                    <div className="mq-qprev">
                      <strong>{selected.title}</strong>
                      <span>{describeKey(questions.data.find((q) => q.id === selected.case.targetId)!, keys.data?.[selected.case.targetId])}</span>
                    </div>
                  ) : undefined
                }
                priority={selected.priority}
                signals={selected.case.kind === 'player' ? playerSignals(selected.case.targetId, submissions.data, people.data) : questionSignals(questions.data.find((q) => q.id === selected.case.targetId), submissions.data)}
                reports={snapshot.reports}
                violations={snapshot.violations}
                reporterName={personName}
                claim={snapshot.claims[selected.case.key]}
                actor={EDITOR}
                now={now}
                busy={busy}
                onClaim={() => void moderation.claim(selected.case.key, EDITOR).catch(fail('Could not take the case'))}
                onRelease={() => void moderation.release(selected.case.key, EDITOR).catch(fail('Could not release the case'))}
                onResolve={(decision) => {
                  setBusy(true)
                  moderation
                    .resolve(selected.case.key, decision, EDITOR)
                    .then((res) => toast.push({ tone: 'success', title: `${ACTIONS[decision.action].past}${decision.action === 'withdraw' ? '' : `: ${selected.title}`}`, description: `${res.resolved.length} report${res.resolved.length === 1 ? '' : 's'} closed.`, key: 'case-done' }))
                    .catch(fail('Could not save the decision'))
                    .finally(() => setBusy(false))
                }}
              />
            ) : (
              <Card>
                <p className="muted">Pick a case to read the reports, see the evidence and decide.</p>
              </Card>
            )}
          </aside>
        </div>
      )}

      {view === 'handled' && <ReportLog reports={handled} targetName={nameOf} reporterName={personName} now={now} />}

      {view === 'people' && (
        <div className="mq-people">
          {strikes.length === 0 && <p className="mq-empty">Nobody has a violation on record.</p>}
          {strikes.map(([id, list]) => {
            const person = people.data!.find((p) => p.id === id)
            const running = activeSuspension(id, list, now)
            return (
              <Card key={id}>
                <div className="mq-person">
                  <strong>{person?.name ?? id}</strong>
                  {person && <span className="muted">{person.team}</span>}
                  {person?.status === 'disqualified' && <Tag tone="error">disqualified</Tag>}
                  {running && <Tag tone="accent">suspended</Tag>}
                </div>
                <ViolationHistory violations={list} now={now} />
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
