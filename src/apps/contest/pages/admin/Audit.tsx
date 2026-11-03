import { Download } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/kit/components/overlays/Modal'
import { Button } from '@/kit/components/ui/Button'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { useNow } from '@/kit/hooks/useNow'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { AuditActivity } from '@/contest/components/AuditActivity'
import { AuditEntryPanel } from '@/contest/components/AuditEntryPanel'
import { AuditFeed } from '@/contest/components/AuditFeed'
import { AuditFilters } from '@/contest/components/AuditFilters'
import type { AuditEntry, Id } from '@/contest/data/types'
import { useAudit } from '@/contest/hooks/useContestData'
import { EMPTY_FILTER, activityByDay, actorsOf, auditToCsv, filterAudit, laterChanges, sensitivity, type AuditFilter } from '@/contest/lib/audit'
import { EDITOR } from '@/apps/contest/data'

/** The audit trail: changes per day, filters, the list of changes, one change in full with its diff, and revert. */
export default function Audit() {
  usePageTitle('Audit')
  const toast = useToast()
  const audit = useAudit()
  const now = useNow(60_000)
  const [filter, setFilter] = useState<AuditFilter>(EMPTY_FILTER)
  const [selectedId, setSelectedId] = useState<Id | null>(null)
  const [asking, setAsking] = useState<AuditEntry | null>(null)
  const [busy, setBusy] = useState(false)

  const entries = useMemo(() => audit.data ?? [], [audit.data])
  const shown = useMemo(() => filterAudit(entries, filter, now), [entries, filter, now])
  const activity = useMemo(() => activityByDay(entries, 14, now), [entries, now])
  const selected = shown.find((e) => e.id === selectedId) ?? entries.find((e) => e.id === selectedId)

  useEffect(() => {
    if (shown.length && !selectedId) setSelectedId(shown[0].id)
  }, [shown, selectedId])

  if (!audit.data) return <Skeleton height="20rem" radius="0.75rem" />

  const today = activity[activity.length - 1]
  const risky = entries.filter((e) => sensitivity(e)).length
  const revert = async () => {
    if (!asking) return
    setBusy(true)
    try {
      await audit.revert(asking.id, EDITOR)
      toast.push({ tone: 'success', title: 'Reverted', description: `${asking.summary}`, key: 'audit-reverted' })
      setAsking(null)
    } catch (e) {
      toast.push({ tone: 'error', title: 'Could not revert', description: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(false)
    }
  }
  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([auditToCsv(shown)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-trail.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.push({ tone: 'info', title: `Exported ${shown.length} change${shown.length === 1 ? '' : 's'}`, key: 'audit-exported' })
  }
  const later = asking ? laterChanges(asking, entries).length : 0

  return (
    <div className="adp">
      <div className="adp-top">
        <Card>
          <CardHead title="Last 14 days" />
          <AuditActivity days={activity} selected={filter.day} onSelect={(day) => setFilter({ ...filter, day, since: 'all' })} />
        </Card>
        <Card>
          <CardHead title="In the trail" />
          <dl className="adp-stats">
            <div>
              <dt>Changes</dt>
              <dd>{entries.length}</dd>
            </div>
            <div>
              <dt>Today</dt>
              <dd>{today?.count ?? 0}</dd>
            </div>
            <div>
              <dt>Sensitive</dt>
              <dd>{risky}</dd>
            </div>
            <div>
              <dt>People</dt>
              <dd>{actorsOf(entries).length}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card>
        <CardHead
          title="Filters"
          actions={
            <Button size="sm" variant="plain" onClick={exportCsv} disabled={shown.length === 0}>
              <Download aria-hidden="true" /> Export {shown.length}
            </Button>
          }
        />
        <AuditFilters value={filter} onChange={setFilter} actors={actorsOf(entries)} total={entries.length} shown={shown.length} />
      </Card>

      <div className="adp-grid">
        <AuditFeed entries={shown} all={entries} selectedId={selectedId} onSelect={setSelectedId} now={now} />
        <aside className="adp-side" aria-label="Change">
          {selected ? <AuditEntryPanel entry={selected} entries={entries} now={now} busy={busy} onSelect={setSelectedId} onRevert={setAsking} /> : <Card><p className="muted">Pick a change to read what it did.</p></Card>}
        </aside>
      </div>

      <Modal
        open={Boolean(asking)}
        onClose={() => setAsking(null)}
        title="Revert this change?"
        description={asking?.summary}
        actions={
          <>
            <Button variant="plain" onClick={() => setAsking(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={() => void revert()}>
              Revert
            </Button>
          </>
        }
      >
        <p className="adp-ask">
          The thing goes back to the way it was before this change. The revert is written to the trail as a new entry by {EDITOR}.
          {later > 0 && <strong> {later} later change{later === 1 ? '' : 's'} to it will be undone too.</strong>}
        </p>
      </Modal>
    </div>
  )
}
