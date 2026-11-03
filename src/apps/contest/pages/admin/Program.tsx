import { useMemo, useState } from 'react'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { useNow } from '@/kit/hooks/useNow'
import { ProgramBoard } from '@/contest/components/ProgramBoard'
import { ProgramChecks } from '@/contest/components/ProgramChecks'
import { ProgramImpact } from '@/contest/components/ProgramImpact'
import { QualificationFlow } from '@/contest/components/QualificationFlow'
import { SlotEditor } from '@/contest/components/SlotEditor'
import { UpcomingShows } from '@/contest/components/UpcomingShows'
import type { Id, ProgramSlot, WeeklyProgram } from '@/contest/data/types'
import { useEpisodes, useProgram, useQuestions, useRegistrations } from '@/contest/hooks/useContestData'
import { newSlot, registeredFor } from '@/contest/lib/program'
import { zonedDate } from '@/contest/lib/zoned'

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** The weekly program: the board, the editor of the show that is selected, the seats flow, the checks and the review before a save. */
export default function Program() {
  const toast = useToast()
  const program = useProgram()
  const registrations = useRegistrations(4000)
  const episodes = useEpisodes()
  const questions = useQuestions()
  const now = useNow(1000)
  const [draft, setDraft] = useState<WeeklyProgram | null>(null)
  const [selectedId, setSelectedId] = useState<Id | null>(null)
  const [saving, setSaving] = useState(false)

  const saved = program.data
  const current = draft ?? saved
  const reg = registrations.data ?? {}
  const dirty = Boolean(draft && saved && !same(draft, saved))
  const topics = useMemo(() => [...new Set([...(questions.data ?? []).flatMap((q) => q.tags), 'general'])].sort(), [questions.data])
  const selected = current?.slots.find((s) => s.id === selectedId)

  if (!saved || !current) return <Skeleton height="16rem" radius="0.75rem" />

  const edit = (next: WeeklyProgram) => setDraft(next)
  const patchSlot = (slot: ProgramSlot) => edit({ ...current, slots: current.slots.map((s) => (s.id === slot.id ? slot : s)) })
  const add = (weekday: ProgramSlot['weekday']) => {
    const slot = newSlot(current, weekday)
    edit({ ...current, slots: [...current.slots, slot] })
    setSelectedId(slot.id)
  }
  const remove = (id: Id) => {
    edit({ ...current, slots: current.slots.filter((s) => s.id !== id) })
    setSelectedId(null)
  }
  const save = async (confirmed: boolean) => {
    if (!draft) return
    setSaving(true)
    try {
      const next = await program.save(draft, { confirmed })
      setDraft(null)
      toast.push({ tone: 'success', title: `Program saved as revision ${next.revision}`, key: 'program-saved' })
    } catch (e) {
      toast.push({ tone: 'error', title: 'Could not save the program', description: e instanceof Error ? e.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  const registeredNext = selected ? registeredFor(saved, selected.id, reg, now).total : 0
  const lineup = (o: { date: string; slot: ProgramSlot }) => {
    if (o.slot.kind === 'final') return undefined
    const ep = (episodes.data ?? []).find((e) => zonedDate(Date.parse(e.startsAt), saved.timezone) === o.date)
    if (!ep) return { label: 'No line-up', tone: 'warning' as const }
    return ep.status === 'draft' ? { label: 'Line-up draft', tone: 'warning' as const } : { label: 'Line-up ready', tone: 'success' as const }
  }

  return (
    <div className="wk-program">
      <Card>
        <CardHead title="Next shows" />
        <UpcomingShows program={saved} registrations={reg} now={now} limit={4} lineup={lineup} />
      </Card>
      <Card>
        <CardHead title="Weekly program" />
        <p className="muted wk-program-note">
          Revision {saved.revision}
          {saved.savedBy ? ` · saved by ${saved.savedBy}` : ''} · times in {saved.timezone}
        </p>
        <ProgramBoard program={current} registrations={reg} now={now} selectedId={selectedId ?? undefined} onSelect={(s) => setSelectedId(s.id === selectedId ? null : s.id)} onAdd={add} />
      </Card>
      {dirty && draft && <ProgramImpact prev={saved} next={draft} registrations={reg} now={now} saving={saving} onSave={(c) => void save(c)} onDiscard={() => setDraft(null)} />}
      <div className="wk-program-two">
        <Card>
          <CardHead title={selected ? `Edit ${selected.kind === 'final' ? 'the final' : 'the show'}` : 'Edit a show'} />
          {selected ? (
            <SlotEditor slot={selected} topics={topics} registered={registeredNext} onChange={patchSlot} onRemove={() => remove(selected.id)} />
          ) : (
            <p className="muted">Pick a show on the board to change it, or press Add on an empty day.</p>
          )}
        </Card>
        <div className="wk-program-side">
          <Card>
            <CardHead title="Road to the final" />
            <QualificationFlow program={current} />
          </Card>
          <Card>
            <CardHead title="Checks" />
            <ProgramChecks program={current} onSelect={setSelectedId} />
          </Card>
        </div>
      </div>
    </div>
  )
}
