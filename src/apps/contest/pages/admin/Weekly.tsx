import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Radio } from 'lucide-react'
import { Modal } from '@/kit/components/overlays/Modal'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Tabs } from '@/kit/components/nav/Tabs'
import { Button } from '@/kit/components/ui/Button'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { EmptyState, Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { DifficultyCalibration } from '@/contest/components/DifficultyCalibration'
import { EpisodeBuilder } from '@/contest/components/EpisodeBuilder'
import { EpisodeCard } from '@/contest/components/EpisodeCard'
import { QuestionPicker } from '@/contest/components/QuestionPicker'
import { ReminderPlanner } from '@/contest/components/ReminderPlanner'
import { RunOfShow } from '@/contest/components/RunOfShow'
import type { Episode, Id } from '@/contest/data/types'
import Program from './Program'
import { useAnswerKeys, useEpisodes, useLive, usePacks, useQuestions, useSurveys } from '@/contest/hooks/useContestData'
import { episodeChecks, suggestEpisode } from '@/contest/lib/episode'
import { activePack } from '@/contest/lib/packs'
import { DEFAULT_REMINDERS } from '@/contest/lib/reminders'
import { questionStats } from '@/contest/lib/stats'

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

export default function Weekly() {
  usePageTitle('Weekly live')
  const toast = useToast()
  const navigate = useNavigate()
  const episodes = useEpisodes()
  const questions = useQuestions()
  const surveys = useSurveys()
  const packs = usePacks()
  const live = useLive(1500)
  const keys = useAnswerKeys((questions.data ?? []).map((q) => q.id))
  const [view, setView] = useState<'shows' | 'program' | 'calibration'>('shows')
  const [openId, setOpenId] = useState<Id | null>(null)
  const [draft, setDraft] = useState<Episode | null>(null)
  const [picking, setPicking] = useState(false)
  const [tab, setTab] = useState<'lineup' | 'reminders'>('lineup')

  const list = useMemo(() => [...(episodes.data ?? [])].sort((a, b) => b.number - a.number), [episodes.data])
  const bank = useMemo(() => questions.data ?? [], [questions.data])
  const stats = useMemo(() => questionStats(bank, episodes.data ?? []), [bank, episodes.data])
  const keyMap = keys.data ?? {}
  const saved = list.find((e) => e.id === openId)
  const dirty = Boolean(draft) && !same(draft, saved)
  const inForce = packs.data ? activePack(packs.data.packs) : undefined
  const pack = useMemo(() => (inForce ? { ids: new Set(inForce.items.map((i) => i.questionId)), revision: inForce.revision } : undefined), [inForce])
  const checks = draft ? episodeChecks(draft, bank, keyMap, pack) : []
  const fail = (title: string) => (e: unknown) => toast.push({ tone: 'error', title, description: e instanceof Error ? e.message : undefined })

  const open = (e: Episode) => {
    setOpenId(e.id)
    setDraft(structuredClone(e))
  }
  const startNew = () => {
    const n = Math.max(0, ...list.map((e) => e.number)) + 1
    const last = list[0] ? new Date(list[0].startsAt) : new Date()
    const start = new Date(last.getTime() + 7 * 86_400_000)
    start.setHours(19, 0, 0, 0)
    open({ id: `ep${n}`, number: n, title: `Weekly Live #${n}`, startsAt: start.toISOString(), slotMin: 20, status: 'draft', slots: [], reminders: DEFAULT_REMINDERS.map((r, i) => ({ ...r, id: `ep${n}-r${i + 1}` })), surveyId: surveys.data?.find((s) => s.kind === 'pulse')?.id })
  }
  const add = (qid: Id) => draft && setDraft({ ...draft, slots: [...draft.slots, { id: `s-${qid}-${draft.slots.length}`, kind: 'question', questionId: qid }] })
  const save = async (status?: Episode['status']) => {
    if (!draft) return
    try {
      const next = status ? { ...draft, status } : draft
      await episodes.save(next)
      setDraft(next)
      toast.push({ tone: 'success', title: status === 'scheduled' ? 'Show scheduled' : 'Show saved', key: 'ep-saved' })
    } catch (e) {
      fail('Could not save')(e)
    }
  }
  const goLive = async () => {
    if (!draft) return
    try {
      await episodes.save(draft)
      await live.send({ type: 'open-lobby', episodeId: draft.id })
      navigate('/admin/host')
    } catch (e) {
      fail('Could not open the lobby')(e)
    }
  }

  if (!episodes.data || !questions.data) return <Skeleton height="16rem" radius="0.75rem" />

  return (
    <div className="wk">
      <Segmented<'shows' | 'program' | 'calibration'>
        ariaLabel="Weekly live"
        value={view}
        onChange={setView}
        options={[
          { value: 'shows', label: 'Shows' },
          { value: 'program', label: 'Program' },
          { value: 'calibration', label: 'Question levels' },
        ]}
      />
      {view === 'program' ? (
        <Program />
      ) : view === 'calibration' ? (
        <Card>
          <CardHead title="Question levels: written against real" />
          <DifficultyCalibration questions={bank} stats={stats} onApply={() => toast.push({ tone: 'info', title: 'Change the level in the question editor', description: 'Open the question under Questions and pick its new level.' })} />
        </Card>
      ) : (
        <div className="wk-grid">
          <aside className="wk-list" aria-label="Shows">
            <Button onClick={startNew}>
              <CalendarPlus aria-hidden="true" /> Plan a show
            </Button>
            {list.map((e) => (
              <EpisodeCard key={e.id} episode={e} questions={bank} selected={openId === e.id} onOpen={open} />
            ))}
          </aside>
          <section className="wk-main">
            {draft ? (
              <Card>
                <CardHead
                  title={draft.title}
                  actions={
                    <>
                      <Button variant="plain" size="sm" disabled={!dirty} onClick={() => saved && open(saved)}>
                        Discard
                      </Button>
                      <Button variant="plain" size="sm" disabled={!dirty} onClick={() => void save()}>
                        Save
                      </Button>
                      {draft.status === 'draft' && (
                        <Button size="sm" disabled={checks.some((c) => c.level === 'error') || draft.slots.length === 0} onClick={() => void save('scheduled')}>
                          Schedule it
                        </Button>
                      )}
                      {draft.status === 'scheduled' && (
                        <Button size="sm" disabled={Boolean(live.data)} onClick={() => void goLive()}>
                          <Radio aria-hidden="true" /> Open the lobby
                        </Button>
                      )}
                    </>
                  }
                />
                <Tabs
                  ariaLabel="Show"
                  value={tab}
                  onChange={(t) => setTab(t as 'lineup' | 'reminders')}
                  items={[
                    { id: 'lineup', label: 'Line-up' },
                    { id: 'reminders', label: 'Reminders', count: draft.reminders.length },
                  ]}
                  panels={{
                    lineup: (
                      <div className="wk-two">
                        <EpisodeBuilder
                          episode={draft}
                          onChange={setDraft}
                          questions={bank}
                          keys={keyMap}
                          stats={stats}
                          polls={(surveys.data ?? []).filter((s) => s.kind === 'custom')}
                          pack={pack}
                          onAddQuestions={() => setPicking(true)}
                          onSuggest={() => setDraft({ ...draft, slots: [...suggestEpisode(bank, keyMap, stats), ...draft.slots.filter((s) => s.kind === 'poll')] })}
                        />
                        <div className="wk-side">
                          <h4>Run of show</h4>
                          <RunOfShow episode={draft} questions={bank} />
                        </div>
                      </div>
                    ),
                    reminders: <ReminderPlanner episode={draft} onChange={setDraft} />,
                  }}
                />
              </Card>
            ) : (
              <Card>
                <EmptyState icon={<CalendarPlus size={20} aria-hidden="true" />} title="Pick a show, or plan the next one">
                  Choose the questions, watch the difficulty curve and the clock, and fix what the checks flag before it goes on air.
                </EmptyState>
              </Card>
            )}
          </section>
        </div>
      )}

      <Modal open={picking} onClose={() => setPicking(false)} size="lg" title="Choose questions" description="Add as many as you need. The show updates behind this window.">
        {draft && <QuestionPicker questions={bank} keys={keyMap} stats={stats} picked={draft.slots.flatMap((s) => (s.kind === 'question' ? [s.questionId] : []))} onAdd={(q) => add(q.id)} onRemove={(q) => setDraft({ ...draft, slots: draft.slots.filter((s) => !(s.kind === 'question' && s.questionId === q.id)) })} />}
      </Modal>
    </div>
  )
}
