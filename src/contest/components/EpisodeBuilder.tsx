import { Coffee, CircleAlert, Info, Plus, Sparkles, Trash2, TriangleAlert, BarChart3 } from 'lucide-react'
import { DatePicker } from '@/kit/components/calendar/DatePicker'
import { TimeField } from '@/kit/components/calendar/TimePicker'
import { SortableList } from '@/kit/components/data/SortableList'
import { Field, Input } from '@/kit/components/forms/Field'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { AnswerKey, Difficulty, Episode, EpisodeSlot, Id, Question, Survey } from '../data/types'
import { DEFAULT_RAMP, episodeChecks, episodeSeconds, questionSlots, slotSeconds, type ShowCheck } from '../lib/episode'
import { levelInfo, LEVELS, observedLevel } from '../lib/difficulty'
import type { QuestionStat } from '../lib/stats'
import { DifficultyMeter } from './DifficultyMeter'

interface EpisodeBuilderProps {
  episode: Episode
  onChange: (episode: Episode) => void
  /** The whole bank, to look the slots up. */
  questions: Question[]
  keys: Record<Id, AnswerKey>
  stats: Record<Id, QuestionStat>
  /** Shows an "Add questions" button: open your picker. */
  onAddQuestions?: () => void
  /** Shows a "Fill from the bank" button: replace the line-up with a suggestion. */
  onSuggest?: () => void
  /** Surveys that can run as a poll during the show. Without any, the poll button is hidden. */
  polls?: Survey[]
  /** The pack in force: a question that is approved but not in it gets a warning. */
  pack?: { ids: ReadonlySet<Id>; revision: number }
  className?: string
}

const toDate = (iso: string) => new Date(iso)
const toTime = (iso: string) => `${String(new Date(iso).getHours()).padStart(2, '0')}:${String(new Date(iso).getMinutes()).padStart(2, '0')}`
const combine = (date: Date, time: string) => {
  const [h, m] = (time || '19:00').split(':').map(Number)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m).toISOString()
}
const minutes = (s: number) => `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`
const ICON = { error: CircleAlert, warn: TriangleAlert, info: Info } as const

/** The difficulty curve of a line-up: one dot per question, coloured by level, with the ideal ramp dashed behind it. */
function Curve({ levels, observed }: { levels: Array<{ level?: Difficulty; seen?: Difficulty; label: string }>; observed: boolean }) {
  const W = 560
  const H = 170
  const padL = 62
  const n = levels.length
  const x = (i: number) => padL + (n === 1 ? (W - padL - 14) / 2 : (i / (n - 1)) * (W - padL - 20))
  const y = (l: number) => 12 + ((5 - l) / 4) * (H - 38)
  const ideal = levels.map((_, i) => DEFAULT_RAMP[Math.round((i / Math.max(1, n - 1)) * (DEFAULT_RAMP.length - 1))])
  const points = levels.flatMap((p, i) => (p.level ? [`${x(i)},${y(p.level)}`] : []))
  return (
    <svg className="eb-curve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Difficulty curve: ${levels.map((p, i) => `question ${i + 1}, ${p.level ? levelInfo(p.level).name : 'no level'}`).join('; ')}`}>
      {LEVELS.map((l) => (
        <g key={l.level}>
          <line x1={padL} x2={W - 8} y1={y(l.level)} y2={y(l.level)} className="eb-grid" />
          <text x={padL - 8} y={y(l.level) + 4} textAnchor="end" className="eb-axis">
            {l.name}
          </text>
        </g>
      ))}
      {n > 1 && <polyline points={ideal.map((l, i) => `${x(i)},${y(l)}`).join(' ')} className="eb-ideal" />}
      {points.length > 1 && <polyline points={points.join(' ')} className="eb-line" />}
      {levels.map((p, i) => (
        <g key={i}>
          {observed && p.seen && p.level && p.seen !== p.level && <line x1={x(i)} x2={x(i)} y1={y(p.level)} y2={y(p.seen)} className="eb-gap" />}
          {observed && p.seen && p.level && p.seen !== p.level && <circle cx={x(i)} cy={y(p.seen)} r="5" fill="none" stroke={`var(--level-${p.seen})`} strokeWidth="2" strokeDasharray="2 2" />}
          {p.level ? <circle cx={x(i)} cy={y(p.level)} r="7" fill={`var(--level-${p.level})`} stroke="var(--surface)" strokeWidth="2" /> : <circle cx={x(i)} cy={H - 24} r="6" fill="none" stroke="var(--muted)" strokeDasharray="2 2" />}
          <text x={x(i)} y={H - 6} textAnchor="middle" className="eb-axis">
            Q{i + 1}
          </text>
          <title>{`${p.label}${p.level ? `: ${levelInfo(p.level).name}` : ': no level'}${p.seen && p.seen !== p.level ? `. People found it ${levelInfo(p.seen).name}.` : ''}`}</title>
        </g>
      ))}
    </svg>
  )
}

