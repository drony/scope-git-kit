import { useEffect, useMemo, useRef, useState } from 'react'
import { useSite } from '@/kit/context/ConfigContext'
import { useFormat } from '@/kit/lib/format'
import { addDays, startOfWeek, toKey } from '@/kit/lib/date'

interface HeatmapProps {
  /** Daily values keyed by YYYY-MM-DD. Positive is green, negative is red. */
  data: Record<string, number>
  from: Date
  to: Date
  formatValue: (n: number) => string
  ariaLabel: string
}

export function Heatmap({ data, from, to, formatValue, ariaLabel }: HeatmapProps) {
  const { weekStartsOn } = useSite()
  const fmt = useFormat()
  const [tip, setTip] = useState<{ x: number; y: number; date: Date; value: number | undefined } | null>(null)

  // Start scrolled to the most recent weeks.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [from, to])

  const { weeks, max } = useMemo(() => {
    const start = startOfWeek(from, weekStartsOn)
    const count = Math.ceil((to.getTime() - start.getTime()) / (7 * 86400000)) + 1
    const grid = Array.from({ length: count }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
    return { weeks: grid, max: Math.max(1, ...Object.values(data).map(Math.abs)) }
  }, [from, to, weekStartsOn, data])

  const cellColor = (value: number | undefined) => {
    if (value === undefined || value === 0) return 'var(--hairline)'
    const pct = 18 + (Math.abs(value) / max) * 72
    return `color-mix(in srgb, ${value > 0 ? 'var(--success)' : 'var(--error)'} ${pct}%, var(--surface))`
  }

  return (
    <div className="heat">
      <div className="heat-scroll" ref={scrollRef}>
        <div className="heat-grid" role="img" aria-label={ariaLabel}>
          {weeks.map((week, w) => (
            <div className="heat-col" key={w}>
              {week.map((d) => {
                const inRange = d >= from && d <= to
                const value = data[toKey(d)]
                return (
                  <span
                    key={toKey(d)}
                    className="heat-cell"
                    style={{ background: inRange ? cellColor(value) : 'transparent' }}
                    onPointerEnter={(e) => inRange && setTip({ x: e.clientX, y: e.clientY, date: d, value })}
                    onPointerMove={(e) => inRange && setTip({ x: e.clientX, y: e.clientY, date: d, value })}
                    onPointerLeave={() => setTip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="heat-legend" aria-hidden="true">
        <span>Loss</span>
        {[-1, -0.5, 0, 0.5, 1].map((v) => (
          <i key={v} style={{ background: cellColor(v * max) }} />
        ))}
        <span>Gain</span>
      </div>
      {tip && (
        <div className="chart-tip is-fixed" style={{ left: tip.x + 12, top: tip.y + 12 }}>
          <div className="chart-tip-title">{fmt.date(tip.date, 'short')}</div>
          <b className="mono">{tip.value === undefined ? 'No activity' : formatValue(tip.value)}</b>
        </div>
      )}
    </div>
  )
}
