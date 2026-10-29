import { storage } from './storage'

/**
 * Edits made to a table, kept as a flat map of overrides on top of the original rows: `{ "rowId|column": value }`.
 * The source rows never change, and undo is simply going back to an earlier map.
 */
export type Edits = Record<string, number | string>

/** The key an override is stored under. */
export const editKey = (rowId: string, part: string): string => `${rowId}|${part}`

/** Reads saved edits from this browser. Anything that is not a number or string is ignored. */
export function loadEdits(storageKey: string): Edits {
  const raw = storage.get(storageKey)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Edits = {}
    for (const [k, v] of Object.entries(parsed)) if (typeof v === 'number' || typeof v === 'string') out[k] = v
    return out
  } catch {
    return {}
  }
}

export function saveEdits(storageKey: string, edits: Edits): void {
  storage.set(storageKey, JSON.stringify(edits))
}

export function sameEdits(a: Edits, b: Edits): boolean {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k])
}
