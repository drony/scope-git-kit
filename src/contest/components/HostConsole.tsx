import { useEffect, useRef } from 'react'
import { Eye, Lock, Pause, Play, SkipForward, Square, Users } from 'lucide-react'
import { CountdownRing } from '@/kit/components/ui/CountdownRing'
import { Button } from '@/kit/components/ui/Button'
import { Kbd } from '@/kit/components/ui/Badge'
import { Meter } from '@/kit/components/ui/Feedback'
import { cn } from '@/kit/lib/cn'
import type { LiveCommand, LiveState } from '../data/types'
import { limitSecAt, optionCounts, pointsAt, questionAt, READING_MS, remainingMs, type LiveContext } from '../lib/live'
import { AnswerDistribution } from './AnswerDistribution'

interface HostConsoleProps {
  state: LiveState
  ctx: LiveContext
  /** The server's clock in milliseconds. */
  now: number
  onCommand: (command: LiveCommand) => void
  className?: string
}

const PHASE: Record<LiveState['phase'], string> = { lobby: 'Lobby', reading: 'Reading', open: 'Answering', locked: 'Locked', revealed: 'Revealed', break: 'Break', finished: 'Finished' }

/**
 * The host's control desk. One big button always does the next sensible thing (start, lock, reveal, next), a ring shows the
 * time, a meter shows how many players have answered, and the bars show how the room is splitting. Keyboard: Space does the
 * main thing, R reveals at once, P pauses or resumes.
 */
export function HostConsole({ state, ctx, now, onCommand, className }: HostConsoleProps) {
  const q = state.phase === 'lobby' ? undefined : questionAt(ctx, state.index)
  const slot = ctx.episode.slots[state.index]
  const answers = q ? Object.keys(state.answers[q.id] ?? {}).length : 0
  const eligible = state.joined.length - state.waiting.length
  const left = remainingMs(state, now, ctx)
  const total = state.phase === 'reading' ? READING_MS : limitSecAt(ctx, state.index) * 1000
  const key = q ? ctx.keys[q.id] : undefined
  const options = q && 'options' in q ? q.options : []
  const paused = Boolean(state.pausedAt)
  const n = ctx.episode.slots.slice(0, state.index + 1).filter((s) => s.kind === 'question').length

  const main: { label: string; command: LiveCommand | null; icon: typeof Play } | null =
    state.phase === 'lobby' ? { label: 'Start the show', command: { type: 'start' }, icon: Play }
    : state.phase === 'open' ? { label: 'Lock answers', command: { type: 'lock' }, icon: Lock }
    : state.phase === 'locked' ? { label: 'Reveal the answer', command: { type: 'reveal' }, icon: Eye }
    : state.phase === 'revealed' || state.phase === 'break' ? { label: state.index + 1 >= ctx.episode.slots.length ? 'End the show' : 'Next', command: { type: 'next' }, icon: SkipForward }
    : state.phase === 'finished' ? { label: 'Close the show', command: { type: 'close' }, icon: Square }
    : null

  // Keyboard shortcuts work anywhere on the page, except while typing.
  const latest = useRef({ main, paused, phase: state.phase, onCommand })
  latest.current = { main, paused, phase: state.phase, onCommand }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return
      const { main: m, paused: p, phase, onCommand: send } = latest.current
      if (e.key === ' ' && m?.command && !(t.closest('button') && t !== document.body)) {
        e.preventDefault()
        send(m.command)
      } else if (e.key.toLowerCase() === 'r' && (phase === 'open' || phase === 'locked')) send({ type: 'reveal' })
      else if (e.key.toLowerCase() === 'p' && (phase === 'reading' || phase === 'open')) send({ type: p ? 'resume' : 'pause' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <section className={cn('host', `is-${state.phase}`, className)} aria-label="Host console">
      <header className="host-head">
        <span className="host-phase">
          <i aria-hidden="true" /> {paused ? 'Paused' : PHASE[state.phase]}
        </span>
        <span className="host-meta">
          <Users aria-hidden="true" /> {state.joined.length} in the room
        </span>
      </header>

      {q ? (
        <div className="host-q">
          <span className="stage-tag">
            Question {n} · {pointsAt(ctx, state.index)} points · {limitSecAt(ctx, state.index)} s
          </span>
          <h3>{q.prompt}</h3>
          {key && <p className="host-key">The answer: {key.type === 'choice' ? options.filter((o) => key.correct.includes(o.id)).map((o) => o.label).join(', ') : key.type === 'number' ? key.value : key.type === 'text' ? key.accepted[0]?.text : 'see the key'}</p>}
        </div>
      ) : (
        <div className="host-q">
          <h3>{state.phase === 'lobby' ? 'Everyone is arriving' : state.phase === 'finished' ? 'The show is over' : slot?.kind === 'poll' ? 'Poll' : 'Break'}</h3>
        </div>
      )}

      <div className="host-mid">
        {(state.phase === 'reading' || state.phase === 'open') && <CountdownRing remainingMs={left} totalMs={total} size={96} label="Time left" className="stage-ring" />}
        {q && state.phase !== 'reading' && state.phase !== 'lobby' && (
          <div className="host-answered">
            <span>
              {answers} of {eligible} answered
            </span>
            <Meter label="Players who answered" value={answers} max={Math.max(1, eligible)} tone={answers >= eligible && eligible > 0 ? 'success' : undefined} />
          </div>
        )}
      </div>

      {q && options.length > 0 && state.phase !== 'reading' && state.phase !== 'lobby' && <AnswerDistribution options={options} counts={optionCounts(state, q.id)} correct={key?.type === 'choice' ? key.correct : []} reveal={state.phase === 'revealed'} />}

      <footer className="host-actions">
        {main && (
          <Button size="lg" disabled={!main.command || (paused && state.phase !== 'finished')} onClick={() => main.command && onCommand(main.command)}>
            <main.icon aria-hidden="true" /> {main.label} <Kbd>Space</Kbd>
          </Button>
        )}
        {(state.phase === 'reading' || state.phase === 'open') && (
          <Button variant="plain" onClick={() => onCommand({ type: paused ? 'resume' : 'pause' })}>
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />} {paused ? 'Resume' : 'Pause'} <Kbd>P</Kbd>
          </Button>
        )}
        {(state.phase === 'open' || state.phase === 'locked') && (
          <Button variant="plain" onClick={() => onCommand({ type: 'reveal' })}>
            <Eye aria-hidden="true" /> Reveal now <Kbd>R</Kbd>
          </Button>
        )}
        {state.phase !== 'finished' && state.phase !== 'lobby' && (
          <Button variant="ghost" onClick={() => onCommand({ type: 'finish' })}>
            End early
          </Button>
        )}
      </footer>
    </section>
  )
}
