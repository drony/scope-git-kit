import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Columns3, Filter, Lock, Rows3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/nav/Segmented'
import { Checkbox, Switch } from '@/components/forms/Controls'
import { SearchInput } from '@/components/forms/Field'
import { Popover } from '@/components/overlays/Popover'
import type { FilterDef, GridColumn } from './types'
import { useGridText } from './text'

export type Density = 'comfortable' | 'compact'
export interface SortState {
  col: string
  dir: 'asc' | 'desc'
}

function Count({ n }: { n: number }) {
  return n > 0 ? <span className="g-badge">{n}</span> : null
}

/* ---- Filter ---------------------------------------------------------------------- */

interface FilterMenuProps<R> {
  filters: FilterDef<R>[]
  selected: Record<string, string[]>
  onToggle: (filterId: string, value: string) => void
  onClear: () => void
}

export function FilterMenu<R>({ filters, selected, onToggle, onClear }: FilterMenuProps<R>) {
  const t = useGridText()
  const count = filters.filter((f) => selected[f.id]?.length).length
  return (
    <Popover
      trigger={
        <Button variant="ghost" size="sm">
          <Filter aria-hidden="true" />
          {t.filter}
          <Count n={count} />
        </Button>
      }
    >
      <div className="g-pop">
        {filters.map((def) => (
          <fieldset className="g-fieldset" key={def.id}>
            <legend className="g-legend">{def.label}</legend>
            {def.options.map((o) => (
              <Checkbox key={o.value} label={o.label} checked={Boolean(selected[def.id]?.includes(o.value))} onChange={() => onToggle(def.id, o.value)} />
            ))}
          </fieldset>
        ))}
        <div className="g-pop-foot">
          <Button variant="plain" size="sm" disabled={!count} onClick={onClear}>
            {t.clear}
          </Button>
        </div>
      </div>
    </Popover>
  )
}

/* ---- Sort ------------------------------------------------------------------------- */

interface SortMenuProps<R> {
  columns: GridColumn<R>[]
  sort: SortState | null
  onChange: (sort: SortState | null) => void
}

export function SortMenu<R>({ columns, sort, onChange }: SortMenuProps<R>) {
  const t = useGridText()
  return (
    <Popover
      trigger={
        <Button variant="ghost" size="sm">
          <ArrowUpDown aria-hidden="true" />
          {t.sort}
          <Count n={sort ? 1 : 0} />
        </Button>
      }
    >
      <div className="g-pop">
        <div className="g-legend">{t.sortBy}</div>
        <div role="radiogroup" aria-label={t.sortBy} className="g-list">
          {columns.map((c) => {
            const on = sort?.col === c.id
            return (
              <button key={c.id} type="button" role="radio" aria-checked={on} className="option" onClick={() => onChange({ col: c.id, dir: sort?.dir ?? 'asc' })}>
                {c.header}
                {on && <Check className="option-check" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
        <Segmented<'asc' | 'desc'>
          block
          ariaLabel={t.sortDirection}
          value={sort?.dir ?? 'asc'}
          onChange={(dir) => sort && onChange({ col: sort.col, dir })}
          options={[
            { value: 'asc', label: t.ascending, icon: <ArrowUp aria-hidden="true" />, disabled: !sort },
            { value: 'desc', label: t.descending, icon: <ArrowDown aria-hidden="true" />, disabled: !sort },
          ]}
        />
        <div className="g-pop-foot">
          <Button variant="plain" size="sm" disabled={!sort} onClick={() => onChange(null)}>
            {t.noSort}
          </Button>
        </div>
      </div>
    </Popover>
  )
}

/* ---- Columns ------------------------------------------------------------------------ */

interface ColumnsMenuProps<R> {
  columns: GridColumn<R>[]
  hidden: string[]
  onToggle: (id: string) => void
  onRestore: () => void
}

export function ColumnsMenu<R>({ columns, hidden, onToggle, onRestore }: ColumnsMenuProps<R>) {
  const t = useGridText()
  const [q, setQ] = useState('')
  const list = useMemo(() => columns.filter((c) => c.header.toLowerCase().includes(q.trim().toLowerCase())), [columns, q])
  return (
    <Popover
      placement="bottom-end"
      trigger={
        <Button variant="ghost" size="sm">
          <Columns3 aria-hidden="true" />
          {t.columns}
        </Button>
      }
    >
      <div className="g-pop g-pop-columns">
        <div className="g-pop-title">{t.visibleColumns}</div>
        <SearchInput value={q} onValueChange={setQ} placeholder={t.searchColumns} aria-label={t.searchColumns} />
        <ul className="g-collist">
          {list.map((c) => {
            // The row-label column (columns[0]) is always shown.
            const locked = c === columns[0] || Boolean(c.locked)
            return (
              <li key={c.id}>
                <Checkbox label={c.header} checked={locked || !hidden.includes(c.id)} disabled={locked} onChange={() => onToggle(c.id)} />
                {locked && <Lock size={14} aria-label={t.columnLocked} />}
              </li>
            )
          })}
        </ul>
        <div className="g-pop-foot">
          <Button variant="plain" size="sm" onClick={onRestore}>
            {t.restore}
          </Button>
        </div>
      </div>
    </Popover>
  )
}

/* ---- View ------------------------------------------------------------------------------ */

interface ViewMenuProps {
  density: Density
  onDensity: (d: Density) => void
  totals: boolean
  onTotals: (v: boolean) => void
}

export function ViewMenu({ density, onDensity, totals, onTotals }: ViewMenuProps) {
  const t = useGridText()
  return (
    <Popover
      placement="bottom-end"
      trigger={
        <Button variant="ghost" size="sm">
          <Rows3 aria-hidden="true" />
          {t.view}
        </Button>
      }
    >
      <div className="g-pop">
        <div className="g-legend">{t.density}</div>
        <Segmented<Density>
          block
          ariaLabel={t.density}
          value={density}
          onChange={onDensity}
          options={[
            { value: 'comfortable', label: t.comfortable },
            { value: 'compact', label: t.compact },
          ]}
        />
        <hr className="hr" />
        <Switch checked={totals} onChange={onTotals} label={t.showTotals} description={t.showTotalsHint} />
      </div>
    </Popover>
  )
}
