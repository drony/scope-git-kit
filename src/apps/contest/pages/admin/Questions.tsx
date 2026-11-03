import { useState } from 'react'
import { Modal } from '@/kit/components/overlays/Modal'
import { Tabs } from '@/kit/components/nav/Tabs'
import { Button } from '@/kit/components/ui/Button'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { SplitPane } from '@/kit/components/ui/SplitPane'
import { EmptyState, Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { AnswerKeyEditor } from '@/contest/components/AnswerKeyEditor'
import { MediaPicker } from '@/contest/components/MediaPicker'
import { QuestionBank } from '@/contest/components/QuestionBank'
import { QuestionComposer, type MediaTarget } from '@/contest/components/QuestionComposer'
import { QuestionPreview } from '@/contest/components/QuestionPreview'
import type { AnswerKey, Id, Question } from '@/contest/data/types'
import { useAnswerKeys, useMedia, useQuestions } from '@/contest/hooks/useContestData'
import { mediaUsage } from '@/contest/lib/usage'
import { keyProblems, newQuestion } from '@/contest/lib/questionTypes'
import { MousePointerClick } from 'lucide-react'

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

export default function Questions() {
  usePageTitle('Questions')
  const toast = useToast()
  const questions = useQuestions()
  const list = questions.data ?? []
  const keys = useAnswerKeys(list.map((q) => q.id))
  const media = useMedia()

  const [openId, setOpenId] = useState<Id | null>(null)
  const [draft, setDraft] = useState<Question | null>(null)
  const [keyDraft, setKeyDraft] = useState<AnswerKey | null>(null)
  const [tab, setTab] = useState<'question' | 'key'>('question')
  const [picking, setPicking] = useState<MediaTarget | null>(null)
  const [asking, setAsking] = useState<Question | null>(null)

  const saved = list.find((q) => q.id === openId)
  const savedKey = openId ? (keys.data?.[openId] ?? null) : null
  const dirty = Boolean(draft) && (!same(draft, saved) || !same(keyDraft, savedKey))
  const problems = draft ? keyProblems(draft, keyDraft) : []
  const lookup = (id: string) => media.data?.find((a) => a.id === id)

  const open = (q: Question, key: AnswerKey | null) => {
    setOpenId(q.id)
    setDraft(structuredClone(q))
    setKeyDraft(key ? structuredClone(key) : null)
    setTab('question')
  }
  const fail = (title: string) => (e: unknown) => toast.push({ tone: 'error', title, description: e instanceof Error ? e.message : undefined })
  const freshId = () => `q${Math.max(0, ...list.map((q) => Number(q.id.slice(1)) || 0)) + 1}`

  const save = async () => {
    if (!draft) return
    if (draft.status !== 'draft' && problems.length > 0) {
      setTab('key')
      return toast.push({ tone: 'error', title: 'Fix the answer key first', description: `${problems[0]} Or set the status back to Draft.` })
    }
    try {
      await questions.save({ ...draft, updatedAt: new Date().toISOString() })
      if (keyDraft && !same(keyDraft, savedKey)) await keys.save(draft.id, keyDraft)
      toast.push({ tone: 'success', title: 'Question saved', key: 'saved' })
    } catch (e) {
      fail('Could not save')(e)
    }
  }

  const add = async () => {
    const q = newQuestion('single', freshId())
    try {
      await questions.save(q)
      open(q, null)
    } catch (e) {
      fail('Could not add a question')(e)
    }
  }

  const duplicate = async (q: Question) => {
    const copy: Question = { ...structuredClone(q), id: freshId(), prompt: `${q.prompt} (copy)`, status: 'draft' }
    const key = keys.data?.[q.id] ?? null
    try {
      await questions.save(copy)
      if (key) await keys.save(copy.id, key)
      open(copy, key)
    } catch (e) {
      fail('Could not duplicate')(e)
    }
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

  const pick = (assets: { id: string }[]) => {
    if (!draft || !picking || assets.length === 0) return
    if (picking.kind === 'prompt') setDraft({ ...draft, mediaIds: [...new Set([...draft.mediaIds, ...assets.map((a) => a.id)])] })
    else if ('options' in draft) setDraft({ ...draft, options: draft.options.map((o) => (o.id === picking.id ? { ...o, mediaId: assets[0].id } : o)) })
    setPicking(null)
  }

  return (
    <div className="cs-questions">
      {questions.data ? (
        <QuestionBank
          questions={list}
          keys={keys.data}
          selectedId={openId}
          onSelect={(id) => {
            const q = list.find((x) => x.id === id)
            if (q) open(q, keys.data?.[id] ?? null)
          }}
          onAdd={() => void add()}
          onDuplicate={(q) => void duplicate(q)}
          onDelete={setAsking}
        />
      ) : (
        <Card aria-busy="true">
          <Skeleton height="14rem" radius="0.75rem" />
        </Card>
      )}

      {draft ? (
        <Card className="cs-editor">
          <CardHead
            title={draft.prompt || 'New question'}
            actions={
              <>
                <Button variant="plain" size="sm" disabled={!dirty} onClick={() => saved && open(saved, savedKey)}>
                  Discard changes
                </Button>
                <Button size="sm" disabled={!dirty} onClick={() => void save()}>
                  Save
                </Button>
              </>
            }
          />
          <SplitPane
            storageKey="contest.editor"
            label="Resize the editor and the preview"
            initial={0.55}
            start={
              <Tabs
                ariaLabel="Edit"
                value={tab}
                onChange={(id) => setTab(id as 'question' | 'key')}
                items={[
                  { id: 'question', label: 'Question' },
                  { id: 'key', label: 'Answer key', count: problems.length || undefined },
                ]}
                panels={{
                  question: <QuestionComposer question={draft} onChange={setDraft} media={lookup} onPickMedia={setPicking} />,
                  key: <AnswerKeyEditor question={draft} value={keyDraft} onChange={setKeyDraft} media={lookup} />,
                }}
              />
            }
            end={<QuestionPreview question={draft} answerKey={keyDraft} media={lookup} />}
          />
        </Card>
      ) : (
        <Card>
          <EmptyState icon={<MousePointerClick size={20} aria-hidden="true" />} title="Pick a question to edit it" action={<Button onClick={() => void add()}>New question</Button>}>
            The editor, the answer key and a live preview as a participant sees it open here.
          </EmptyState>
        </Card>
      )}

      <MediaPicker
        open={picking !== null}
        onClose={() => setPicking(null)}
        assets={media.data ?? []}
        usage={mediaUsage(list)}
        kinds={picking?.kind === 'option' ? ['image'] : ['image', 'audio', 'video']}
        multiple={picking?.kind === 'prompt'}
        title={picking?.kind === 'option' ? 'Picture for this option' : 'Add to the question'}
        onUpload={(file, o) => media.upload(file, o)}
        onPick={pick}
      />

      <Modal
        open={asking !== null}
        onClose={() => setAsking(null)}
        title="Delete this question?"
        description={asking ? `“${asking.prompt}” and its answer key are removed. Answers already given stay in the submissions.` : undefined}
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
