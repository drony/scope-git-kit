import { useCallback, useEffect, useRef, useState } from 'react'

export interface Resource<T> {
  data: T | undefined
  loading: boolean
  error: string | undefined
  /** Loads again, keeping the old data on screen meanwhile. */
  reload: () => Promise<void>
  /** Runs a change, then reloads. Rejects with the original error so the caller can show it next to its form. */
  mutate: <R>(change: () => Promise<R>) => Promise<R>
}

/** Loads one thing from the adapter and keeps it in state. The small base the other contest hooks are built on. */
export function useResource<T>(load: () => Promise<T>, deps: unknown[] = [], options: { pollMs?: number } = {}): Resource<T> {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const alive = useRef(true)
  const loader = useRef(load)
  loader.current = load

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const reload = useCallback(async () => {
    try {
      const next = await loader.current()
      if (alive.current) {
        setData(next)
        setError(undefined)
      }
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      if (alive.current) setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void reload(), [reload, ...deps])

  // News that arrives from elsewhere (a bell, a live score) needs asking again now and then.
  const { pollMs } = options
  useEffect(() => {
    if (!pollMs) return
    const id = window.setInterval(() => void reload(), pollMs)
    return () => window.clearInterval(id)
  }, [pollMs, reload])

  const mutate = useCallback(
    async <R,>(change: () => Promise<R>) => {
      const result = await change()
      await reload()
      return result
    },
    [reload],
  )

  return { data, loading, error, reload, mutate }
}
