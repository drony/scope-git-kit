import { useCallback, useState } from 'react'
import { storage } from '@/kit/lib/storage'

/**
 * State for a "Try it" checklist: which steps are done and whether the list is shown.
 * `eventToTask` maps an event (what a DataGrid reports, or anything you define) to the step it completes.
 * Pass a constant defined outside the component so the callbacks stay stable.
 */
export function useTryList<E extends string = string>(
  storageKey: string,
  eventToTask: Partial<Record<E, string>>,
  /** Whether the list is shown the first time, before the person has opened or closed it. */
  defaultOpen = true,
) {
  const [open, setOpenState] = useState(() => {
    const saved = storage.get(storageKey)
    return saved === null ? defaultOpen : saved !== 'closed'
  })
  const [done, setDone] = useState<ReadonlySet<string>>(() => new Set())

  const setOpen = useCallback(
    (value: boolean) => {
      setOpenState(value)
      storage.set(storageKey, value ? 'open' : 'closed')
    },
    [storageKey],
  )

  const mark = useCallback((id: string) => setDone((prev) => (prev.has(id) ? prev : new Set(prev).add(id))), [])

  const onInteraction = useCallback(
    (event: E) => {
      const id = eventToTask[event]
      if (id) mark(id)
    },
    [eventToTask, mark],
  )

  return { open, setOpen, done, mark, onInteraction }
}
