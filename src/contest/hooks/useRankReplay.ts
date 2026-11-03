import { useEffect, useMemo, useRef, useState } from 'react'
import { storage } from '@/kit/lib/storage'
import type { Id } from '../data/types'
import { rankChanges, type RankedRow } from '../lib/ranking'

/**
 * "What changed since I last looked?" for a ranking. It remembers the ranking the person saw last time (in this browser),
 * shows that one first, then moves to the current one after a short pause, so the rows slide into their new places.
 * `changes` holds how many places each person gained (positive) or lost, ready for `Leaderboard`.
 *
 * `storageKey` tells rankings apart (the participants' board and the organisers' board, say).
 */
export function useRankReplay(ranked: RankedRow[], storageKey: string, pauseMs = 700): { rows: RankedRow[]; changes: Record<Id, number> | undefined } {
  const key = `contest.ranks.${storageKey}`
  const before = useRef<RankedRow[] | null>(null)
  if (before.current === null) {
    try {
      const raw = storage.get(key)
      before.current = raw ? (JSON.parse(raw) as RankedRow[]) : []
    } catch {
      before.current = []
    }
  }
  const [rows, setRows] = useState<RankedRow[]>(before.current)

  useEffect(() => {
    if (ranked.length === 0) return
    const timer = window.setTimeout(() => setRows(ranked), before.current && before.current.length > 0 ? pauseMs : 0)
    storage.set(key, JSON.stringify(ranked))
    return () => window.clearTimeout(timer)
  }, [ranked, key, pauseMs])

  const changes = useMemo(() => (before.current && before.current.length > 0 ? rankChanges(before.current, ranked) : undefined), [ranked])
  return { rows, changes }
}
