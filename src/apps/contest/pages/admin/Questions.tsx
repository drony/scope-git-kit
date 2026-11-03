import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Eye, FileUp, Plus, Search, Trash2, TriangleAlert } from 'lucide-react'
import { Input } from '@/kit/components/forms/Field'
import { Drawer } from '@/kit/components/overlays/Drawer'
import { Modal } from '@/kit/components/overlays/Modal'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Button } from '@/kit/components/ui/Button'
import { Card } from '@/kit/components/ui/Card'
import { EmptyState, Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { cn } from '@/kit/lib/cn'
import { DifficultyMeter } from '@/contest/components/DifficultyMeter'
import { MediaPicker } from '@/contest/components/MediaPicker'
import { QuestionBank } from '@/contest/components/QuestionBank'
import type { MediaTarget } from '@/contest/components/QuestionComposer'
import { QuestionImport } from '@/contest/components/QuestionImport'
import { QuestionPreview } from '@/contest/components/QuestionPreview'
import { QuestionQuickEditor } from '@/contest/components/QuestionQuickEditor'
import type { AnswerKey, Id, Question, QuestionStatus } from '@/contest/data/types'
import { useAnswerKeys, useMedia, useQuestions } from '@/contest/hooks/useContestData'
import { defaultsFor, readiness, tidy } from '@/contest/lib/quick'
import { blankKey, newQuestion, typeInfo } from '@/contest/lib/questionTypes'
import { mediaUsage } from '@/contest/lib/usage'

interface Draft {
  q: Question
  key: AnswerKey
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const DOT: Record<QuestionStatus, string> = { draft: 'is-draft', ready: 'is-ready', published: 'is-published' }
type Filter = 'all' | QuestionStatus | 'attention'

export default function Questions() {
  usePageTitle('Questions')
  const toast = useToast()
  const questions = useQuestions()
  const list = useMemo(() => questions.data ?? [], [questions.data])
  const keys = useAnswerKeys(list.map((q) => q.id))
  const media = useMedia()

  const [openId, setOpenId] = useState<Id | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [save, setSave] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [view, setView] = useState<'write' | 'table'>('write')
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [picking, setPicking] = useState<MediaTarget | null>(null)
  const [asking, setAsking] = useState<Question | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const latest = useRef({ draft, list, keys: keys.data, openId })
  latest.current = { draft, list, keys: keys.data, openId }

  const lookup = (id: string) => media.data?.find((a) => a.id === id)
  const knownTags = useMemo(() => [...new Set(list.flatMap((q) => q.tags))].sort(), [list])
  const fail = (title: string) => (e: unknown) => toast.push({ tone: 'error', title, description: e instanceof Error ? e.message : undefined })
  const nextNumber = () => Math.max(0, ...list.map((q) => Number(q.id.slice(1)) || 0)) + 1
  const problemsOf = (q: Question) => readiness(q, keys.data?.[q.id])

  /** Writes the draft to the backend now. Returns once it is saved. */
  const flush = async (override?: Draft) => {
    window.clearTimeout(timer.current)
    const { draft: current, list: l, keys: k } = latest.current
    const d = override ?? current
    if (!d || !d.q.prompt.trim()) return
    const saved = l.find((x) => x.id === d.q.id)
    const savedKey = k?.[d.q.id] ?? null
    const broken = readiness(d.q, d.key).length > 0
    const q = broken && d.q.status !== 'draft' ? { ...d.q, status: 'draft' as const } : d.q
    if (same(q, saved) && same(d.key, savedKey)) return setSave('saved')
    setSave('saving')
    try {
      if (!same(q, saved)) await questions.save({ ...q, updatedAt: new Date().toISOString() })
      if (!same(d.key, savedKey)) await keys.save(q.id, d.key)
      if (q !== d.q) {
        setDraft((cur) => (cur && cur.q.id === q.id ? { ...cur, q: { ...cur.q, status: 'draft' } } : cur))
        toast.push({ tone: 'info', title: 'Moved back to draft', description: 'It no longer has everything it needs to be published.', key: 'back-to-draft' })
      }
      setSave('saved')
    } catch (e) {
      setSave('idle')
      fail('Could not save')(e)
    }
  }

  // Save by itself a moment after the writer stops typing.
  useEffect(() => {
    if (!draft || !questions.data) return
    if (!draft.q.prompt.trim()) return setSave('idle')
    if (same(draft.q, list.find((x) => x.id === draft.q.id)) && same(draft.key, keys.data?.[draft.q.id] ?? null)) return setSave('saved')
    setSave('saving')
    timer.current = window.setTimeout(() => void flush(), 800)
    return () => window.clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  const open = (q: Question) => {
    void flush()
    setOpenId(q.id)
    setDraft({ q: structuredClone(q), key: structuredClone(keys.data?.[q.id] ?? blankKey(q)) })
    setView('write')
  }

  const startNew = async (carry?: Question) => {
    // Finishing a question drops the empty option rows left over from typing.
    if (latest.current.draft) await flush(((t) => ({ q: t.question, key: t.key }))(tidy(latest.current.draft.q, latest.current.draft.key)))
    const id = `q${nextNumber()}`
    const type = carry?.type ?? 'single'
    const level = carry?.difficulty ?? 3
    let q = newQuestion(type, id)
    if ('options' in q && type !== 'truefalse') q = { ...q, options: q.options.map((o) => ({ ...o, label: '' })) }
    if (q.type === 'ordering') q = { ...q, items: q.items.map((o) => ({ ...o, label: '' })) }
    if (q.type === 'matching') q = { ...q, left: q.left.map((o) => ({ ...o, label: '' })), right: q.right.map((o) => ({ ...o, label: '' })) }
    q = { ...q, difficulty: level, tags: carry?.tags ?? [], ...defaultsFor(q, level) }
    setOpenId(id)
    setDraft({ q, key: blankKey(q) })
    setSave('idle')
    setView('write')
    window.setTimeout(() => document.querySelector<HTMLTextAreaElement>('.qe-prompt')?.focus(), 50)
  }

  const duplicate = async (q: Question) => {
    await flush()
    const id = `q${nextNumber()}`
    const copy = { ...structuredClone(q), id, prompt: `${q.prompt} (copy)`, status: 'draft' as const }
    setOpenId(id)
    setDraft({ q: copy, key: structuredClone(keys.data?.[q.id] ?? blankKey(copy)) })
  }

  const remove = async (q: Question) => {
    setAsking(null)
    try {
      await questions.remove(q.id)
      if (openId === q.id) {
        setOpenId(null)
        setDraft(null)
      }
      toast.push({ tone: 'success', title: 'Question deleted' })
    } catch (e) {
      fail('Could not delete')(e)
    }
  }

  const importMany = async (items: Array<{ question: Question; key: AnswerKey }>) => {
    let n = nextNumber()
    try {
      for (const { question, key } of items) {
        const id = `q${n++}`
        await questions.save({ ...question, id, status: 'draft', updatedAt: new Date().toISOString() })
        await keys.save(id, key)
      }
      toast.push({ tone: 'success', title: `${items.length} draft${items.length === 1 ? '' : 's'} added` })
    } catch (e) {
      fail('Could not add them')(e)
    }
  }

  // Alt+N starts a new question from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        void startNew()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const pick = (assets: { id: string }[]) => {
    if (!draft || !picking || assets.length === 0) return
    const { q } = draft
    if (picking.kind === 'prompt') setDraft({ ...draft, q: { ...q, mediaIds: [...new Set([...q.mediaIds, ...assets.map((a) => a.id)])] } })
    else if ('options' in q) setDraft({ ...draft, q: { ...q, options: q.options.map((o) => (o.id === picking.id ? { ...o, mediaId: assets[0].id } : o)) } })
    setPicking(null)
  }

  const shown = list.filter((q) => {
    if (query.trim() && !`${q.prompt} ${q.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())) return false
    if (filter === 'attention') return q.status !== 'draft' && problemsOf(q).length > 0
    return filter === 'all' || q.status === filter
  })
  const counts = { all: list.length, draft: list.filter((q) => q.status === 'draft').length, ready: list.filter((q) => q.status === 'ready').length, published: list.filter((q) => q.status === 'published').length }
  const problems = draft ? readiness(draft.q, draft.key) : []
  const saved = draft ? list.find((q) => q.id === draft.q.id) : undefined
  const setStatus = (status: QuestionStatus) => {
    if (!draft) return
    const t = status === 'draft' ? { question: draft.q, key: draft.key } : tidy(draft.q, draft.key)
    setDraft({ q: { ...t.question, status }, key: t.key })
  }

  if (!questions.data) {
    return (
      <Card aria-busy="true">
        <Skeleton height="16rem" radius="0.75rem" />
      </Card>
    )
  }

  return (
    <div className="qx">
      <aside className="qx-list" aria-label="Questions">
        <div className="qx-list-head">
          <Button onClick={() => void startNew()}>
            <Plus aria-hidden="true" /> New question <kbd>Alt N</kbd>
          </Button>
          <Button variant="plain" size="sm" onClick={() => setImporting(true)}>
            <FileUp aria-hidden="true" /> Paste many
          </Button>
        </div>
        <Input icon={<Search size={16} aria-hidden="true" />} type="search" value={query} placeholder="Search" aria-label="Search questions" onChange={(e) => setQuery(e.target.value)} />
        <Segmented<Filter>
          ariaLabel="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `All ${counts.all}` },
            { value: 'draft', label: `Draft ${counts.draft}` },
            { value: 'ready', label: `Ready ${counts.ready}` },
            { value: 'published', label: `Live ${counts.published}` },
          ]}
        />
        <Segmented<'write' | 'table'>
          ariaLabel="View"
          value={view}
          onChange={setView}
          options={[
            { value: 'write', label: 'Write' },
            { value: 'table', label: 'Table' },
          ]}
        />
        <ul className="qx-items">
          {shown.map((q) => {
            const bad = q.status !== 'draft' && problemsOf(q).length > 0
            return (
              <li key={q.id}>
                <button type="button" className={cn('qx-item', openId === q.id && 'is-open')} aria-current={openId === q.id ? 'true' : undefined} onClick={() => open(q)}>
                  <span className={cn('qx-dot', DOT[q.status])} title={q.status} />
                  <span className="qx-text">
                    <strong>{q.prompt || 'Untitled question'}</strong>
                    <span className="qx-sub">
                      {typeInfo(q.type).label}
                      <DifficultyMeter value={q.difficulty} size="sm" showName={false} />
                      {bad && (
                        <span className="qx-warn" title={problemsOf(q).join(' ')}>
                          <TriangleAlert aria-hidden="true" />
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
          {shown.length === 0 && <li className="qx-none">No question matches.</li>}
        </ul>
      </aside>

      <section className="qx-main">
        {view === 'table' ? (
          <QuestionBank questions={list} keys={keys.data} selectedId={openId} onSelect={(id) => list.find((q) => q.id === id) && open(list.find((q) => q.id === id)!)} onAdd={() => void startNew()} onDuplicate={(q) => void duplicate(q)} onDelete={setAsking} />
        ) : draft ? (
          <Card className="qx-card">
            <div className="qx-card-head">
              <span className="qx-state" role="status">
                {save === 'saving' ? 'Saving…' : save === 'saved' ? 'All changes saved' : draft.q.prompt.trim() ? '' : 'Starts saving when you type the question'}
              </span>
              <span className="qx-tools">
                <Button variant="ghost" size="sm" onClick={() => setPreviewing(true)}>
                  <Eye aria-hidden="true" /> Preview
                </Button>
                <Button variant="ghost" size="sm" disabled={!saved} onClick={() => saved && void duplicate(saved)}>
                  <Copy aria-hidden="true" /> Duplicate
                </Button>
                <Button variant="ghost" size="sm" disabled={!saved} onClick={() => saved && setAsking(saved)}>
                  <Trash2 aria-hidden="true" /> Delete
                </Button>
              </span>
            </div>
            <div
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  void startNew(draft.q)
                }
              }}
            >
              <QuestionQuickEditor key={draft.q.id} question={draft.q} answerKey={draft.key} knownTags={knownTags} media={lookup} onPickMedia={setPicking} reviewer="Admin" onChange={(q, key) => setDraft({ q, key })} />
            </div>
            <div className="qx-foot">
              <Segmented<QuestionStatus>
                ariaLabel="Status"
                value={draft.q.status}
                onChange={setStatus}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'ready', label: 'Ready', disabled: problems.length > 0 },
                  { value: 'published', label: 'Published', disabled: problems.length > 0 },
                ]}
              />
              <Button onClick={() => void startNew(draft.q)} disabled={!draft.q.prompt.trim()}>
                <Plus aria-hidden="true" /> Save and add another <kbd>Ctrl ↵</kbd>
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <EmptyState icon={<Plus size={20} aria-hidden="true" />} title="Write a question" action={<Button onClick={() => void startNew()}>New question</Button>}>
              Type the question, type the options, tick the right one. It saves by itself. You can also paste many at once.
            </EmptyState>
          </Card>
        )}
      </section>

      <Drawer open={previewing} onClose={() => setPreviewing(false)} title="How players see it">
        {draft && <QuestionPreview question={draft.q} answerKey={draft.key} media={lookup} />}
      </Drawer>
      <QuestionImport open={importing} onClose={() => setImporting(false)} onImport={importMany} />
      <MediaPicker open={picking !== null} onClose={() => setPicking(null)} assets={media.data ?? []} usage={mediaUsage(list)} kinds={picking?.kind === 'option' ? ['image'] : ['image', 'audio', 'video']} multiple={picking?.kind === 'prompt'} title={picking?.kind === 'option' ? 'Picture for this option' : 'Add to the question'} onUpload={(file, o) => media.upload(file, o)} onPick={pick} />
      <Modal
        open={asking !== null}
        onClose={() => setAsking(null)}
        title="Delete this question?"
        description={asking ? `“${asking.prompt}” and its answer key are removed.` : undefined}
        actions={
          <>
            <Button variant="plain" onClick={() => setAsking(null)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={() => asking && void remove(asking)}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  )
}
