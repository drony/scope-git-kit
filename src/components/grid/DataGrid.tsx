import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
  Ellipsis,
  Expand,
  Layers,
  Pin,
  Redo2,
  RotateCcw,
  Save,
  Search as SearchIcon,
  Shrink,
  Undo2,
  X,
  Check,
} from 'lucide-react'
import { useSite } from '@/context/ConfigContext'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/cn'
import { storage } from '@/lib/storage'
import { Button } from '@/components/ui/Button'
import { Dot } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/Feedback'
import { SearchInput } from '@/components/forms/Field'
import { Select } from '@/components/forms/Select'
import { Menu, type MenuEntry } from '@/components/overlays/Menu'
import { CellEditor, type CommitDirection } from './CellEditor'
import { ColumnsMenu, FilterMenu, SortMenu, ViewMenu, type Density, type SortState } from './GridMenus'
import { columnLetter, csvDelimiter, downloadText, parseNumber, plainNumber, toCsv } from './gridUtils'
import { useGridText } from './text'
import type { CellChange, DataGridHandle, FilterDef, GridColumn, GridHistory, GridSave, GroupOption } from './types'

/* ---- types ------------------------------------------------------------------------------ */

interface Cell {
  r: string
  c: string
}

interface Editing extends Cell {
  initial: string
  selectAll: boolean
}

type Item<R> = { kind: 'group'; key: string; title: string; rows: R[] } | { kind: 'row'; id: string; row: R }

interface View {
  hidden: string[]
  density: Density
  group: string
  totals: boolean
  pageSize: number
}

const PAGE_SIZES = [10, 25, 50, 100]
const NO_FILTERS: never[] = []

export interface DataGridProps<R> {
  /** Shown in the header and used as the table's accessible name. */
  title: string
  /** Small label next to the title, e.g. the currency. */
  unit?: string
  columns: GridColumn<R>[]
  rows: R[]
  rowId: (row: R) => string
  /** What the search box looks at. Defaults to the row-label column. */
  searchText?: (row: R) => string
  /** Receives every edit or paste as one batch (one undo step). Omit for a read-only table. */
  onEdit?: (changes: CellChange[]) => void
  groups?: GroupOption<R>[]
  defaultGroup?: string
  filters?: FilterDef<R>[]
  /** Content of the panel shown under a row when its chevron is opened. */
  detail?: (row: R) => ReactNode
  totalLabel?: string
  history?: GridHistory
  save?: GridSave
  /** Used to remember column visibility, density and page size in this browser. */
  storageKey: string
  /** Lets the page call `exportCsv()` from its own button. */
  apiRef?: MutableRefObject<DataGridHandle | null>
}

/* ---- helpers ----------------------------------------------------------------------------- */

function defaultView<R>(columns: GridColumn<R>[], defaultGroup?: string): View {
  return {
    hidden: columns.filter((c) => c.hidden).map((c) => c.id),
    density: 'comfortable',
    group: defaultGroup ?? 'none',
    totals: true,
    pageSize: 25,
  }
}

function readView<R>(storageKey: string, columns: GridColumn<R>[], defaultGroup?: string): View {
  const base = defaultView(columns, defaultGroup)
  const raw = storage.get(`finscope.grid.${storageKey}`)
  if (!raw) return base
  try {
    const p = JSON.parse(raw) as Partial<View>
    return {
      hidden: Array.isArray(p.hidden) ? p.hidden.filter((x): x is string => typeof x === 'string') : base.hidden,
      density: p.density === 'compact' ? 'compact' : 'comfortable',
      group: typeof p.group === 'string' ? p.group : base.group,
      totals: p.totals !== false,
      pageSize: PAGE_SIZES.includes(Number(p.pageSize)) ? Number(p.pageSize) : base.pageSize,
    }
  } catch {
    return base
  }
}

function summarize<R>(col: GridColumn<R>, list: R[]): ReactNode {
  if (!col.summary) return null
  if (typeof col.summary === 'function') return col.summary(list)
  let sum = 0
  for (const row of list) {
    const v = col.value(row)
    if (typeof v === 'number') sum += v
  }
  return col.format ? col.format(sum) : String(sum)
}

