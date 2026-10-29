import { useCallback, useSyncExternalStore } from 'react'
import { storage } from '@/kit/lib/storage'

interface Store {
  value: ReadonlySet<string>
  listeners: Set<() => void>
}

const stores = new Map<string, Store>()

/** One store per key, created on first use and shared by every component that asks for it. */
function storeFor(key: string, initial: readonly string[]): Store {
  let store = stores.get(key)
  if (!store) {
    let items: string[] = [...initial]
    const raw = storage.get(key)
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed)) items = parsed.filter((x): x is string => typeof x === 'string')
      } catch {
        /* keep the initial items */
      }
    }
    store = { value: new Set(items), listeners: new Set() }
    stores.set(key, store)
  }
  return store
}

/**
 * A set of strings (ids, symbols …) kept in this browser and shared across the app: when one component changes it,
 * every component reading the same key updates. Use it for things like a watchlist or favorites.
 */
export function useStoredSet(key: string, initial: readonly string[] = []) {
  const store = storeFor(key, initial)
  const items = useSyncExternalStore(
    (notify) => {
      store.listeners.add(notify)
      return () => {
        store.listeners.delete(notify)
      }
    },
    () => store.value,
    () => store.value,
  )

  const write = useCallback(
    (next: Set<string>) => {
      store.value = next
      storage.set(key, JSON.stringify([...next]))
      store.listeners.forEach((notify) => notify())
    },
    [store, key],
  )

  /** Adds the item if it is missing, removes it if present. Returns whether it is now in the set. */
  const toggle = useCallback(
    (item: string): boolean => {
      const next = new Set(store.value)
      if (!next.delete(item)) next.add(item)
      write(next)
      return next.has(item)
    },
    [store, write],
  )

  return { items, size: items.size, has: (item: string) => items.has(item), toggle }
}
