import { Plus, Trash2, X } from 'lucide-react'
import { SortableList } from '@/kit/components/data/SortableList'
import { Switch } from '@/kit/components/forms/Controls'
import { Field, Input } from '@/kit/components/forms/Field'
import { Select } from '@/kit/components/forms/Select'
import { Alert } from '@/kit/components/ui/Feedback'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { Survey, SurveyQuestion } from '../data/types'
import { blankQuestion, MAX_QUESTIONS, surveyProblems, SURVEY_TEMPLATES } from '../lib/survey'

const TYPES: Array<{ value: SurveyQuestion['type']; label: string; hint: string }> = [
  { value: 'nps', label: 'Recommend (0–10)', hint: 'The standard NPS question.' },
  { value: 'rating', label: 'Stars (1–5)', hint: 'A quick rating.' },
  { value: 'likert', label: 'Agreement scale', hint: 'From disagree to agree, 5 or 7 points.' },
  { value: 'choice', label: 'One choice', hint: 'Pick one option.' },
  { value: 'multiple', label: 'Many choices', hint: 'Pick any that apply.' },
  { value: 'text', label: 'Open text', hint: 'Their own words.' },
]

interface SurveyBuilderProps {
  survey: Survey
  onChange: (survey: Survey) => void
  className?: string
}

/**
 * Builds a short survey. Start from a template or from nothing; add questions of six kinds, reorder them, make them optional.
 * A checker under the list says what hurts answer quality: more than five questions, wording that leans toward an answer, a
 * changed NPS sentence, too few options. Short surveys and neutral words get more honest answers.
 */
export function SurveyBuilder({ survey, onChange, className }: SurveyBuilderProps) {
  const set = (patch: Partial<Survey>) => onChange({ ...survey, ...patch })
  const problems = surveyProblems(survey)
  const patchQ = (id: string, patch: Partial<SurveyQuestion>) => set({ questions: survey.questions.map((q) => (q.id === id ? ({ ...q, ...patch } as SurveyQuestion) : q)) })
  const nextId = () => `q${Math.max(0, ...survey.questions.map((q) => Number(q.id.slice(1)) || 0)) + 1}`

  return (
    <div className={cn('sb', className)}>
      {survey.questions.length === 0 && (
        <div className="sb-templates">
          <span className="qe-label">Start from</span>
          {SURVEY_TEMPLATES.map((t) => (
            <button key={t.id} type="button" onClick={() => onChange({ ...t.build(survey.id), title: survey.title || t.name })}>
              <strong>{t.name}</strong>
              <small>{t.description}</small>
            </button>
          ))}
        </div>
      )}
      <div className="sb-head">
        <Field label="Title">
          <Input value={survey.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Switch checked={survey.anonymous} onChange={(anonymous) => set({ anonymous })} label="Anonymous" description="Answers are not linked to a person." />
      </div>

      <SortableList
        label="Questions"
        items={survey.questions}
        getId={(q) => q.id}
        onChange={(questions) => set({ questions })}
        renderItem={(q, { handle, index }) => (
          <div className="sb-q">
            <div className="sb-q-top">
              {handle}
              <span className="sb-n">{index + 1}</span>
              <Select<SurveyQuestion['type']> ariaLabel={`Kind of question ${index + 1}`} value={q.type} options={TYPES.map((t) => ({ value: t.value, label: t.label, description: t.hint }))} onChange={(type) => set({ questions: survey.questions.map((x) => (x.id === q.id ? { ...blankQuestion(type, q.id), prompt: type === 'nps' ? blankQuestion(type, q.id).prompt : x.prompt } : x)) })} />
              <Switch checked={Boolean(q.optional)} onChange={(optional) => patchQ(q.id, { optional })} label="Optional" />
              <Button variant="ghost" size="sm" icon aria-label={`Remove question ${index + 1}`} onClick={() => set({ questions: survey.questions.filter((x) => x.id !== q.id) })}>
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
            <Input value={q.prompt} placeholder="The question" aria-label={`Question ${index + 1}`} onChange={(e) => patchQ(q.id, { prompt: e.target.value })} />
            {q.type === 'likert' && (
              <div className="cs-grid-3">
                <Field label="Low end">
                  <Input value={q.low} onChange={(e) => patchQ(q.id, { low: e.target.value })} />
                </Field>
                <Field label="High end">
                  <Input value={q.high} onChange={(e) => patchQ(q.id, { high: e.target.value })} />
                </Field>
                <Field label="Points">
                  <Select<'5' | '7'> ariaLabel="Points" value={String(q.points) as '5' | '7'} options={[{ value: '5', label: '5 points' }, { value: '7', label: '7 points' }]} onChange={(v) => patchQ(q.id, { points: Number(v) as 5 | 7 })} />
                </Field>
              </div>
            )}
            {(q.type === 'choice' || q.type === 'multiple') && (
              <ul className="sb-opts">
                {q.options.map((o, i) => (
                  <li key={o.id}>
                    <Input value={o.label} placeholder={`Option ${i + 1}`} aria-label={`Option ${i + 1} of question ${index + 1}`} onChange={(e) => patchQ(q.id, { options: q.options.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)) })} />
                    <Button variant="ghost" size="sm" icon aria-label={`Remove option ${i + 1}`} disabled={q.options.length <= 2} onClick={() => patchQ(q.id, { options: q.options.filter((x) => x.id !== o.id) })}>
                      <X aria-hidden="true" />
                    </Button>
                  </li>
                ))}
                <li>
                  <Button variant="plain" size="sm" onClick={() => patchQ(q.id, { options: [...q.options, { id: `o${q.options.length + 1}${Date.now() % 100}`, label: '' }] })}>
                    <Plus aria-hidden="true" /> Add option
                  </Button>
                </li>
              </ul>
            )}
          </div>
        )}
      />
      <Button variant="plain" size="sm" disabled={survey.questions.length >= MAX_QUESTIONS + 3} onClick={() => set({ questions: [...survey.questions, blankQuestion('choice', nextId())] })}>
        <Plus aria-hidden="true" /> Add a question
      </Button>

      {problems.length > 0 && (
        <Alert tone="warning" title={problems.length === 1 ? 'One thing to improve' : `${problems.length} things to improve`}>
          <span className="cs-problems">
            {problems.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </span>
        </Alert>
      )}
    </div>
  )
}
