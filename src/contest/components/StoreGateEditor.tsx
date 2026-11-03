import { useEffect, useState } from 'react'
import { CircleAlert, TriangleAlert } from 'lucide-react'
import { Field, Input } from '@/kit/components/forms/Field'
import { cn } from '@/kit/lib/cn'
import type { StoreGate } from '../data/types'
import { parseBuilds, storeName, type GateProblem } from '../lib/gate'

interface StoreGateEditorProps {
  gate: StoreGate
  onChange: (gate: StoreGate) => void
  /** What is wrong with this store's rule. See `gateProblems`. */
  problems?: GateProblem[]
  className?: string
}

const num = (value: string) => Math.max(0, Math.min(9_999_999, Math.round(Number(value) || 0)))

/**
 * The rule for one store as a short form: the oldest build that may play, the build from which people are current, builds that
 * are switched off, and where "Update" goes. The builds the store offers are listed (the server keeps that list) with a button to
 * suggest the newest one. Problems show under the fields in words.
 */
export function StoreGateEditor({ gate, onChange, problems = [], className }: StoreGateEditorProps) {
  const set = (patch: Partial<StoreGate>) => onChange({ ...gate, ...patch })
  const [blocked, setBlocked] = useState(gate.blockedBuilds.join(', '))
  useEffect(() => setBlocked(gate.blockedBuilds.join(', ')), [gate.store, gate.blockedBuilds.join()])
  const parsed = parseBuilds(blocked)
  const newest = Math.max(0, ...gate.availableBuilds)
  return (
    <div className={cn('gt-editor', className)}>
      <div className="gt-editor-row">
        <Field label="Minimum build" hint="Older builds cannot play.">
          <Input type="number" min={0} value={gate.minBuild} onChange={(e) => set({ minBuild: num(e.target.value) })} />
        </Field>
        <Field label="Suggested build" hint="Older builds see a prompt they can close.">
          <Input type="number" min={0} value={gate.recommendedBuild} onChange={(e) => set({ recommendedBuild: num(e.target.value) })} />
        </Field>
      </div>
      <Field label="Blocked builds" hint="Switched off even above the minimum. Separate with commas." error={parsed.invalid.length ? `Not a build number: ${parsed.invalid.join(', ')}` : undefined}>
        <Input
          value={blocked}
          placeholder="For example: 379, 381"
          inputMode="numeric"
          onChange={(e) => {
            setBlocked(e.target.value)
            const p = parseBuilds(e.target.value)
            if (p.invalid.length === 0) set({ blockedBuilds: p.builds })
          }}
        />
      </Field>
      <Field label="Update link" hint={`Where "Update" goes on ${storeName(gate.store)}.`}>
        <Input type="url" value={gate.updateUrl} onChange={(e) => set({ updateUrl: e.target.value })} />
      </Field>
      <div className="gt-avail">
        <span>
          In {storeName(gate.store)} now: <b>{gate.availableBuilds.length ? [...gate.availableBuilds].sort((a, b) => a - b).join(', ') : 'nothing yet'}</b>
        </span>
        {newest > 0 && gate.recommendedBuild !== newest && (
          <button type="button" onClick={() => set({ recommendedBuild: newest })}>
            Suggest the newest ({newest})
          </button>
        )}
      </div>
      {problems.length > 0 && (
        <ul className="gt-problems" aria-label="Problems">
          {problems.map((p) => (
            <li key={p.text} className={`is-${p.level}`}>
              {p.level === 'error' ? <CircleAlert aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
              {p.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
