import { useMemo } from 'react'
import { cn } from '@/kit/lib/cn'
import type { Episode, Survey, SurveyQuestion, SurveyResponse } from '../data/types'
import { distribution, npsScore, numbersOf } from '../lib/survey'

interface SurveyResultsProps {
  survey: Survey
  responses: SurveyResponse[]
  /** Names the shows on the trend line of an NPS question. */
  episodes?: Episode[]
  className?: string
}

const mean = (n: number[]) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : null)

function Bars({ rows }: { rows: Array<{ label: string; count: number; share: number }> }) {
  const top = Math.max(0.0001, ...rows.map((r) => r.share))
  return (
    <ul className="sr-bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span>{r.label}</span>
          <span className="sr-bar" aria-hidden="true">
            <i style={{ width: `${(r.share / top) * 100}%` }} />
          </span>
          <span className="sr-n">
            {r.count} · {Math.round(r.share * 100)}%
          </span>
        </li>
      ))}
    </ul>
  )
}

/** The score of one NPS question as a bar split into critics, passives and promoters, with the trend over the shows. */
function Nps({ q, responses, episodes }: { q: SurveyQuestion; responses: SurveyResponse[]; episodes?: Episode[] }) {
  const all = npsScore(numbersOf(responses.map((r) => r.answers[q.id])))
  const byShow = (episodes ?? []).map((e) => ({ e, r: npsScore(numbersOf(responses.filter((x) => x.episodeId === e.id).map((x) => x.answers[q.id]))) })).filter((x) => x.r.n > 0)
  const pct = (n: number) => (all.n ? (n / all.n) * 100 : 0)
  return (
    <div className="sr-nps">
      <div className="sr-score">
        <strong>{all.score ?? '–'}</strong>
        <span>NPS from {all.n} answers</span>
      </div>
      <div className="sr-split" role="img" aria-label={`${all.promoters} promoters, ${all.passives} passives, ${all.detractors} critics`}>
        <i className="is-critic" style={{ width: `${pct(all.detractors)}%` }} />
        <i className="is-passive" style={{ width: `${pct(all.passives)}%` }} />
        <i className="is-promoter" style={{ width: `${pct(all.promoters)}%` }} />
      </div>
      <p className="sr-legend">
        <span className="is-critic">Critics {all.detractors}</span> <span className="is-passive">Passives {all.passives}</span> <span className="is-promoter">Promoters {all.promoters}</span>
      </p>
      {byShow.length > 1 && (
        <ul className="sr-trend" aria-label="NPS by show">
          {byShow.map(({ e, r }) => (
            <li key={e.id}>
              <span>#{e.number}</span>
              <span className="sr-trend-bar" aria-hidden="true">
                <i style={{ height: `${Math.max(4, ((r.score ?? -100) + 100) / 2)}%` }} />
              </span>
              <strong>{r.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** What the answers say, question by question: the NPS with its trend, averages and bars for scales and choices, and the open answers as a list. */
export function SurveyResults({ survey, responses, episodes, className }: SurveyResultsProps) {
  const rs = useMemo(() => responses.filter((r) => r.surveyId === survey.id), [responses, survey.id])
  return (
    <div className={cn('sr', className)}>
      <p className="sr-count" role="status">
        {rs.length} response{rs.length === 1 ? '' : 's'}
      </p>
      {survey.questions.map((q, i) => {
        const raw = rs.map((r) => r.answers[q.id]).filter((a) => a !== undefined)
        return (
          <section key={q.id} className="sr-q" aria-label={q.prompt}>
            <h4>
              {i + 1}. {q.prompt} <small>{raw.length} answered</small>
            </h4>
            {q.type === 'nps' && <Nps q={q} responses={rs} episodes={episodes} />}
            {(q.type === 'rating' || q.type === 'likert') && (
              <>
                <p className="sr-mean">
                  Average <strong>{mean(numbersOf(raw))?.toFixed(1) ?? '–'}</strong> out of {q.type === 'rating' ? 5 : q.points}
                </p>
                <Bars rows={distribution(numbersOf(raw), Array.from({ length: q.type === 'rating' ? 5 : q.points }, (_, n) => n + 1)).map((d) => ({ label: String(d.key), count: d.count, share: d.share }))} />
              </>
            )}
            {(q.type === 'choice' || q.type === 'multiple') && <Bars rows={q.options.map((o) => { const c = raw.filter((a) => a === o.id || (Array.isArray(a) && a.includes(o.id))).length; return { label: o.label, count: c, share: raw.length ? c / raw.length : 0 } })} />}
            {q.type === 'text' && (
              <ul className="sr-text">
                {raw.length === 0 ? <li className="sr-none">No comments yet.</li> : raw.map((a, n) => <li key={n}>“{String(a)}”</li>)}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
