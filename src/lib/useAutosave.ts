import { useCallback, useEffect, useRef, useState } from 'react'
import { storage } from './storage'

export type SaveStatus = 'saved' | 'saving' | 'unsaved'

interface Options<T> {
  /** The current value; saving is re-scheduled whenever it changes. */
  value: T
  /** True when the value differs from what was last saved. */
  dirty: boolean
  /** Persists the value. */
  save: () => void
  /** Remembers the person's on/off choice in this browser. */
  storageKey: string
  /** How long to wait after the last change before saving (ms). */
  delay?: number
}

/**
 * Autosave with a debounce. `status` is "saving" while a change waits to be written, "saved" once it is,
 * and "unsaved" when autosave is switched off and there are pending changes.
 */
export function useAutosave<T>({ value, dirty, save, storageKey, delay = 900 }: Options<T>) {
  const prefKey = `${storageKey}.autosave`
  const [enabled, setEnabledState] = useState(() => storage.get(prefKey) !== 'off')
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  // The timer must always call the latest `save`, not the one from the render that scheduled it.
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  })

  const saveNow = useCallback(() => {
    saveRef.current()
    setSavedAt(new Date())
  }, [])

  useEffect(() => {
    if (!enabled || !dirty) return
    const timer = window.setTimeout(saveNow, delay)
    return () => window.clearTimeout(timer)
  }, [enabled, dirty, value, delay, saveNow])

  const setEnabled = useCallback(
    (on: boolean) => {
      setEnabledState(on)
      storage.set(prefKey, on ? 'on' : 'off')
    },
    [prefKey],
  )

  const status: SaveStatus = dirty ? (enabled ? 'saving' : 'unsaved') : 'saved'
  return { enabled, setEnabled, status, savedAt, saveNow }
}
