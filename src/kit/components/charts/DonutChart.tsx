import { useState, type ReactNode } from 'react'
import { cn } from '@/kit/lib/cn'
import { seriesColor } from './scale'

export interface Slice {
  id: string
  label: string
  value: number
  color?: string
}

interface DonutChartProps {
  slices: Slice[]
  size?: number
  thickness?: number
  centerLabel?: ReactNode
  centerValue?: ReactNode
  formatValue?: (n: number) => string
  /** Highlighted slice. Leave out to let the chart manage hovering itself; pass it (with `onActiveChange`) to link it to other UI. */
  activeId?: string | null
  /** Called with the slice id under the pointer, or null when it leaves. */
  onActiveChange?: (id: string | null) => void
  ariaLabel: string
  className?: string
}

export function DonutChart({
  slices,
  size = 176,
  thickness = 16,
  centerLabel,
  centerValue,
  formatValue = (n) => String(n),
  activeId,
  onActiveChange,
  ariaLabel,
  className,
}: DonutChartProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const active = activeId !== undefined ? activeId : hovered
  const setActive = (id: string | null) => {
    setHovered(id)
    onActiveChange?.(id)
  }
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const gap = slices.length > 1 ? 2.5 : 0

  let offset = 0
  const arcs = slices.map((s, i) => {
    const len = (s.value / total) * c
    const arc = { ...s, color: s.color ?? seriesColor(i), dash: Math.max(0, len - gap), offset }
    offset += len
    return arc
  })

  return (
    <div className={cn('donut', className)}>
      <div className="donut-chart" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={ariaLabel}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="donut-track" strokeWidth={thickness} />
            {arcs.map((a) => (
              <circle
                key={a.id}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                style={{ stroke: a.color, transition: 'stroke-width .15s, opacity .15s' }}
                strokeWidth={active === a.id ? thickness + 4 : thickness}
                strokeDasharray={`${a.dash} ${c - a.dash}`}
                strokeDashoffset={-a.offset}
                opacity={active && active !== a.id ? 0.35 : 1}
                onPointerEnter={() => setActive(a.id)}
                onPointerLeave={() => setActive(null)}
              />
            ))}
          </g>
        </svg>
        <div className="donut-center">
          <span className="kpi-label">{active ? slices.find((s) => s.id === active)?.label : centerLabel}</span>
          <strong>{active ? formatValue(slices.find((s) => s.id === active)?.value ?? 0) : centerValue}</strong>
        </div>
      </div>

      <ul className="legend-list">
        {arcs.map((a) => (
          <li
            key={a.id}
            className={cn(active === a.id && 'is-active')}
            onPointerEnter={() => setActive(a.id)}
            onPointerLeave={() => setActive(null)}
          >
            <i style={{ background: a.color }} />
            <span>{a.label}</span>
            <span className="mono tnum muted">{((a.value / total) * 100).toFixed(1)}%</span>
            <b className="mono tnum">{formatValue(a.value)}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}
