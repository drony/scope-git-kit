import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { useNow } from '@/kit/hooks/useNow'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { PackBuilder } from '@/contest/components/PackBuilder'
import { PackCoverage } from '@/contest/components/PackCoverage'
import { PackDiffList } from '@/contest/components/PackDiffList'
import { PackHistory } from '@/contest/components/PackHistory'
import { PackStatus } from '@/contest/components/PackStatus'
import { TopicManager } from '@/contest/components/TopicManager'
import type { ContentPack, Topic } from '@/contest/data/types'
import { useAnswerKeys, usePacks, useProgram, useQuestions } from '@/contest/hooks/useContestData'
import { activePack, coverage, diffPack, driftCount, packProblems, topicOf } from '@/contest/lib/packs'
import { stageOf } from '@/contest/lib/review'
import { EDITOR } from '@/apps/contest/data'

/** Content packs: what is being served and how far the bank has moved, coverage by topic, the next pack, the history and the topics. */
export default function Packs() {
  usePageTitle('Packs')
  const toast = useToast()
  const packs = usePacks()
  const questions = useQuestions()
  const program = useProgram()
  const keys = useAnswerKeys((questions.data ?? []).map((q) => q.id))
  const now = useNow(60_000)
  const [selected, setSelected] = useState<string[] | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const builder = useRef<HTMLDivElement>(null)

  const snap = packs.data
  const bank = useMemo(() => questions.data ?? [], [questions.data])
  const keyMap = useMemo(() => keys.data ?? {}, [keys.data])
  const active = snap ? activePack(snap.packs) : undefined
  const topics = useMemo(() => snap?.topics ?? [], [snap])

  // the builder starts from the topics of the pack in force that can still be served
  useEffect(() => {
    if (snap && selected === null) setSelected((active?.topics ?? []).filter((id) => topics.find((t) => t.id === id && !t.archived)))
  }, [snap, selected, active, topics])

  if (!snap || !program.data || !questions.data || !keys.data || selected === null) return <Skeleton height="20rem" radius="0.75rem" />

  const rows = coverage(topics, bank, keyMap, active, program.data)
  const diff = active ? diffPack(active, bank, keyMap, topics) : undefined
  const problems = packProblems(selected, bank, keyMap, topics, program.data, active)
  const counts: Record<string, number> = {}
  for (const q of bank) {
    const t = topicOf(q, topics)
    if (t && stageOf(q) === 'approved') counts[t.id] = (counts[t.id] ?? 0) + 1
  }
  const fail = (title: string) => (e: unknown) => toast.push({ tone: 'error', title, description: e instanceof Error ? e.message : undefined })

  const publish = async () => {
    setBusy(true)
    try {
      const res = await packs.publish({ topics: selected, note }, EDITOR)
      toast.push({ tone: 'success', title: `Published revision ${activePack(res.packs)!.revision}`, description: 'Shows that have begun keep their pack.', key: 'pack-published' })
      setNote('')
    } catch (e) {
      fail('Could not publish')(e)
    } finally {
      setBusy(false)
    }
  }
  const restore = async (pack: ContentPack) => {
    setBusy(true)
    try {
      const res = await packs.restore(pack.id, `Back to revision ${pack.revision}.`, EDITOR)
      toast.push({ tone: 'success', title: `Restored as revision ${activePack(res.packs)!.revision}`, key: 'pack-restored' })
    } catch (e) {
      fail('Could not restore')(e)
    } finally {
      setBusy(false)
    }
  }
  const saveTopic = (topic: Topic) => {
    setBusy(true)
    packs
      .saveTopic(topic, EDITOR)
      .catch(fail('Could not save the topic'))
      .finally(() => setBusy(false))
  }

  return (
    <div className="pkg">
      <PackStatus pack={active} diff={diff} now={now} onPublish={() => builder.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      <div className="pkg-grid">
        <div className="pkg-main">
          <Card>
            <CardHead title="Coverage by topic" />
            <PackCoverage rows={rows} />
          </Card>
          {diff && driftCount(diff) > 0 && (
            <Card>
              <CardHead title={`Since revision ${active!.revision}`} />
              <PackDiffList diff={diff} />
            </Card>
          )}
          <Card>
            <CardHead title="Packs" />
            <PackHistory packs={snap.packs} now={now} onRestore={(p) => void restore(p)} />
          </Card>
        </div>
        <aside className="pkg-side">
          <div ref={builder}>
            <Card>
              <CardHead title="Next pack" />
              <PackBuilder topics={topics} rows={rows} selected={selected} onSelectedChange={setSelected} problems={problems} note={note} onNoteChange={setNote} nextRevision={Math.max(0, ...snap.packs.map((p) => p.revision)) + 1} onPublish={() => void publish()} busy={busy} />
            </Card>
          </div>
          <Card>
            <CardHead title="Topics" />
            <TopicManager topics={topics} counts={counts} onSave={saveTopic} busy={busy} />
          </Card>
        </aside>
      </div>
    </div>
  )
}