function cellContent<R>(row: R, col: GridColumn<R>): ReactNode {
  const v = col.value(row)
  if (col.render) return col.render(row, v)
  if (typeof v === 'number') return col.format ? col.format(v) : String(v)
  return v ?? ''
}

/* ---- component ---------------------------------------------------------------------------- */

export function DataGrid<R>({
  title,
  unit,
  columns,
  rows,
  rowId,
  searchText,
  onEdit,
  groups,
  defaultGroup,
  filters,
  detail,
  totalLabel,
  history,
  save,
  storageKey,
  apiRef,
}: DataGridProps<R>) {
  const t = useGridText()
  const { locale } = useSite()
  const toast = useToast()
  const tableRef = useRef<HTMLTableElement>(null)
  const filterDefs: FilterDef<R>[] = filters ?? NO_FILTERS

  const [view, setView] = useState<View>(() => readView(storageKey, columns, defaultGroup))
  useEffect(() => {
    storage.set(`finscope.grid.${storageKey}`, JSON.stringify(view))
  }, [view, storageKey])

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [sort, setSort] = useState<SortState | null>(null)
  const [page, setPage] = useState(1)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const [checked, setChecked] = useState<Set<string>>(() => new Set())
  const [active, setActive] = useState<Cell | null>(null)
  const [anchor, setAnchor] = useState<Cell | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [invalid, setInvalid] = useState(false)
  const focusAfter = useRef(false)

  /* ---- columns ------------------------------------------------------------------------- */

  const visibleCols = useMemo(
    () => columns.filter((c, i) => i === 0 || c.locked || !view.hidden.includes(c.id)),
    [columns, view.hidden],
  )
  const nameCol = visibleCols[0]
  const valueCols = useMemo(() => visibleCols.slice(1), [visibleCols])
  const colById = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns])
  const rowById = useMemo(() => new Map(rows.map((r) => [rowId(r), r])), [rows, rowId])

  /* ---- filter, sort, page, group ------------------------------------------------------------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (q) {
        const hay = searchText ? searchText(r) : String(nameCol.value(r) ?? '')
        if (!hay.toLowerCase().includes(q)) return false
      }
      return filterDefs.every((def) => {
        const sel = selected[def.id]
        return !sel?.length || sel.some((v) => def.test(r, v))
      })
    })
  }, [rows, query, selected, filterDefs, searchText, nameCol])

  const sorted = useMemo(() => {
    const col = sort ? colById.get(sort.col) : undefined
    if (!sort || !col) return filtered
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const x = col.value(a)
      const y = col.value(b)
      if (x === y) return 0
      if (x === null) return 1
      if (y === null) return -1
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * factor
      return String(x).localeCompare(String(y), locale) * factor
    })
  }, [filtered, sort, colById, locale])

  const pageCount = Math.max(1, Math.ceil(sorted.length / view.pageSize))
  const current = Math.min(page, pageCount)
  const pageRows = useMemo(() => sorted.slice((current - 1) * view.pageSize, current * view.pageSize), [sorted, current, view.pageSize])

  const groupOption = groups?.find((g) => g.id === view.group)

  const items = useMemo<Item<R>[]>(() => {
    if (!groupOption) return pageRows.map((row) => ({ kind: 'row', id: rowId(row), row }))
    const map = new Map<string, R[]>()
    for (const row of pageRows) {
      const key = groupOption.key(row)
      const list = map.get(key)
      if (list) list.push(row)
      else map.set(key, [row])
    }
    const rank = (k: string) => {
      const i = groupOption.order?.indexOf(k) ?? -1
      return i < 0 ? 1e6 : i
    }
    const out: Item<R>[] = []
    for (const key of [...map.keys()].sort((a, b) => rank(a) - rank(b))) {
      const list = map.get(key) ?? []
      out.push({ kind: 'group', key, title: groupOption.title(key), rows: list })
      if (!collapsed.has(key)) for (const row of list) out.push({ kind: 'row', id: rowId(row), row })
    }
    return out
  }, [pageRows, groupOption, collapsed, rowId])

  /** Row ids in display order (the rows the keyboard can move through). */
  const navRows = useMemo(() => items.flatMap((i) => (i.kind === 'row' ? [i.id] : [])), [items])
  const navIndex = useMemo(() => new Map(navRows.map((id, i) => [id, i])), [navRows])
  /** Spreadsheet-style row numbers: the header is row 1, group headings count as rows. */
  const lineNo = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((item, i) => {
      if (item.kind === 'row') map.set(item.id, i + 2)
    })
    return map
  }, [items])

  /* ---- selection ---------------------------------------------------------------------------- */

  const firstCell: Cell | null = navRows.length && valueCols.length ? { r: navRows[0], c: valueCols[0].id } : null
  const cursor: Cell | null =
    active && navIndex.has(active.r) && valueCols.some((c) => c.id === active.c) ? active : firstCell
  const anchorCell: Cell | null =
    anchor && navIndex.has(anchor.r) && valueCols.some((c) => c.id === anchor.c) ? anchor : cursor

  const range = useMemo(() => {
    if (!cursor || !anchorCell) return null
    const r1 = navIndex.get(anchorCell.r)
    const r2 = navIndex.get(cursor.r)
    const c1 = valueCols.findIndex((c) => c.id === anchorCell.c)
    const c2 = valueCols.findIndex((c) => c.id === cursor.c)
    if (r1 === undefined || r2 === undefined || c1 < 0 || c2 < 0) return null
    return { r0: Math.min(r1, r2), r1: Math.max(r1, r2), c0: Math.min(c1, c2), c1: Math.max(c1, c2) }
  }, [cursor, anchorCell, navIndex, valueCols])

  const selection = useMemo(() => {
    if (!range || !active) return null
    let sum = 0
    let count = 0
    for (let r = range.r0; r <= range.r1; r++) {
      const row = rowById.get(navRows[r])
      if (!row) continue
      for (let c = range.c0; c <= range.c1; c++) {
        const v = valueCols[c].value(row)
        if (typeof v === 'number') {
          sum += v
          count++
        }
      }
    }
    const at = (r: number, c: number) => `${columnLetter(c + 1)}${lineNo.get(navRows[r]) ?? ''}`
    const single = range.r0 === range.r1 && range.c0 === range.c1
    return {
      address: single ? at(range.r0, range.c0) : `${at(range.r0, range.c0)}:${at(range.r1, range.c1)}`,
      sum,
      count,
      col: valueCols[range.c0],
    }
  }, [range, active, rowById, navRows, valueCols, lineNo])

  // After the keyboard moves the cursor (or an edit ends) the new cell needs real DOM focus.
  useEffect(() => {
    if (!focusAfter.current || !active || editing) return
    focusAfter.current = false
    const key = `${active.r}|${active.c}`
    const el = Array.from(tableRef.current?.querySelectorAll<HTMLElement>('[data-cell]') ?? []).find((n) => n.dataset.cell === key)
    el?.focus()
  }, [active, editing])

  const select = (cell: Cell, extend: boolean) => {
    setActive(cell)
    setAnchor(extend ? (anchorCell ?? cell) : cell)
  }

  const moveTo = (ri: number, ci: number, extend: boolean) => {
    const r = navRows[ri]
    const c = valueCols[ci]
    if (r === undefined || !c) return
    focusAfter.current = true
    select({ r, c: c.id }, extend)
  }

  /* ---- editing ---------------------------------------------------------------------------------- */

  const startEdit = (cell: Cell, typed?: string) => {
    const col = colById.get(cell.c)
    const row = rowById.get(cell.r)
    if (!onEdit || !col?.editable || !row) return
    const v = col.value(row)
    setInvalid(false)
    setEditing({ ...cell, initial: typed ?? (typeof v === 'number' ? plainNumber(v, locale) : (v ?? '')), selectAll: typed === undefined })
  }

  const commitEdit = (text: string, direction: CommitDirection, fromBlur: boolean): boolean => {
    if (!editing) return true
    const col = colById.get(editing.c)
    const row = rowById.get(editing.r)
    if (!col || !row) {
      setEditing(null)
      return true
    }
    const currentValue = col.value(row)
    let next: number | string
    if (typeof currentValue === 'number') {
      const n = parseNumber(text, locale)
      if (n === null) {
        if (fromBlur) {
          setEditing(null)
          return true
        }
        setInvalid(true)
        return false
      }
      next = n
    } else {
      next = text
    }
    if (next !== currentValue) onEdit?.([{ rowId: editing.r, colId: editing.c, value: next }])

    const ri = navIndex.get(editing.r) ?? 0
    const ci = valueCols.findIndex((c) => c.id === editing.c)
    setEditing(null)
    if (!fromBlur) {
      let nr = ri
      let nc = ci
      if (direction === 'down') nr = Math.min(navRows.length - 1, ri + 1)
      else if (direction === 'right') nc = Math.min(valueCols.length - 1, ci + 1)
      else if (direction === 'left') nc = Math.max(0, ci - 1)
      moveTo(nr, nc, false)
    }
    return true
  }

  const clearRange = () => {
    if (!range || !onEdit) return
    const changes: CellChange[] = []
    for (let r = range.r0; r <= range.r1; r++) {
      const row = rowById.get(navRows[r])
      if (!row) continue
      for (let c = range.c0; c <= range.c1; c++) {
        const col = valueCols[c]
        const v = col.value(row)
        if (col.editable && v !== 0 && v !== '') changes.push({ rowId: navRows[r], colId: col.id, value: typeof v === 'number' ? 0 : '' })
      }
    }
    if (changes.length) onEdit(changes)
  }

  /* ---- keyboard, copy, paste ---------------------------------------------------------------------- */

  const onKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    if (editing) return
    const mod = e.metaKey || e.ctrlKey
    const key = e.key.toLowerCase()
    if (mod && key === 'z' && history) {
      e.preventDefault()
      if (e.shiftKey) history.redo()
      else history.undo()
      return
    }
    if (mod && key === 'y' && history) {
      e.preventDefault()
      history.redo()
      return
    }
    if (!cursor) return
    const ri = navIndex.get(cursor.r) ?? 0
    const ci = valueCols.findIndex((c) => c.id === cursor.c)
    let nr = ri
    let nc = ci
    switch (e.key) {
      case 'ArrowDown':
        nr = Math.min(navRows.length - 1, ri + 1)
        break
      case 'ArrowUp':
        nr = Math.max(0, ri - 1)
        break
      case 'ArrowRight':
        nc = Math.min(valueCols.length - 1, ci + 1)
        break
      case 'ArrowLeft':
        nc = Math.max(0, ci - 1)
        break
      case 'PageDown':
        nr = Math.min(navRows.length - 1, ri + 10)
        break
      case 'PageUp':
        nr = Math.max(0, ri - 10)
        break
      case 'Home':
        nc = 0
        if (mod) nr = 0
        break
      case 'End':
        nc = valueCols.length - 1
        if (mod) nr = navRows.length - 1
        break
      case 'Tab': {
        const step = e.shiftKey ? -1 : 1
        nc = ci + step
        if (nc >= valueCols.length) {
          nc = 0
          nr = ri + 1
        } else if (nc < 0) {
          nc = valueCols.length - 1
          nr = ri - 1
        }
        // At the very first or last cell Tab leaves the table as usual.
        if (nr < 0 || nr >= navRows.length) return
        break
      }
      case 'Enter':
      case 'F2':
        if (colById.get(cursor.c)?.editable) {
          e.preventDefault()
          startEdit(cursor)
        }
        return
      case 'Escape':
        if (anchor) setAnchor(cursor)
        return
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        clearRange()
        return
      default:
        if (e.key.length === 1 && !mod && !e.altKey && colById.get(cursor.c)?.editable) {
          // preventDefault stops the character from also being typed a second time into the new input.
          e.preventDefault()
          startEdit(cursor, e.key)
        }
        return
    }
    e.preventDefault()
    moveTo(nr, nc, e.shiftKey && e.key !== 'Tab')
  }

  const onCopy = (e: ClipboardEvent<HTMLTableElement>) => {
    if (editing || !range) return
    const lines: string[] = []
    for (let r = range.r0; r <= range.r1; r++) {
      const row = rowById.get(navRows[r])
      if (!row) continue
      lines.push(
        valueCols
          .slice(range.c0, range.c1 + 1)
          .map((c) => {
            const v = c.value(row)
            return typeof v === 'number' ? plainNumber(v, locale) : String(v ?? '')
          })
          .join('\t'),
      )
    }
    e.clipboardData.setData('text/plain', lines.join('\n'))
    e.preventDefault()
  }

  const onPaste = (e: ClipboardEvent<HTMLTableElement>) => {
    if (editing || !cursor || !onEdit) return
    const text = e.clipboardData.getData('text/plain')
    if (!text) return
    e.preventDefault()
    const matrix = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((line) => line.split('\t'))
    const r0 = navIndex.get(cursor.r) ?? 0
    const c0 = valueCols.findIndex((c) => c.id === cursor.c)
    const changes: CellChange[] = []
    matrix.forEach((line, dr) =>
      line.forEach((cellText, dc) => {
        const id = navRows[r0 + dr]
        const col = valueCols[c0 + dc]
        const row = id === undefined ? undefined : rowById.get(id)
        if (!row || !col?.editable) return
        const v = col.value(row)
        const parsed = typeof v === 'number' ? parseNumber(cellText, locale) : cellText.trim()
        if (parsed === null || parsed === v) return
        changes.push({ rowId: id, colId: col.id, value: parsed })
      }),
    )
    if (changes.length) {
      onEdit(changes)
      toast.push({ tone: 'success', title: t.pasted(changes.length) })
    }
  }

  /* ---- toolbar state -------------------------------------------------------------------------------- */

  const patchView = (partial: Partial<View>) => setView((v) => ({ ...v, ...partial }))
  const toggleIn = (setter: typeof setCollapsed, id: string) =>
    setter((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
  const activeFilters = filterDefs.filter((f) => selected[f.id]?.length)
  const clearFilters = () => {
    setSelected({})
    setPage(1)
  }

  const exportCsv = () => {
    const header = visibleCols.map((c) => c.header)
    const body = sorted.map((r) =>
      visibleCols.map((c) => {
        const v = c.value(r)
        return typeof v === 'number' ? plainNumber(v, locale) : String(v ?? '')
      }),
    )
    downloadText(`${storageKey}.csv`, toCsv([header, ...body], csvDelimiter(locale)))
  }
  useEffect(() => {
    if (!apiRef) return
    apiRef.current = { exportCsv }
    return () => {
      apiRef.current = null
    }
  })

  const moreEntries: MenuEntry[] = [
    { id: 'csv', label: t.exportCsv, icon: <Download aria-hidden="true" />, onSelect: exportCsv },
    ...(detail
      ? ([
          { id: 'expand', label: t.expandAll, icon: <Expand aria-hidden="true" />, onSelect: () => setOpen(new Set(navRows)) },
          { id: 'collapse', label: t.collapseAll, icon: <Shrink aria-hidden="true" />, onSelect: () => setOpen(new Set()) },
        ] satisfies MenuEntry[])
      : []),
    { type: 'separator', id: 'sep' },
    {
      id: 'reset',
      label: t.resetView,
      icon: <RotateCcw aria-hidden="true" />,
      onSelect: () => {
        setView(defaultView(columns, defaultGroup))
        setSort(null)
        setQuery('')
        clearFilters()
        setCollapsed(new Set())
        setOpen(new Set())
      },
    },
  ]

  const groupEntries: MenuEntry[] = [
    { id: 'none', label: t.noGrouping, icon: view.group === 'none' ? <Check aria-hidden="true" /> : <span style={{ width: '1rem' }} />, onSelect: () => patchView({ group: 'none' }) },
    ...(groups ?? []).map((g) => ({
      id: g.id,
      label: g.label,
      icon: view.group === g.id ? <Check aria-hidden="true" /> : <span style={{ width: '1rem' }} />,
      onSelect: () => patchView({ group: g.id }),
    })),
  ]

  const pageIds = pageRows.map(rowId)
  const allChecked = pageIds.length > 0 && pageIds.every((id) => checked.has(id))
  const someChecked = pageIds.some((id) => checked.has(id))
  const headCheck = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (headCheck.current) headCheck.current.indeterminate = someChecked && !allChecked
  }, [someChecked, allChecked])

  const colSpan = 2 + valueCols.length
  const from = sorted.length ? (current - 1) * view.pageSize + 1 : 0
  const to = (current - 1) * view.pageSize + pageRows.length

  /* ---- render -------------------------------------------------------------------------------------------- */

  const onCellClick = (e: MouseEvent, cell: Cell) => select(cell, e.shiftKey)

  return (
    <div className="grid-card" data-density={view.density}>
      <div className="g-head">
        <h2 className="g-title">
          {title}
          {unit && <span className="g-unit">{unit}</span>}
        </h2>
        <div className="g-head-actions">
          {save && (
            <span className="g-status" role="status">
              {save.dirty && <Dot tone="warning" />}
              {save.dirty ? t.unsaved : t.saved}
            </span>
          )}
          {history && (
            <>
              <Button variant="ghost" size="sm" icon aria-label={t.undo} title={`${t.undo} (⌘Z)`} disabled={!history.canUndo} onClick={history.undo}>
                <Undo2 aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="sm" icon aria-label={t.redo} title={`${t.redo} (⇧⌘Z)`} disabled={!history.canRedo} onClick={history.redo}>
                <Redo2 aria-hidden="true" />
              </Button>
            </>
          )}
          {save && (
            <>
              <span className="g-sep" aria-hidden="true" />
              <Button size="sm" disabled={!save.dirty} onClick={save.onSave}>
                <Save aria-hidden="true" />
                {t.save}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="g-toolbar" role="toolbar" aria-label={title}>
        <div className="g-search">
          <SearchInput
            value={query}
            onValueChange={(v) => {
              setQuery(v)
              setPage(1)
            }}
            placeholder={t.search}
            aria-label={t.searchLabel}
          />
        </div>
        {filterDefs.length > 0 && (
          <FilterMenu
            filters={filterDefs}
            selected={selected}
            onClear={clearFilters}
            onToggle={(id, value) => {
              setPage(1)
              setSelected((prev) => {
                const list = prev[id] ?? []
                return { ...prev, [id]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] }
              })
            }}
          />
        )}
        <SortMenu columns={visibleCols} sort={sort} onChange={setSort} />
        {groups && groups.length > 0 && (
          <Menu
            placement="bottom-start"
            entries={groupEntries}
            trigger={
              <Button variant="ghost" size="sm">
                <Layers aria-hidden="true" />
                {t.group}
              </Button>
            }
          />
        )}
        <span className="grow" />
        <ColumnsMenu
          columns={columns}
          hidden={view.hidden}
          onToggle={(id) => patchView({ hidden: view.hidden.includes(id) ? view.hidden.filter((h) => h !== id) : [...view.hidden, id] })}
          onRestore={() => patchView({ hidden: columns.filter((c) => c.hidden).map((c) => c.id) })}
        />
        <ViewMenu density={view.density} onDensity={(density) => patchView({ density })} totals={view.totals} onTotals={(totals) => patchView({ totals })} />
        <Menu
          entries={moreEntries}
          trigger={
            <Button variant="ghost" size="sm" icon aria-label={t.more}>
              <Ellipsis aria-hidden="true" />
            </Button>
          }
        />
      </div>

      {activeFilters.length > 0 && (
        <div className="g-chips">
          {activeFilters.map((def) => (
            <span className="g-chip" key={def.id}>
              <span>
                {def.label}: {def.options.filter((o) => selected[def.id]?.includes(o.value)).map((o) => o.label).join(', ')}
              </span>
              <button
                type="button"
                aria-label={`${t.removeFilter}: ${def.label}`}
                onClick={() => {
                  setSelected((prev) => ({ ...prev, [def.id]: [] }))
                  setPage(1)
                }}
              >
                <X aria-hidden="true" />
              </button>
            </span>
          ))}
          <button type="button" className="g-clear" onClick={clearFilters}>
            {t.clear}
          </button>
        </div>
      )}

      <div className="g-scroll">
        <table
          ref={tableRef}
          className="g-table"
          role="grid"
          aria-label={title}
          aria-colcount={colSpan}
          aria-multiselectable="true"
          onKeyDown={onKeyDown}
          onCopy={onCopy}
          onPaste={onPaste}
        >
          <thead>
            <tr>
              <th scope="col" className="g-sticky g-check-col">
                <label className="check g-check">
                  <input
                    ref={headCheck}
                    type="checkbox"
                    aria-label={t.selectAll}
                    checked={allChecked}
                    onChange={() =>
                      setChecked((prev) => {
                        const next = new Set(prev)
                        for (const id of pageIds) {
                          if (allChecked) next.delete(id)
                          else next.add(id)
                        }
                        return next
                      })
                    }
                  />
                </label>
              </th>
              {visibleCols.map((col, i) => {
                const on = sort?.col === col.id
                const SortIcon = !on ? ChevronsUpDown : sort?.dir === 'asc' ? ArrowUp : ArrowDown
                return (
                  <th
                    key={col.id}
                    scope="col"
                    className={cn(i === 0 ? 'g-sticky g-name-col' : 'g-num', col.focus && 'is-focus')}
                    style={{ minWidth: col.minWidth }}
                    aria-sort={on ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      className="g-sort"
                      onClick={() => setSort(!on ? { col: col.id, dir: 'asc' } : sort?.dir === 'asc' ? { col: col.id, dir: 'desc' } : null)}
                    >
                      {col.header}
                      <SortIcon aria-hidden="true" className={cn(!on && 'is-idle')} />
                    </button>
                    {i === 0 && <Pin size={14} aria-label={t.pinned} className="g-pin" />}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="g-empty">
                  <EmptyState
                    icon={<SearchIcon size={18} aria-hidden="true" />}
                    title={t.noResults}
                    action={
                      query || activeFilters.length ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setQuery('')
                            clearFilters()
                          }}
                        >
                          {t.clearFilters}
                        </Button>
                      ) : undefined
                    }
                  >
                    {t.noResultsHint}
                  </EmptyState>
                </td>
              </tr>
            )}

            {items.map((item) => {
              if (item.kind === 'group') {
                const isCollapsed = collapsed.has(item.key)
                return (
                  <tr className="g-group" key={`g-${item.key}`}>
                    <td className="g-sticky g-check-col">
                      <button
                        type="button"
                        className="g-toggle"
                        aria-expanded={!isCollapsed}
                        aria-label={`${isCollapsed ? t.expandGroup : t.collapseGroup}: ${item.title}`}
                        onClick={() => toggleIn(setCollapsed, item.key)}
                      >
                        <ChevronDown aria-hidden="true" className={cn(isCollapsed && 'is-closed')} />
                      </button>
                    </td>
                    <td className="g-sticky g-name-col">
                      <span className="g-group-title">{item.title}</span>
                      <span className="g-group-count">· {t.items(item.rows.length)}</span>
                    </td>
                    {valueCols.map((col) => (
                      <td key={col.id} className={cn('g-num g-sub', col.focus && 'is-focus')}>
                        {isCollapsed ? summarize(col, item.rows) : null}
                      </td>
                    ))}
                  </tr>
                )
              }

              const { row, id } = item
              const isChecked = checked.has(id)
              const isOpen = open.has(id)
              const label = String(nameCol.value(row) ?? '')
              const ri = navIndex.get(id) ?? -1
              const rowActive = cursor?.r === id && Boolean(active)
              return (
                <Fragment key={id}>
                  <tr className={cn('g-row', isChecked && 'is-checked', rowActive && 'has-active')} aria-selected={isChecked}>
                    <td className="g-sticky g-check-col">
                      <label className="check g-check">
                        <input
                          type="checkbox"
                          aria-label={t.selectRow(label)}
                          checked={isChecked}
                          onChange={() => toggleIn(setChecked, id)}
                        />
                      </label>
                    </td>
                    <td className="g-sticky g-name-col">
                      <div className="g-name">
                        {detail ? (
                          <button
                            type="button"
                            className="g-toggle"
                            aria-expanded={isOpen}
                            aria-label={`${isOpen ? t.collapseRow : t.expandRow}: ${label}`}
                            onClick={() => toggleIn(setOpen, id)}
                          >
                            <ChevronRight aria-hidden="true" className={cn(isOpen && 'is-open')} />
                          </button>
                        ) : null}
                        <span>{cellContent(row, nameCol)}</span>
                      </div>
                    </td>
                    {valueCols.map((col, ci) => {
                      const cellKey = `${id}|${col.id}`
                      const isActive = Boolean(active) && cursor?.r === id && cursor.c === col.id
                      const inRange = Boolean(active && range && ri >= range.r0 && ri <= range.r1 && ci >= range.c0 && ci <= range.c1)
                      const isEditing = editing?.r === id && editing.c === col.id
                      const isStop = cursor?.r === id && cursor.c === col.id
                      return (
                        <td
                          key={col.id}
                          role="gridcell"
                          data-cell={cellKey}
                          tabIndex={isStop && !isEditing ? 0 : -1}
                          aria-selected={isActive || inRange}
                          aria-readonly={!col.editable}
                          className={cn(
                            'g-cell',
                            typeof col.value(row) === 'number' ? 'g-num' : 'g-text',
                            col.focus && 'is-focus',
                            col.editable && 'is-editable',
                            inRange && !isActive && 'is-range',
                            isActive && 'is-active',
                            isEditing && 'is-editing',
                          )}
                          onClick={(e) => onCellClick(e, { r: id, c: col.id })}
                          onDoubleClick={() => startEdit({ r: id, c: col.id })}
                        >
                          {isEditing && editing ? (
                            <CellEditor
                              initial={editing.initial}
                              selectAll={editing.selectAll}
                              align={typeof col.value(row) === 'number' ? 'right' : 'left'}
                              invalid={invalid}
                              ariaLabel={`${col.header}: ${label}`}
                              onCommit={commitEdit}
                              onCancel={() => {
                                focusAfter.current = true
                                setEditing(null)
                              }}
                              onTyping={() => setInvalid(false)}
                            />
                          ) : (
                            cellContent(row, col)
                          )}
                        </td>
                      )
                    })}
                  </tr>
                  {detail && isOpen && (
                    <tr className="g-detail-row">
                      <td colSpan={colSpan}>
                        <div className="g-detail">{detail(row)}</div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>

          {view.totals && totalLabel && sorted.length > 0 && (
            <tfoot>
              <tr className="g-total">
                <td className="g-sticky g-check-col" />
                <td className="g-sticky g-name-col">{totalLabel}</td>
                {valueCols.map((col) => (
                  <td key={col.id} className={cn('g-num', col.focus && 'is-focus')}>
                    {summarize(col, sorted)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="g-foot">
        <span>
          {t.items(sorted.length)}
          {activeFilters.length > 0 && <> · {t.filtersActive(activeFilters.length)}</>}
          {checked.size > 0 && <> · {t.selected(checked.size)}</>}
        </span>
        {selection && (
          <span className="g-selection">
            <span>
              {t.selection}: <b>{selection.address}</b>
            </span>
            {selection.count > 0 && (
              <>
                <span className="g-sep" aria-hidden="true" />
                <span>
                  {t.total}: <b>{selection.col.format ? selection.col.format(selection.sum) : selection.sum}</b>
                </span>
              </>
            )}
          </span>
        )}
        <span className="grow" />
        <span className="g-pager">
          <span className="g-range">{t.range(from, to, sorted.length)}</span>
          <Button variant="ghost" size="sm" icon aria-label={t.prevPage} disabled={current <= 1} onClick={() => setPage(current - 1)}>
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" icon aria-label={t.nextPage} disabled={current >= pageCount} onClick={() => setPage(current + 1)}>
            <ChevronRight aria-hidden="true" />
          </Button>
          <span className="g-size">
            <Select<string>
              ariaLabel={t.rowsPerPage}
              value={String(view.pageSize)}
              onChange={(v) => {
                patchView({ pageSize: Number(v) })
                setPage(1)
              }}
              options={PAGE_SIZES.map((n) => ({ value: String(n), label: t.perPage(n) }))}
            />
          </span>
        </span>
      </div>
    </div>
  )
}
