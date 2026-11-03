import { Search } from 'lucide-react'
import { Input } from '@/kit/components/forms/Field'
import { Select } from '@/kit/components/forms/Select'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { AuditEntry } from '../data/types'
import { ACTION_LABEL, ENTITY_GROUPS, isFiltered, type AuditFilter, type SincePreset } from '../lib/audit'

const ACTIONS = Object.keys(ACTION_LABEL) as AuditEntry['action'][]

interface AuditFiltersProps {
  value: AuditFilter
  onChange: (filter: AuditFilter) => void
  /** The people who appear in the trail. See `actorsOf`. */
  actors: string[]
  /** How many entries there are, and how many pass the filter. */
  total: number
  shown: number
  className?: string
}

/**
 * Narrow the trail: words (they match what was said, who did it and the id), a person, a time range, the kind of thing (in six
 * groups), what was done, and "sensitive only". The line under it says how many of how many are shown, with a button to clear.
 */
export function AuditFilters({ value, onChange, actors, total, shown, className }: AuditFiltersProps) {
  const set = (patch: Partial<AuditFilter>) => onChange({ ...value, ...patch })
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
  return (
    <div className={cn('au-filters', className)}>
      <div className="au-filters-row">
        <Input type="search" icon={<Search size={16} aria-hidden="true" />} value={value.query} placeholder="Search what was said, who, or an id" aria-label="Search the trail" onChange={(e) => set({ query: e.target.value })} />
        <Select<string> ariaLabel="Who" value={value.actor ?? ''} onChange={(v) => set({ actor: v || undefined })} options={[{ value: '', label: 'Everyone' }, ...actors.map((a) => ({ value: a, label: a }))]} />
        <Segmented<SincePreset>
          ariaLabel="When"
          value={value.since}
          onChange={(since) => set({ since, day: undefined })}
          options={[
            { value: 'all', label: 'All' },
            { value: 'today', label: 'Today' },
            { value: '7d', label: '7 days' },
            { value: '30d', label: '30 days' },
          ]}
        />
      </div>
      <div className="au-chips" role="group" aria-label="Kind of thing">
        {ENTITY_GROUPS.map((g) => {
          const on = g.entities.every((e) => value.entities.includes(e))
          return (
            <button key={g.id} type="button" className={cn('au-chip', on && 'is-on')} aria-pressed={on} onClick={() => set({ entities: on ? value.entities.filter((e) => !g.entities.includes(e)) : [...new Set([...value.entities, ...g.entities])] })}>
              {g.label}
            </button>
          )
        })}
        <span className="au-sep" aria-hidden="true" />
        {ACTIONS.map((a) => (
          <button key={a} type="button" className={cn('au-chip', value.actions.includes(a) && 'is-on')} aria-pressed={value.actions.includes(a)} onClick={() => set({ actions: toggle(value.actions, a) })}>
            {ACTION_LABEL[a]}
          </button>
        ))}
        <span className="au-sep" aria-hidden="true" />
        <button type="button" className={cn('au-chip is-risk', value.sensitiveOnly && 'is-on')} aria-pressed={value.sensitiveOnly} onClick={() => set({ sensitiveOnly: !value.sensitiveOnly })}>
          Sensitive only
        </button>
      </div>
      <p className="au-count" role="status">
        {shown.toLocaleString('en')} of {total.toLocaleString('en')} changes
        {isFiltered(value) && (
          <Button size="sm" variant="ghost" onClick={() => onChange({ entities: [], actions: [], since: 'all', query: '', sensitiveOnly: false })}>
            Clear the filters
          </Button>
        )}
      </p>
    </div>
  )
}
