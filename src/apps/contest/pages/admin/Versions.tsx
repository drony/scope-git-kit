import { useMemo, useState } from 'react'
import { Switch } from '@/kit/components/forms/Controls'
import { Field, Input, Textarea } from '@/kit/components/forms/Field'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Tag } from '@/kit/components/ui/Badge'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { Alert, Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { useNow } from '@/kit/hooks/useNow'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { BuildLadder } from '@/contest/components/BuildLadder'
import { GateImpact } from '@/contest/components/GateImpact'
import { GateSimulator } from '@/contest/components/GateSimulator'
import { StoreGateEditor } from '@/contest/components/StoreGateEditor'
import type { StoreId, VersionGate } from '@/contest/data/types'
import { useGate, useProgram } from '@/contest/hooks/useContestData'
import { STORES, gateProblems, percent, stopped, storeName, usageImpact, type ShowWindow } from '@/contest/lib/gate'
import { occurrences } from '@/contest/lib/program'
import { EDITOR } from '@/apps/contest/data'

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const pad = (n: number) => String(n).padStart(2, '0')
const toLocal = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const when = (iso: string) => new Date(iso).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

/** The version gate: who plays on which build, the rule for each store, the words players see, and the review before a save. */
export default function Versions() {
  usePageTitle('Versions')
  const toast = useToast()
  const gate = useGate()
  const program = useProgram()
  const now = useNow(30_000)
  const [draft, setDraft] = useState<VersionGate | null>(null)
  const [store, setStore] = useState<StoreId>('app-store')
  const [sim, setSim] = useState<{ store: StoreId; build: number }>({ store: 'app-store', build: 381 })
  const [saving, setSaving] = useState(false)

  const snap = gate.data
  const base = snap ? (snap.next ?? snap.current) : undefined
  const current = draft ?? base
  const dirty = Boolean(draft && base && !same(draft, base))
  const shows = useMemo<ShowWindow[]>(() => (program.data ? occurrences(program.data, now, 3).map((o) => ({ title: `the ${o.slot.topic} show (${o.slot.time})`, at: o.at, endsAt: o.endsAt })) : []), [program.data, now])

  if (!snap || !base || !current) return <Skeleton height="20rem" radius="0.75rem" />

  const rule = current.stores.find((g) => g.store === store)!
  const problems = gateProblems(current, snap.usage)
  const edit = (patch: Partial<VersionGate>) => setDraft({ ...current, ...patch })
  const patchStore = (g: typeof rule) => edit({ stores: current.stores.map((s) => (s.store === g.store ? g : s)) })
  const save = async (confirmed: boolean) => {
    if (!draft) return
    setSaving(true)
    try {
      const res = await gate.save(draft, { confirmed }, EDITOR)
      setDraft(null)
      toast.push({ tone: 'success', title: res.next ? `Scheduled as revision ${res.next.revision}` : `Saved as revision ${res.current.revision}`, key: 'gate-saved' })
    } catch (e) {
      toast.push({ tone: 'error', title: 'Could not save the gate', description: e instanceof Error ? e.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="vg">
      <p className="muted vg-note">
        Revision {snap.current.revision} is in force{snap.current.savedBy ? `, saved by ${snap.current.savedBy}` : ''}. Build numbers only grow: an older build is a lower number.
      </p>
      {snap.next && (
        <Alert tone="info" title={`Revision ${snap.next.revision} starts ${when(snap.next.effectiveAt!)}`}>
          It replaces the one in force. You are editing it below.
        </Alert>
      )}

      <Segmented<StoreId>
        ariaLabel="Store"
        value={store}
        onChange={(s) => {
          setStore(s)
          setSim((x) => ({ ...x, store: s }))
        }}
        options={STORES.map((s) => {
          const g = current.stores.find((x) => x.store === s.id)!
          const i = usageImpact(g, snap.usage)
          return { value: s.id, label: `${s.label} · ${percent(stopped(i), i.total)}% stopped` }
        })}
      />

      <div className="vg-grid">
        <div className="vg-main">
          <Card>
            <CardHead title={`${storeName(store)}: players by build`} />
            <BuildLadder gate={rule} usage={snap.usage} highlight={sim.store === store ? sim.build : undefined} />
          </Card>
          <Card>
            <CardHead title={`Rule for ${storeName(store)}`} />
            <StoreGateEditor gate={rule} onChange={patchStore} problems={problems.filter((p) => p.store === store)} />
          </Card>
          <Card>
            <CardHead title="For every store" />
            <div className="vg-all">
              <Field label="Message" hint="Shown on the update screen, above the Update button." error={current.message.trim() ? undefined : 'Write the message players see.'}>
                <Textarea rows={3} value={current.message} onChange={(e) => edit({ message: e.target.value })} />
              </Field>
              <Field label="Starts at" hint="Leave empty to apply at once. A show that is on air is not interrupted: the rule applies at the next join.">
                <Input type="datetime-local" value={toLocal(current.effectiveAt)} disabled={current.emergency} onChange={(e) => edit({ effectiveAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
              </Field>
              <Switch checked={current.emergency} onChange={(emergency) => edit({ emergency, effectiveAt: emergency ? undefined : current.effectiveAt })} label="Emergency" description="Applies at once and also takes people who are playing now out of the show." />
            </div>
          </Card>
        </div>
        <aside className="vg-side">
          <Card>
            <CardHead
              title="What would a player see?"
              actions={dirty ? <Tag tone="warning">with your edits</Tag> : undefined}
            />
            <GateSimulator gate={current} store={sim.store} build={sim.build} usage={snap.usage} onChange={(v) => { setSim(v); setStore(v.store) }} />
          </Card>
        </aside>
      </div>

      {dirty && draft && <GateImpact prev={snap.current} next={draft} usage={snap.usage} now={now} shows={shows} saving={saving} onSave={(c) => void save(c)} onDiscard={() => setDraft(null)} />}
    </div>
  )
}
