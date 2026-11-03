import { useMemo, useState } from 'react'
import { Check, Clock, Plus, Search } from 'lucide-react'
import { Input } from '@/kit/components/forms/Field'
import { Button } from '@/kit/components/ui/Button'
import { Chip } from '@/kit/components/ui/Badge'
import { EmptyState } from '@/kit/components/ui/Feedback'
import { cn } from '@/kit/lib/cn'
import type { AnswerKey, Difficulty, Id, Question } from '../data/types'
import { LEVELS, levelInfo, observedLevel } from '../lib/difficulty'
import { keyProblems, typeInfo } from '../lib/questionTypes'
import { sourceState } from '../lib/sources'
import type { QuestionStat } from '../lib/stats'
import { DifficultyMeter } from './DifficultyMeter'
import { SourceBadge } from './SourceBadge'

interface QuestionPickerProps {
  questions: Question[]
  keys: Record<Id, AnswerKey>
  stats: Record<Id, QuestionStat>
  /** Ids already in the show: their cards say so. */
  picked: Id[]
  onAdd: (question: Question) => void
  onRemove?: (question: Question) => void
  /** "Not used lately" means not used within this many days. */
  freshDays?: number
  now?: Date
  className?: string
}

const ago = (iso: string | undefined, now: Date) => {
  if (!iso) return 'never used'
  const days = Math.round((now.getTime() - new Date(iso).getTime()) / 86_400_000)
  return days < 1 ? 'used today' : days < 14 ? `used ${days} days ago` : `used ${Math.round(days / 7)} weeks ago`
}

/** Why a question cannot go on air, or null. A live show needs a published question with a complete key that a machine can score. */
export function liveProblem(q: Question, key: AnswerKey | undefined): string | null {
  if (q.status === 'draft') return 'Still a draft'
  if (key?.type === 'manual') return 'Needs a person to score it'
  return keyProblems(q, key)[0] ?? null
}

/**
 * The question bank as cards for choosing what goes on air. Every card shows what an editor weighs: the level, the time, how
 * far the source can be trusted, how people really answered it, and how long ago it was last used. Filter by topic, level, and
 * "not used lately" or "source checked", then add.
 */
export function QuestionPicker({ questions, keys, stats, picked, onAdd, onRemove, freshDays = 56, now = new Date(), className }: QuestionPickerProps) {
  const [query, setQuery] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [levels, setLevels] = useState<Difficulty[]>([])
  const [fresh, setFresh] = useState(false)
  const [checked, setChecked] = useState(false)

  const allTopics = useMemo(() => [...new Set(questions.flatMap((q) => q.tags))].sort(), [questions])
  const shown = questions.filter((q) => {
    const text = `${q.prompt} ${q.tags.join(' ')}`.toLowerCase()
    const last = stats[q.id]?.lastUsed
    const state = sourceState(q.source)
    return (
      (!query.trim() || text.includes(query.trim().toLowerCase())) &&
      (topics.length === 0 || topics.some((t) => q.tags.includes(t))) &&
      (levels.length === 0 || (q.difficulty !== undefined && levels.includes(q.difficulty))) &&
      (!fresh || !last || (now.getTime() - new Date(last).getTime()) / 86_400_000 >= freshDays) &&
      (!checked || state === 'verified' || state === 'original')
    )
  })
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  return (
    <div className={cn('qp', className)}>
      <div className="qp-filters">
        <Input icon={<Search size={16} aria-hidden="true" />} type="search" value={query} placeholder="Search questions" aria-label="Search questions" onChange={(e) => setQuery(e.target.value)} />
        <div className="qp-levels" role="group" aria-label="Difficulty">
          {LEVELS.map((l) => (
            <button key={l.level} type="button" className={cn('qp-level', levels.includes(l.level) && 'is-on')} style={{ ['--lv' as string]: `var(--level-${l.level})` }} aria-pressed={levels.includes(l.level)} onClick={() => setLevels(toggle(levels, l.level))}>
              {l.name}
            </button>
          ))}
        </div>
        <div className="qp-topics" role="group" aria-label="Topic">
          {allTopics.map((t) => (
            <Chip key={t} pressed={topics.includes(t)} onClick={() => setTopics(toggle(topics, t))}>
              {t}
            </Chip>
          ))}
        </div>
        <div className="qp-switches">
          <Chip pressed={fresh} onClick={() => setFresh(!fresh)}>
            Not used lately
          </Chip>
          <Chip pressed={checked} onClick={() => setChecked(!checked)}>
            Source checked
          </Chip>
          <span className="qp-count" role="status">
            {shown.length} of {questions.length}
          </span>
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState title="No question matches">Try fewer filters.</EmptyState>
      ) : (
        <ul className="qp-grid">
          {shown.map((q) => {
            const stat = stats[q.id]
            const problem = liveProblem(q, keys[q.id])
            const inShow = picked.includes(q.id)
            const observed = stat?.reliable && stat.p !== null ? observedLevel(stat.p) : undefined
            return (
              <li key={q.id} className={cn('qp-card', inShow && 'is-in', problem && 'is-blocked')} style={{ ['--lv' as string]: q.difficulty ? `var(--level-${q.difficulty})` : 'var(--line-strong)' }}>
                <div className="qp-top">
                  <DifficultyMeter value={q.difficulty} size="sm" />
                  <span className="qp-meta">
                    <Clock aria-hidden="true" /> {q.timeLimitSec ?? 20} s · {q.points} pts
                  </span>
                </div>
                <p className="qp-prompt">{q.prompt}</p>
                <div className="qp-row">
                  <span className="qp-type">{typeInfo(q.type).label}</span>
                  {q.tags.slice(0, 2).map((t) => (
                    <span key={t} className="qp-tag">
                      {t}
                    </span>
                  ))}
                  <SourceBadge source={q.source} />
                </div>
                <div className="qp-stat">
                  {stat?.p !== null && stat?.p !== undefined ? (
                    <>
                      <span className="qp-bar" aria-hidden="true">
                        <i style={{ width: `${stat.p * 100}%` }} />
                      </span>
                      <span>
                        {Math.round(stat.p * 100)}% got it
                        {observed && q.difficulty && observed !== q.difficulty ? ` · feels ${levelInfo(observed).name}` : ''}
                      </span>
                    </>
                  ) : (
                    <span>Not asked yet</span>
                  )}
                  <span className="qp-used">{ago(stat?.lastUsed, now)}</span>
                </div>
                {problem ? (
                  <p className="qp-problem">{problem}</p>
                ) : inShow ? (
                  <Button variant="plain" size="sm" onClick={() => onRemove?.(q)} disabled={!onRemove}>
                    <Check aria-hidden="true" /> In the show{onRemove ? ' · remove' : ''}
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => onAdd(q)}>
                    <Plus aria-hidden="true" /> Add to the show
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
