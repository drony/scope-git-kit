import { Input } from '@/kit/components/forms/Field'
import { Segmented } from '@/kit/components/nav/Segmented'
import { cn } from '@/kit/lib/cn'
import type { BuildUsage, StoreId, VersionGate } from '../data/types'
import { STORES, VERDICT_TEXT, verdictFor } from '../lib/gate'
import { UpdateScreen } from './UpdateScreen'

interface GateSimulatorProps {
  /** The gate to try, for example the one with the edits. */
  gate: VersionGate
  store: StoreId
  build: number
  onChange: (value: { store: StoreId; build: number }) => void
  /** Builds in use, offered as quick picks. */
  usage?: BuildUsage[]
  className?: string
}

/**
 * "What would this player see?" Pick a store and a build and the screen appears as the player gets it, with the words of the
 * verdict above it. It reads the gate you give it, so it can try a draft before anything is saved.
 */
export function GateSimulator({ gate, store, build, onChange, usage = [], className }: GateSimulatorProps) {
  const verdict = verdictFor(gate, store, build)
  const rule = gate.stores.find((g) => g.store === store)
  const picks = usage.filter((u) => u.store === store).sort((a, b) => a.build - b.build)
  const some = picks.length > 6 ? [picks[0], picks[Math.floor(picks.length / 3)], picks[Math.floor((2 * picks.length) / 3)], picks[picks.length - 1]] : picks
  return (
    <div className={cn('gt-sim', className)}>
      <Segmented<StoreId> ariaLabel="Store" value={store} onChange={(s) => onChange({ store: s, build })} options={STORES.map((s) => ({ value: s.id, label: s.label }))} />
      <label className="gt-sim-build">
        Build
        <Input type="number" min={0} value={build} onChange={(e) => onChange({ store, build: Math.max(0, Math.round(Number(e.target.value) || 0)) })} aria-label="Build number" />
      </label>
      {some.length > 0 && (
        <span className="gt-sim-picks" role="group" aria-label="Builds in use">
          {some.map((u) => (
            <button key={u.build} type="button" className={cn(build === u.build && 'is-on')} aria-pressed={build === u.build} onClick={() => onChange({ store, build: u.build })}>
              {u.build}
            </button>
          ))}
        </span>
      )}
      <p className={cn('gt-sim-verdict', `is-${verdict}`)} role="status">
        <b>{VERDICT_TEXT[verdict].label}.</b> {VERDICT_TEXT[verdict].hint}
      </p>
      <div className="gt-phone">
        {verdict === 'ok' || !rule ? <p className="gt-phone-ok">The app opens as usual.</p> : <UpdateScreen verdict={verdict} message={gate.message} updateUrl={rule.updateUrl} build={build} minBuild={rule.minBuild} onClose={() => undefined} />}
      </div>
    </div>
  )
}
