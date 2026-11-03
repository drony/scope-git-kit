import { useEffect, useMemo } from 'react'
import { useNow } from '@/kit/hooks/useNow'
import type { LiveCommand, LiveState } from '../data/types'
import type { LiveContext } from '../lib/live'
import { useAnswerKeys, useEpisodes, useLive, useQuestions } from './useContestData'

/**
 * Everything a screen needs to show the live show: its state, the context the state machine needs (the show, the questions and
 * the keys), a `send` for commands, and the server's clock in milliseconds. The state is asked for again every `pollMs`.
 */
export function useLiveShow(pollMs = 400): { live: LiveState | null | undefined; ctx: LiveContext | null; send: (command: LiveCommand) => Promise<LiveState | null>; now: number } {
  const live = useLive(pollMs)
  const episodes = useEpisodes()
  const questions = useQuestions()
  const keys = useAnswerKeys((questions.data ?? []).map((q) => q.id))
  const now = useNow(100)

  // When the show ends its result is saved on the episode: read the episodes again.
  const finished = live.data?.phase === 'finished'
  useEffect(() => {
    if (finished) void episodes.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  const episode = live.data ? episodes.data?.find((e) => e.id === live.data!.episodeId) : undefined
  const ctx = useMemo<LiveContext | null>(() => (episode && questions.data && keys.data ? { episode, questions: questions.data, keys: keys.data } : null), [episode, questions.data, keys.data])
  return { live: live.data, ctx, send: (c) => live.send(c), now }
}
