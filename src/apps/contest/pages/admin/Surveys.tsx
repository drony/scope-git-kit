import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Tabs } from '@/kit/components/nav/Tabs'
import { Button } from '@/kit/components/ui/Button'
import { Card, CardHead } from '@/kit/components/ui/Card'
import { EmptyState, Skeleton } from '@/kit/components/ui/Feedback'
import { useToast } from '@/kit/context/ToastContext'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { SurveyBuilder } from '@/contest/components/SurveyBuilder'
import { SurveyResults } from '@/contest/components/SurveyResults'
import type { Survey } from '@/contest/data/types'
import { useEpisodes, useSurveyResponses, useSurveys } from '@/contest/hooks/useContestData'

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

export default function Surveys() {
  usePageTitle('Surveys')
  const toast = useToast()
  const surveys = useSurveys()
  const responses = useSurveyResponses()
  const episodes = useEpisodes()
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Survey | null>(null)
  const [tab, setTab] = useState<'build' | 'results'>('results')
  const list = useMemo(() => surveys.data ?? [], [surveys.data])
  const saved = list.find((s) => s.id === openId)

  useEffect(() => {
    if (!openId && list[0]) {
      setOpenId(list[0].id)
      setDraft(structuredClone(list[0]))
    }
  }, [list, openId])

  if (!surveys.data) return <Skeleton height="14rem" radius="0.75rem" />
  const open = (s: Survey) => {
    setOpenId(s.id)
    setDraft(structuredClone(s))
  }
  const create = () => {
    const id = `sv-${Date.now().toString(36)}`
    setOpenId(id)
    setDraft({ id, title: 'New survey', kind: 'custom', anonymous: true, questions: [] })
    setTab('build')
  }
  const save = async () => {
    if (!draft) return
    try {
      await surveys.save(draft)
      toast.push({ tone: 'success', title: 'Survey saved', key: 'survey-saved' })
    } catch (e) {
      toast.push({ tone: 'error', title: 'Could not save', description: e instanceof Error ? e.message : undefined })
    }
  }

  return (
    <div className="wk-grid">
      <aside className="wk-list" aria-label="Surveys">
        <Button onClick={create}>
          <Plus aria-hidden="true" /> New survey
        </Button>
        {list.map((s) => (
          <button key={s.id} type="button" className={`sv-pick${openId === s.id ? ' is-on' : ''}`} onClick={() => open(s)}>
            <strong>{s.title}</strong>
            <small>
              {s.questions.length} question{s.questions.length === 1 ? '' : 's'} · {(responses.data ?? []).filter((r) => r.surveyId === s.id).length} responses
            </small>
          </button>
        ))}
      </aside>
      <section className="wk-main">
        {draft ? (
          <Card>
            <CardHead
              title={draft.title}
              actions={
                tab === 'build' && (
                  <Button size="sm" disabled={same(draft, saved)} onClick={() => void save()}>
                    Save
                  </Button>
                )
              }
            />
            <Tabs
              ariaLabel="Survey"
              value={tab}
              onChange={(t) => setTab(t as 'build' | 'results')}
              items={[
                { id: 'results', label: 'Results' },
                { id: 'build', label: 'Edit' },
              ]}
              panels={{
                results: <SurveyResults survey={draft} responses={responses.data ?? []} episodes={episodes.data} />,
                build: <SurveyBuilder survey={draft} onChange={setDraft} />,
              }}
            />
          </Card>
        ) : (
          <Card>
            <EmptyState title="No survey yet">Make a short one for the end of the show.</EmptyState>
          </Card>
        )}
      </section>
    </div>
  )
}
