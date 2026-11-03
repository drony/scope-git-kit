import { cn } from '@/kit/lib/cn'
import type { BuildUsage, StoreGate } from '../data/types'
import { VERDICT_TEXT, percent, usageImpact, verdictOf, type Verdict } from '../lib/gate'

const ORDER: Verdict[] = ['ok', 'recommended', 'required', 'blocked']

interface BuildLadderProps {
  gate: StoreGate
  /** How many players use each build. Other stores are ignored. */
  usage: BuildUsage[]
  /** A build to point at, for example the one being tried in the simulator. */
  highlight?: number
  className?: string
}

/**
 * The players of one store, build by build: a column for every build, as tall as the number of players on it and coloured by what
 * the gate tells that build. The minimum and the suggested build are marked above their columns. Under the chart: how many
 * players each verdict touches. Move a limit in the editor and the columns change colour at once.
 */
export function BuildLadder({ gate, usage, highlight, className }: BuildLadderProps) {
  const list = usage.filter((u) => u.store === gate.store).sort((a, b) => a.build - b.build)
  const max = Math.max(1, ...list.map((u) => u.players))
  const total = usageImpact(gate, usage)
  const first = list.find((u) => u.build >= gate.minBuild)?.build
  const rec = list.find((u) => u.build >= gate.recommendedBuild)?.build
  if (list.length === 0) return <p className={cn('gt-none', className)}>Nobody uses this store yet.</p>
  return (
    <figure className={cn('gt-ladder', className)}>
      <ol className="gt-bars" aria-label="Players by build">
        {list.map((u, i) => {
          const v = verdictOf(gate, u.build)
          return (
            <li key={u.build} className={cn('gt-bar', `is-${v}`, highlight === u.build && 'is-picked')} title={`Build ${u.build}: ${u.players.toLocaleString('en')} players. ${VERDICT_TEXT[v].label}.`}>
              {u.build === first && <span className="gt-mark">Min</span>}
              {u.build === rec && u.build !== first && <span className="gt-mark is-rec">Sug.</span>}
              <i style={{ height: `${Math.max(3, (u.players / max) * 100)}%` }} />
              <small>{i === 0 || i === list.length - 1 || u.build === gate.minBuild || u.build === gate.recommendedBuild || u.build % 4 === 0 ? u.build : ''}</small>
            </li>
          )
        })}
      </ol>
      <figcaption>
        <ul className="gt-legend">
          {ORDER.map((v) => (
            <li key={v} className={`is-${v}`}>
              <i aria-hidden="true" />
              <b>{VERDICT_TEXT[v].label}</b>
              <span>
                {total[v].toLocaleString('en')} ({percent(total[v], total.total)}%)
              </span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
