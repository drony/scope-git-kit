import { useCallback, useState } from 'react'

interface State<T> {
  past: T[]
  present: T
  future: T[]
}

const LIMIT = 100

/** State with undo and redo. Every `set` that changes the value is one undo step. */
export function useHistory<T>(initial: T | (() => T)) {
  const [state, setState] = useState<State<T>>(() => ({
    past: [],
    present: typeof initial === 'function' ? (initial as () => T)() : initial,
    future: [],
  }))

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setState((s) => {
      const value = typeof next === 'function' ? (next as (prev: T) => T)(s.present) : next
      if (Object.is(value, s.present)) return s
      return { past: [...s.past.slice(-(LIMIT - 1)), s.present], present: value, future: [] }
    })
  }, [])

  const undo = useCallback(() => {
    setState((s) => {
      if (!s.past.length) return s
      const previous = s.past[s.past.length - 1]
      return { past: s.past.slice(0, -1), present: previous, future: [s.present, ...s.future] }
    })
  }, [])

  const redo = useCallback(() => {
    setState((s) => {
      if (!s.future.length) return s
      const [next, ...rest] = s.future
      return { past: [...s.past, s.present], present: next, future: rest }
    })
  }, [])

  /** Replaces the value and clears the history (e.g. after loading). */
  const reset = useCallback((value: T) => setState({ past: [], present: value, future: [] }), [])

  return {
    value: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }
}
