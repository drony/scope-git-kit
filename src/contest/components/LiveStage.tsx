import { useState, type ReactNode } from 'react'
import { Check, Lock, X } from 'lucide-react'
import { CountdownRing } from '@/kit/components/ui/CountdownRing'
import { cn } from '@/kit/lib/cn'
import type { AnswerValue, Id, LiveState } from '../data/types'
import { liveRanking, limitSecAt, optionCounts, pointsAt, questionAt, READING_MS, remainingMs, type LiveContext } from '../lib/live'
import { AnswerDistribution, TILE_SHAPES } from './AnswerDistribution'
import { AnswerInput } from './Answers'
import { LiveScoreboard } from './LiveScoreboard'

interface LiveStageProps {
  state: LiveState
  ctx: LiveContext
  /** The person watching. */
  participantId: Id
  /** The server's clock in milliseconds. */
  now: number
  /** Called with the answer when the person picks it. */
  onAnswer: (value: AnswerValue) => void
  nameOf: (id: Id) => string
  /** Shown during a poll slot, for example a `PollCard`. */
  poll?: ReactNode
  className?: string
}

/**
 * What a player sees while the show runs: a countdown ring, the question, and big answer tiles (each with a colour, a shape
 * and a letter). After picking, the tile stays marked and the screen says "locked in". When time is up the answer is revealed,
 * with the points won, the streak and the scoreboard. Questions that are not multiple choice use the ordinary answer input.
 */
export function LiveStage({ state, ctx, participantId, now, onAnswer, nameOf, poll, className }: LiveStageProps) {
  const [picked, setPicked] = useState<{ q: Id; value: AnswerValue } | null>(null)
  const q = questionAt(ctx, state.index)
  const slot = ctx.episode.slots[state.index]
  const mine = q ? state.answers[q.id]?.[participantId] : undefined
  const waiting = state.waiting.includes(participantId)
  const left = remainingMs(state, now, ctx)
  const rows = liveRanking(state, nameOf)
  const me = rows.find((r) => r.id === participantId)

  if (state.phase === 'lobby') return <section className={cn('stage', className)}><p className="stage-wait">The host is about to start.</p></section>
  if (state.phase === 'finished') {
    return (
      <section className={cn('stage', className)} aria-label="Final">
        <span className="stage-tag">That is the show</span>
        <h2>{me ? `You finished number ${me.rank} with ${me.points} points` : 'Thanks for watching'}</h2>
        <LiveScoreboard rows={rows} limit={5} highlightId={participantId} />
      </section>
    )
  }
  if (slot?.kind !== 'question' || !q) {
    return (
      <section className={cn('stage', className)} aria-label="Break">
        <span className="stage-tag">{slot?.kind === 'poll' ? 'Quick poll' : 'Break'}</span>
        <h2>{slot?.kind === 'poll' ? 'Tell us what you think' : 'Back in a moment'}</h2>
        {slot?.kind === 'poll' && poll}
        <LiveScoreboard rows={rows} limit={5} highlightId={participantId} />
      </section>
    )
  }

  const total = state.phase === 'reading' ? READING_MS : limitSecAt(ctx, state.index) * 1000
  const options = 'options' in q ? q.options : []
  const tiles = (q.type === 'single' || q.type === 'truefalse' || q.type === 'image-choice') && options.length > 0
  const locked = state.phase !== 'open' || Boolean(mine) || waiting
  const key = ctx.keys[q.id]
  const correct = key?.type === 'choice' ? key.correct : []
  const myPick = mine?.value.type === 'choice' ? mine.value.selected : picked?.q === q.id && picked.value.type === 'choice' ? picked.value.selected : []
  const revealed = state.phase === 'revealed'
  const gained = state.gained[participantId] ?? 0
  const right = revealed && mine ? gained > 0 && myPick.every((id) => correct.includes(id)) && myPick.length > 0 : false

  const choose = (id: Id) => {
    if (locked) return
    const value: AnswerValue = { type: 'choice', selected: [id] }
    setPicked({ q: q.id, value })
    onAnswer(value)
  }

  return (
    <section className={cn('stage', `is-${state.phase}`, className)} aria-label="Live question">
      <header className="stage-head">
        <span className="stage-tag">
          Question {ctx.episode.slots.slice(0, state.index + 1).filter((s) => s.kind === 'question').length} of {ctx.episode.slots.filter((s) => s.kind === 'question').length} · {pointsAt(ctx, state.index)} points
        </span>
        {(state.phase === 'reading' || state.phase === 'open') && <CountdownRing remainingMs={left} totalMs={total} size={72} label={state.phase === 'reading' ? 'Read the question' : 'Time to answer'} className="stage-ring" />}
        {state.phase === 'locked' && <span className="stage-up">Time is up</span>}
      </header>

      <h2 className="stage-q">{q.prompt}</h2>
      {state.phase === 'reading' && <p className="stage-wait">Get ready…</p>}
      {waiting && state.phase !== 'revealed' && <p className="stage-note">You joined during this question. You are in from the next one.</p>}

      {state.phase !== 'reading' && tiles && (
        <div className={cn('tiles', options.length <= 2 && 'is-two')} role="group" aria-label="Answers">
          {options.map((o, i) => {
            const isMine = myPick.includes(o.id)
            const isRight = revealed && correct.includes(o.id)
            return (
              <button key={o.id} type="button" disabled={locked} aria-pressed={isMine} className={cn('tile', isMine && 'is-mine', isRight && 'is-right', revealed && !isRight && 'is-dim', revealed && isMine && !isRight && 'is-wrong')} style={{ ['--tile' as string]: `var(--tile-${(i % 4) + 1})` }} onClick={() => choose(o.id)}>
                <span className="tile-shape" aria-hidden="true">
                  {TILE_SHAPES[i % TILE_SHAPES.length]}
                </span>
                <span className="tile-label">{o.label}</span>
                {isRight && <Check aria-label="Right answer" />}
                {revealed && isMine && !isRight && <X aria-label="Your answer was wrong" />}
              </button>
            )
          })}
        </div>
      )}

      {state.phase !== 'reading' && !tiles && (
        <div className="stage-input">
          <AnswerInput question={q} value={mine?.value ?? (picked?.q === q.id ? picked.value : null)} onChange={(value) => !locked && setPicked({ q: q.id, value })} disabled={locked} reveal={revealed ? key : null} />
          {!locked && picked?.q === q.id && (
            <button type="button" className="stage-lock" onClick={() => onAnswer(picked.value)}>
              <Lock aria-hidden="true" /> Lock in
            </button>
          )}
        </div>
      )}

      {state.phase === 'open' && mine && (
        <p className="stage-locked" role="status">
          <Lock aria-hidden="true" /> Locked in. Waiting for the others…
        </p>
      )}
      {state.phase === 'locked' && <p className="stage-wait">{mine ? 'Your answer is in.' : 'No answer from you.'}</p>}

      {revealed && (
        <div className="stage-result" role="status">
          <strong className={cn(right ? 'is-right' : 'is-wrong')}>{!mine ? 'No answer' : right ? 'Right!' : gained > 0 ? 'Partly right' : 'Not this time'}</strong>
          <span>{gained > 0 ? `+${gained} points` : '0 points'}</span>
          {me && me.streak >= 2 && <span>{me.streak} right in a row</span>}
          {q.explanation && <p>{q.explanation}</p>}
          {tiles && <AnswerDistribution options={options} counts={optionCounts(state, q.id)} correct={correct} reveal />}
          <LiveScoreboard rows={rows} limit={5} highlightId={participantId} />
        </div>
      )}
    </section>
  )
}
