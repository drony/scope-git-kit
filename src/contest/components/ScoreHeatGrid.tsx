import type { CSSProperties } from 'react'
import { Tag } from '@/kit/components/ui/Badge'
import { cn } from '@/kit/lib/cn'
import type { Id, Question, Score } from '../data/types'
import { isPending } from '../lib/ranking'

interface HeatRow {
  id: Id
  name: string
  /** Scores by question id. A question with no score was not answered or not scored. */
  scores: Record<Id, Score | undefined>
}

interface ScoreHeatGridProps {
  questions: Question[]
  rows: HeatRow[]
  /** Called when a cell is clicked, to open that answer. */
  onOpen?: (participantId: Id, questionId: Id) => void
  className?: string
}

const share = (s: Score | undefined) => (s && s.max > 0 ? s.points / s.max : 0)

/** Green for a good score, red for a poor one, and a mix in between, softened so the numbers stay readable. */
const tint = (ratio: number): CSSProperties => ({
  background: ratio >= 0.5 ? `color-mix(in srgb, var(--answer-right) ${Math.round(14 + (ratio - 0.5) * 2 * 40)}%, var(--surface))` : `color-mix(in srgb, var(--answer-wrong) ${Math.round(10 + (0.5 - ratio) * 2 * 38)}%, var(--surface))`,
})

/**
 * Who got what: a grid with a person on every row and a question in every column, each cell coloured by how many of the
 * points it earned. The bottom row shows how many people got full marks on a question, and the hardest question is
 * tagged, so you can see at a glance where people struggled.
 */
export function ScoreHeatGrid({ questions, rows, onOpen, className }: ScoreHeatGridProps) {
  const stats = questions.map((q) => {
    // Answers that still wait for a person say nothing about how hard the question was.
    const scored = rows.flatMap((r) => (r.scores[q.id] && !isPending(r.scores[q.id]!) ? [r.scores[q.id]!] : []))
    const full = scored.filter((s) => s.points >= s.max && s.max > 0).length
    const mean = scored.length ? scored.reduce((n, s) => n + share(s), 0) / scored.length : null
    return { id: q.id, full, count: scored.length, mean }
  })
  const hardest = stats.filter((s) => s.mean !== null && s.count >= 2).sort((a, b) => a.mean! - b.mean!)[0]?.id

  return (
    <div className={cn('cs-heat', className)}>
      <table>
        <caption className="cs-sr">Points per person and question</caption>
        <thead>
          <tr>
            <th scope="col">Participant</th>
            {questions.map((q, i) => (
              <th key={q.id} scope="col" title={q.prompt}>
                Q{i + 1}
                {q.id === hardest && <Tag tone="error">hardest</Tag>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">{r.name}</th>
              {questions.map((q) => {
                const s = r.scores[q.id]
                const pending = s ? isPending(s) : false
                const cell = s ? (
                  <>
                    {s.points}
                    <small>/{s.max}</small>
                  </>
                ) : (
                  '·'
                )
                return (
                  <td key={q.id} className={cn(!s && 'is-empty', pending && 'is-pending')} style={s && !pending ? tint(share(s)) : undefined}>
                    {onOpen && s ? (
                      <button type="button" aria-label={`${r.name}, question ${questions.indexOf(q) + 1}: ${s.points} of ${s.max}${pending ? ', waiting for a reviewer' : ''}`} onClick={() => onOpen(r.id, q.id)}>
                        {cell}
                      </button>
                    ) : (
                      cell
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Full marks</th>
            {stats.map((s) => (
              <td key={s.id}>{s.count ? `${Math.round((s.full / s.count) * 100)}%` : '—'}</td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
