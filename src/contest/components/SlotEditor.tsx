import { Trash2 } from 'lucide-react'
import { Field, Input } from '@/kit/components/forms/Field'
import { Select } from '@/kit/components/forms/Select'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Button } from '@/kit/components/ui/Button'
import { Alert } from '@/kit/components/ui/Feedback'
import { cn } from '@/kit/lib/cn'
import type { ProgramSlot, Weekday } from '../data/types'
import { WEEKDAYS } from '../lib/program'

const QUOTAS = [100, 500, 1000, 5000]

interface SlotEditorProps {
  slot: ProgramSlot
  onChange: (slot: ProgramSlot) => void
  /** Shows a "Remove this show" button. */
  onRemove?: () => void
  /** The topics to choose from. */
  topics: string[]
  /** People registered for the coming shows of this slot. A warning appears when there are some. */
  registered?: number
  className?: string
}

const num = (value: string, min: number, max: number) => Math.max(min, Math.min(max, Math.round(Number(value) || 0)))

/**
 * One show of the program as a short form: daily or final, the day, the start time and length, the topic, the quota and, for a
 * daily show, how many of its best players win a seat in the final. When people registered for the next run, it says that a
 * change will ask for a confirmation.
 */
export function SlotEditor({ slot, onChange, onRemove, topics, registered = 0, className }: SlotEditorProps) {
  const set = (patch: Partial<ProgramSlot>) => onChange({ ...slot, ...patch })
  const options = [...new Set([...topics, slot.topic].filter(Boolean))].map((t) => ({ value: t, label: t }))
  return (
    <div className={cn('pg-editor', className)}>
      {registered > 0 && (
        <Alert tone="warning" title="People registered">
          {registered.toLocaleString('en')} {registered === 1 ? 'person has' : 'people have'} registered for the coming shows of this slot. A change asks you to confirm before you save.
        </Alert>
      )}
      <Field label="Kind">
        <Segmented<ProgramSlot['kind']>
          ariaLabel="Kind of show"
          value={slot.kind}
          onChange={(kind) => set({ kind, seats: kind === 'final' ? 0 : slot.seats || 10 })}
          options={[
            { value: 'daily', label: 'Daily show' },
            { value: 'final', label: 'Final' },
          ]}
        />
      </Field>
      <Field label="Day">
        <Segmented<string> ariaLabel="Day of the week" value={String(slot.weekday)} onChange={(v) => set({ weekday: Number(v) as Weekday })} options={WEEKDAYS.map((d) => ({ value: String(d.id), label: d.short }))} />
      </Field>
      <div className="pg-editor-row">
        <Field label="Starts at" hint="In the program's time zone.">
          <Input type="time" value={slot.time} onChange={(e) => e.target.value && set({ time: e.target.value })} />
        </Field>
        <Field label="Length">
          <Input type="number" min={5} max={180} step={5} value={slot.lengthMin} affix="min" onChange={(e) => set({ lengthMin: num(e.target.value, 5, 180) })} />
        </Field>
      </div>
      <Field label="Topic">
        <Select<string> ariaLabel="Topic" searchable value={slot.topic || null} placeholder="Choose a topic" options={options} onChange={(topic) => set({ topic })} />
      </Field>
      <Field label="Quota" hint="The most people who can register.">
        <Input type="number" min={1} max={100000} step={50} value={slot.quota} onChange={(e) => set({ quota: num(e.target.value, 0, 100000) })} />
        <span className="pg-presets" role="group" aria-label="Quota presets">
          {QUOTAS.map((q) => (
            <button key={q} type="button" className={cn('pg-preset', slot.quota === q && 'is-on')} aria-pressed={slot.quota === q} onClick={() => set({ quota: q })}>
              {q.toLocaleString('en')}
            </button>
          ))}
        </span>
      </Field>
      {slot.kind === 'daily' && (
        <Field label="Final seats" hint="The best players of this show win a seat in the final, by the order of the day's results.">
          <Input type="number" min={0} max={slot.quota} step={5} value={slot.seats} onChange={(e) => set({ seats: num(e.target.value, 0, slot.quota) })} />
        </Field>
      )}
      {onRemove && (
        <Button variant="plain" size="sm" onClick={onRemove}>
          <Trash2 aria-hidden="true" /> Remove this show
        </Button>
      )}
    </div>
  )
}
