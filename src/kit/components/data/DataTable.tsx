import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/kit/lib/cn'

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  /** Defaults to left for the first column and right for the rest. */
  align?: 'left' | 'right' | 'center'
  /** Provide a value to make the column sortable. */
  sortValue?: (row: T) => number | string
  width?: string | number
}

type Dir = 'asc' | 'desc'

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  selectedKey?: string
  dense?: boolean
  initialSort?: { key: string; dir: Dir }
  caption: string
  empty?: ReactNode
  /** Extra classes for a row, e.g. `is-linked` to highlight rows tied to something hovered elsewhere. */
  rowClassName?: (row: T) => string | undefined
  /** Called with the row under the pointer or keyboard focus, and with null when it leaves. */
  onRowHover?: (row: T | null) => void
  /** Called when the person changes the sort; undefined when sorting is switched off. */
  onSortChange?: (sort: { key: string; dir: Dir } | undefined) => void
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  selectedKey,
  dense,
  initialSort,
  caption,
  empty,
  rowClassName,
  onRowHover,
  onSortChange,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: Dir } | undefined>(initialSort)

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key)
    if (!sort || !col?.sortValue) return rows
    const get = col.sortValue
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const x = get(a)
      const y = get(b)
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * factor
      return String(x).localeCompare(String(y)) * factor
    })
  }, [rows, columns, sort])

  const toggle = (key: string) => {
    const next: { key: string; dir: Dir } | undefined = sort?.key === key ? (sort.dir === 'asc' ? { key, dir: 'desc' } : undefined) : { key, dir: 'asc' }
    setSort(next)
    onSortChange?.(next)
  }

  const alignClass = (c: Column<T>, i: number) => {
    const a = c.align ?? (i === 0 ? 'left' : 'right')
    return a === 'left' ? 'is-left' : a === 'center' ? 'is-center' : undefined
  }

  const onRowKey = (e: KeyboardEvent, row: T) => {
    // Keys pressed on a control inside the row (a star, a link) belong to that control.
    if (e.target !== e.currentTarget) return
    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onRowClick(row)
    }
  }

  return (
    <div className={cn('tbl-wrap', className)}>
      <table className={cn('tbl', dense && 'tbl-dense')}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c, i) => {
              const active = sort?.key === c.key
              const Icon = !active ? ChevronsUpDown : sort?.dir === 'asc' ? ArrowUp : ArrowDown
              return (
                <th
                  key={c.key}
                  scope="col"
                  className={alignClass(c, i)}
                  style={{ width: c.width }}
                  aria-sort={active ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : c.sortValue ? 'none' : undefined}
                >
                  {c.sortValue ? (
                    <button type="button" className="tbl-sort" onClick={() => toggle(c.key)}>
                      {c.header}
                      <Icon aria-hidden="true" />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const key = rowKey(row)
            return (
              <tr
                key={key}
                className={cn(onRowClick && 'is-clickable', selectedKey === key && 'is-selected', rowClassName?.(row))}
                onPointerEnter={onRowHover ? () => onRowHover(row) : undefined}
                onPointerLeave={onRowHover ? () => onRowHover(null) : undefined}
                onFocus={onRowHover ? () => onRowHover(row) : undefined}
                onBlur={onRowHover ? () => onRowHover(null) : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (e) => onRowKey(e, row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {columns.map((c, i) => (
                  <td key={c.key} className={alignClass(c, i)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      {!sorted.length && empty}
    </div>
  )
}
