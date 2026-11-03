import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Button } from '@/kit/components/ui/Button'
import { Tag } from '@/kit/components/ui/Badge'
import { EmptyState } from '@/kit/components/ui/Feedback'
import { cn } from '@/kit/lib/cn'
import type { Difficulty, Id, Question } from '../data/types'
import { calibrationHint, LEVELS, MIN_ANSWERS } from '../lib/difficulty'
import type { QuestionStat } from '../lib/stats'
import { DifficultyMeter } from './DifficultyMeter'

interface DifficultyCalibrationProps {
  questions: Question[]
  stats: Record<Id, QuestionStat>
  /** Shows a "Move to …" button where the level does not fit. Called with the question and the level people found. */
  onApply?: (question: Question, level: Difficulty) => void
  className?: string
}

/**
 * The level a writer gave against how people really answered. The chart has a column per declared level and a band per
 * observed level: a dot on the diagonal fits, a dot above is easier than written, below is harder. The table lists the
 * questions that do not fit first, and flags questions that fail to tell strong players from weak ones.
 */
export function DifficultyCalibration({ questions, stats, onApply, className }: DifficultyCalibrationProps) {
  const [view, setView] = useState<'attention' | 'all'>('attention')
  const rows = questions
    .filter((q) => q.difficulty && (stats[q.id]?.answered ?? 0) > 0)
    .map((q) => ({ q, stat: stats[q.id], hint: calibrationHint(q.difficulty, stats[q.id].p, stats[q.id].answered) }))
    .sort((a, b) => Math.abs((b.hint.observed ?? 0) - b.q.difficulty!) - Math.abs((a.hint.observed ?? 0) - a.q.difficulty!) || b.stat.answered - a.stat.answered)
  const needs = rows.filter((r) => r.hint.state === 'easier' || r.hint.state === 'harder' || (r.stat.discrimination !== null && r.stat.discrimination < 0.25))
  const shown = view === 'attention' ? needs : rows

  // The chart: x is the declared level, y the share of right answers (100% at the top).
  const W = 520
  const H = 220
  const padL = 44
  const x = (level: number) => padL + ((level - 0.5) / 5) * (W - padL - 8)
  const y = (p: number) => 8 + (1 - p) * (H - 28)

  if (rows.length === 0) return <EmptyState title="Nothing to compare yet">Once a show has run, you see how people answered against the level you gave.</EmptyState>

  return (
    <div className={cn('cal', className)}>
      <svg className="cal-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Declared difficulty against the share of right answers">
        {LEVELS.map((l) => (
          <g key={l.level}>
            <rect x={padL} y={y(Math.min(1, l.range[1]))} width={W - padL - 8} height={y(l.range[0]) - y(Math.min(1, l.range[1]))} fill={`var(--level-${l.level})`} opacity="0.1" />
            <text x={padL - 6} y={(y(Math.min(1, l.range[1])) + y(l.range[0])) / 2 + 4} textAnchor="end" className="cal-axis">
              {l.name}
            </text>
          </g>
        ))}
        {LEVELS.map((l) => (
          <text key={l.level} x={x(l.level)} y={H - 4} textAnchor="middle" className="cal-axis">
            {l.name} (written)
          </text>
        ))}
        {rows.map(({ q, stat, hint }, i) => {
          if (stat.p === null) return null
          const jitter = ((i % 5) - 2) * 7
          return (
            <circle key={q.id} cx={x(q.difficulty!) + jitter} cy={y(stat.p)} r={stat.reliable ? 6 : 4} fill={stat.reliable ? `var(--level-${q.difficulty})` : 'none'} stroke={`var(--level-${q.difficulty})`} strokeWidth="2" className={cn('cal-dot', (hint.state === 'easier' || hint.state === 'harder') && 'is-off')}>
              <title>{`${q.prompt}: ${Math.round(stat.p * 100)}% right, ${stat.answered} answers`}</title>
            </circle>
          )
        })}
      </svg>
      <p className="cal-legend">Filled dots have {MIN_ANSWERS}+ answers. Hollow dots do not have enough yet.</p>

      <Segmented<'attention' | 'all'>
        ariaLabel="Which questions"
        value={view}
        onChange={setView}
        options={[
          { value: 'attention', label: `Needs a look (${needs.length})` },
          { value: 'all', label: `All (${rows.length})` },
        ]}
      />
      {shown.length === 0 ? (
        <EmptyState title="Every level fits">People answered the way the levels say.</EmptyState>
      ) : (
        <ul className="cal-list">
          {shown.map(({ q, stat, hint }) => (
            <li key={q.id}>
              <p className="cal-q">{q.prompt}</p>
              <span className="cal-levels">
                <DifficultyMeter value={q.difficulty} size="sm" />
                {hint.observed && (
                  <>
                    <ArrowRight aria-hidden="true" />
                    <DifficultyMeter value={hint.observed} size="sm" />
                  </>
                )}
              </span>
              <span className="cal-num">{stat.p !== null ? `${Math.round(stat.p * 100)}%` : '—'}</span>
              <span className="cal-num">{stat.answered}</span>
              {onApply && hint.observed && (hint.state === 'easier' || hint.state === 'harder') && (
                <Button className="cal-apply" variant="plain" size="sm" onClick={() => onApply(q, hint.observed!)}>
                  Move to {LEVELS[hint.observed - 1].name}
                </Button>
              )}
              <span className="cal-msg">{hint.message}</span>
              <span className="cal-flags">
                {stat.discrimination !== null && stat.discrimination < 0.25 && <Tag tone="warning">Does not separate players ({stat.discrimination})</Tag>}
                {hint.state === 'few-data' && <Tag>Few answers</Tag>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