/**
 * Builds the line-up of a weekly show. You see it three ways at once: the running order (drag to reorder, set the time of each
 * question), the difficulty curve against the ideal ramp, and the time bar against the broadcast slot. Under them, the checks
 * say what is wrong before it goes on air: a missing source, a flat curve, a show that runs over, a question that cannot run live.
 */
export function EpisodeBuilder({ episode, onChange, questions, keys, stats, onAddQuestions, onSuggest, polls = [], pack, className }: EpisodeBuilderProps) {
  const set = (patch: Partial<Episode>) => onChange({ ...episode, ...patch })
  const checks = episodeChecks(episode, questions, keys, pack)
  const qSlots = questionSlots(episode)
  const total = episodeSeconds(episode, questions)
  const budget = episode.slotMin * 60
  const scale = Math.max(total, budget)
  const levelOf = (slot: Extract<EpisodeSlot, { kind: 'question' }>) => questions.find((q) => q.id === slot.questionId)
  const curve = qSlots.map((s) => {
    const q = levelOf(s)
    const st = q ? stats[q.id] : undefined
    return { level: q?.difficulty, seen: st?.reliable && st.p !== null ? observedLevel(st.p) : undefined, label: q?.prompt ?? 'Missing question' }
  })
  const patchSlot = (id: Id, patch: Partial<EpisodeSlot>) => set({ slots: episode.slots.map((s) => (s.id === id ? ({ ...s, ...patch } as EpisodeSlot) : s)) })
  const errorsOf = (id: Id) => checks.filter((c) => c.slotId === id)
  let n = 0

  return (
    <div className={cn('eb', className)}>
      <div className="eb-head">
        <Field label="Title">
          <Input value={episode.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="Date">
          <DatePicker ariaLabel="Date of the show" value={toDate(episode.startsAt)} onChange={(d) => d && set({ startsAt: combine(d, toTime(episode.startsAt)) })} />
        </Field>
        <Field label="Starts at">
          <TimeField ariaLabel="Start time" value={toTime(episode.startsAt)} onChange={(t) => set({ startsAt: combine(toDate(episode.startsAt), t) })} />
        </Field>
        <Field label="Broadcast slot">
          <Input type="number" min={5} max={240} value={episode.slotMin} affix="min" onChange={(e) => set({ slotMin: Math.max(5, Number(e.target.value) || 5) })} />
        </Field>
      </div>

      <section aria-label="Difficulty curve" className="eb-sec">
        <h4>Difficulty curve</h4>
        {curve.length > 0 ? <Curve levels={curve} observed /> : <p className="eb-empty">Add questions to see the curve.</p>}
        <p className="eb-legend">
          <span className="eb-key is-line" /> this show <span className="eb-key is-ideal" /> the usual build-up <span className="eb-key is-seen" /> how people really found it
        </p>
      </section>

      <section aria-label="Time" className="eb-sec">
        <h4>
          Time <span>{minutes(total)} of {episode.slotMin} min</span>
        </h4>
        <div className="eb-time" role="img" aria-label={`The show takes ${minutes(total)} of a ${episode.slotMin} minute slot`}>
          {episode.slots.map((s) => {
            const q = s.kind === 'question' ? levelOf(s) : undefined
            return <i key={s.id} className={cn(s.kind !== 'question' && 'is-break')} style={{ width: `${(slotSeconds(s, questions) / scale) * 100}%`, background: q?.difficulty ? `var(--level-${q.difficulty})` : undefined }} title={s.kind === 'question' ? (q?.prompt ?? 'Question') : s.kind === 'break' ? 'Break' : 'Poll'} />
          })}
          <b className="eb-slot" style={{ left: `${(budget / scale) * 100}%` }} title={`The slot ends after ${episode.slotMin} min`} />
        </div>
      </section>

      <section aria-label="Running order" className="eb-sec">
        <div className="eb-bar">
          <h4>Running order</h4>
          <span className="eb-actions">
            {onSuggest && (
              <Button variant="plain" size="sm" onClick={onSuggest}>
                <Sparkles aria-hidden="true" /> Fill from the bank
              </Button>
            )}
            <Button variant="plain" size="sm" onClick={() => set({ slots: [...episode.slots, { id: `s-break-${episode.slots.length}-${Date.now() % 1000}`, kind: 'break', sec: 30 }] })}>
              <Coffee aria-hidden="true" /> Break
            </Button>
            {polls.length > 0 && (
              <Button variant="plain" size="sm" onClick={() => set({ slots: [...episode.slots, { id: `s-poll-${Date.now() % 100000}`, kind: 'poll', surveyId: polls[0].id }] })}>
                <BarChart3 aria-hidden="true" /> Poll
              </Button>
            )}
            {onAddQuestions && (
              <Button size="sm" onClick={onAddQuestions}>
                <Plus aria-hidden="true" /> Add questions
              </Button>
            )}
          </span>
        </div>
        {episode.slots.length === 0 ? (
          <p className="eb-empty">The show is empty. Add questions from the bank, or fill it from a suggestion.</p>
        ) : (
          <SortableList
            label="Running order"
            items={episode.slots}
            getId={(s) => s.id}
            onChange={(slots) => set({ slots })}
            renderItem={(slot, { handle }) => {
              const q = slot.kind === 'question' ? levelOf(slot) : undefined
              if (slot.kind === 'question') n += 1
              const issues = errorsOf(slot.id)
              return (
                <div className={cn('eb-row', issues.some((c) => c.level === 'error') && 'has-error')} id={`slot-${slot.id}`}>
                  {handle}
                  {slot.kind === 'question' ? (
                    <>
                      <span className="eb-n">{n}</span>
                      <span className="eb-q">
                        <strong>{q?.prompt ?? 'This question no longer exists'}</strong>
                        <DifficultyMeter value={q?.difficulty} size="sm" />
                      </span>
                      <label className="eb-sec-in">
                        <Input type="number" min={5} max={600} aria-label={`Seconds for question ${n}`} affix="s" value={slot.timeSec ?? q?.timeLimitSec ?? 20} onChange={(e) => patchSlot(slot.id, { timeSec: Math.max(5, Number(e.target.value) || 5) })} />
                      </label>
                    </>
                  ) : slot.kind === 'break' ? (
                    <>
                      <span className="eb-n is-break">
                        <Coffee aria-hidden="true" />
                      </span>
                      <span className="eb-q">
                        <strong>Break</strong>
                      </span>
                      <label className="eb-sec-in">
                        <Input type="number" min={5} max={600} aria-label="Seconds of break" affix="s" value={slot.sec} onChange={(e) => patchSlot(slot.id, { sec: Math.max(5, Number(e.target.value) || 5) })} />
                      </label>
                    </>
                  ) : (
                    <>
                      <span className="eb-n is-break">
                        <BarChart3 aria-hidden="true" />
                      </span>
                      <span className="eb-q">
                        <strong>Poll</strong>
                        <small>{polls.find((p) => p.id === slot.surveyId)?.title ?? 'A poll'}</small>
                      </span>
                      <span />
                    </>
                  )}
                  {issues.length > 0 && (
                    <span className={cn('eb-flag', `is-${issues.some((c) => c.level === 'error') ? 'error' : 'warn'}`)} title={issues.map((c) => c.message).join('\n')}>
                      {issues.length}
                    </span>
                  )}
                  <Button variant="ghost" size="sm" icon aria-label="Remove from the show" onClick={() => set({ slots: episode.slots.filter((s) => s.id !== slot.id) })}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              )
            }}
          />
        )}
      </section>

      <section aria-label="Checks" className="eb-sec">
        <h4>Before it goes on air</h4>
        {checks.length === 0 ? (
          <p className="eb-ok" role="status">Everything checks out.</p>
        ) : (
          <ul className="eb-checks">
            {(['error', 'warn', 'info'] as const).flatMap((level) => checks.filter((c) => c.level === level)).map((c: ShowCheck) => {
              const Icon = ICON[c.level]
              return (
                <li key={c.id} className={`is-${c.level}`}>
                  <Icon aria-hidden="true" />
                  {c.slotId ? (
                    <button type="button" onClick={() => document.getElementById(`slot-${c.slotId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })}>
                      {c.message}
                    </button>
                  ) : (
                    <span>{c.message}</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
