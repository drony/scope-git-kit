import { useEffect, useMemo, useRef } from 'react'
import { mulberry32 } from '@/kit/lib/random'
import { useContestAdapter } from '../context/ContestContext'
import type { LiveState } from '../data/types'
import { limitSecAt, questionAt, type LiveContext } from '../lib/live'
import { botMove, makeBots, type Bot } from '../lib/simulate'

/**
 * Pretend players for a demo. While `enabled`, bots join the lobby one by one, and each time a question opens they answer
 * after a think time that depends on the bot and the question. A fixed `seed` gives the same crowd every time. A real
 * show has no use for this: real players answer from their own screens.
 */
export function useLiveSimulation(live: LiveState | null | undefined, ctx: LiveContext | null, enabled: boolean, count = 24, seed = 11): Bot[] {
  const api = useContestAdapter()
  const bots = useMemo(() => makeBots(count, seed), [count, seed])
  const answered = useRef(new Set<string>())
  const timers = useRef<number[]>([])

  // Join the lobby.
  const lobby = live?.phase === 'lobby'
  useEffect(() => {
    if (!enabled || !lobby) return
    let i = 0
    const id = window.setInterval(() => {
      if (i >= bots.length) return window.clearInterval(id)
      void api.sendLive({ type: 'join', participantId: bots[i++].id })
    }, 120)
    return () => window.clearInterval(id)
  }, [enabled, lobby, bots, api])

  // Answer when a question opens.
  const phase = live?.phase
  const index = live?.index
  useEffect(() => {
    if (!enabled || !live || !ctx || phase !== 'open' || index === undefined) return
    const q = questionAt(ctx, index)
    if (!q || answered.current.has(`${live.episodeId}:${q.id}`)) return
    answered.current.add(`${live.episodeId}:${q.id}`)
    const rnd = mulberry32(seed * 1000 + index)
    const limit = limitSecAt(ctx, index)
    bots.forEach((bot) => {
      if (!live.joined.includes(bot.id) || live.waiting.includes(bot.id)) return
      const move = botMove(q, ctx.keys[q.id], bot, rnd)
      if (!move.value || rnd() < 0.05) return
      const value = move.value
      timers.current.push(window.setTimeout(() => void api.sendLive({ type: 'answer', participantId: bot.id, value }), move.thinks * limit * 1000))
    })
    return () => {
      // A new phase cancels answers that were still on their way.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, phase, index, live?.episodeId])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  return bots
}
