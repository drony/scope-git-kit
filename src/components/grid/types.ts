import type { ReactNode } from 'react'

export type CellValue = number | string | null

/**
 * One column. `columns[0]` is the row-label column: it is pinned, always visible and never editable.
 * Everything after it is a value column.
 */
export interface GridColumn<R> {
  id: string
  header: string
  /** Raw value used for sorting, editing, sums, copy and export. */
  value: (row: R) => CellValue
  /** Formats a number for display, in totals and in subtotals. */
  format?: (n: number) => ReactNode
  /** Custom cell content for a row. Defaults to `format(value)` or the plain value. */
  render?: (row: R, value: CellValue) => ReactNode
  editable?: boolean
  /** Always visible; the Columns menu cannot hide it. */
  locked?: boolean
  /** Hidden until switched on in the Columns menu. */
  hidden?: boolean
  /** Highlights the column (the month being reviewed). */
  focus?: boolean
  /** Totals row and group subtotals. `'sum'` adds the raw values and runs them through `format`. */
  summary?: 'sum' | ((rows: R[]) => ReactNode)
  minWidth?: number
}

export interface GroupOption<R> {
  id: string
  label: string
  key: (row: R) => string
  title: (key: string) => string
  /** Group order. Groups not listed follow in the order they first appear. */
  order?: string[]
}

export interface FilterDef<R> {
  id: string
  label: string
  options: { value: string; label: string }[]
  /** A row passes when it matches any selected option. */
  test: (row: R, value: string) => boolean
}

export interface CellChange {
  rowId: string
  colId: string
  value: number | string
}

export interface GridHistory {
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

export interface GridSave {
  dirty: boolean
  onSave: () => void
}

export interface DataGridHandle {
  exportCsv: () => void
}
