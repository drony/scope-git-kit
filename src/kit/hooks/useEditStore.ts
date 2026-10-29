import { useCallback, useState } from 'react'
import type { CellChange } from '@/kit/components/grid/types'
import { editKey, loadEdits, sameEdits, saveEdits, type Edits } from '@/kit/lib/edits'
import { useAutosave } from './useAutosave'
import { useHistory } from './useHistory'

/**
 * Everything an editable table needs besides its rows: the edits (loaded from this browser), undo and redo,
 * and autosave. Pass `history` to `<DataGrid history>` and `saveProps()` to `<DataGrid save>`.
 *
 *     const { edits, history, apply, saveProps } = useEditStore('my-table')
 *     <DataGrid onEdit={apply} history={history} save={saveProps()} … />
 *
 * Rows read their values through `edits[editKey(rowId, columnId)] ?? original`.
 */
export function useEditStore(storageKey: string) {
  const history = useHistory<Edits>(() => loadEdits(storageKey))
  const [saved, setSaved] = useState<Edits>(history.value)
  const edits = history.value
  const dirty = !sameEdits(edits, saved)

  const autosave = useAutosave({
    value: edits,
    dirty,
    storageKey,
    save: () => {
      saveEdits(storageKey, edits)
      setSaved(edits)
    },
  })

  const setEdits = history.set
  /** Records changes from the grid as one undo step. `columnPart` maps a column id to the key part, e.g. to drop a prefix. */
  const apply = useCallback(
    (changes: CellChange[], columnPart: (colId: string) => string = (id) => id) =>
      setEdits((prev) => {
        const next = { ...prev }
        for (const c of changes) next[editKey(c.rowId, columnPart(c.colId))] = c.value
        return next
      }),
    [setEdits],
  )

  /** Props for `<DataGrid save>`. `onSave` runs after a manual save, e.g. to show a message. */
  const saveProps = (onSave?: () => void) => ({
    status: autosave.status,
    savedAt: autosave.savedAt,
    onSave: () => {
      autosave.saveNow()
      onSave?.()
    },
    autosave: autosave.enabled,
    onAutosave: autosave.setEnabled,
  })

  return { edits, history, dirty, apply, saveProps, autosave }
}
