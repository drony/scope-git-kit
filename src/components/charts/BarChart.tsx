import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { linear, niceTicks, seriesColor, useWidth } from './scale'

export interface BarSeries {
  key: string
  label: string
  color?: string
}

export interface BarDatum {
  label: string
  values: Record<string, number>
}

interface BarChartProps {
  data: BarDatum[]
  series: BarSeries[]
  height?: number
  formatY?: (n: number) => string
  ariaLabel: string
  className?: string
}

const MARGIN = { top: 12, right: 8, bottom: 26 }

/** Rounded-top bar path. */
function barPath(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}

export function BarChart({ data, series, height = 260, formatY = (n) => String(Math.round(n)), ariaLabel, className }: BarChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const ticks = useMemo(() => {
    const max = Math.max(...data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0)), 1)
    return niceTicks(0, max * 1.05, 5)
  }, [data, series])

  const left = Math.max(36, Math.max(...ticks.map((t) => formatY(t).length)) * 6.2 + 12)
  const innerW = Math.max(0, width - left - MARGIN.right)
  const innerH = height - MARGIN.top - MARGIN.bottom
  const sy = linear(0, ticks[ticks.length - 1], MARGIN.top + innerH, MARGIN.top)
  const group = innerW / (data.length || 1)
  const barW = Math.min(22, (group * 0.64) / series.length)
  const gap = 3

  return (
    <div ref={ref} className={cn('chart', className)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} onPointerLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={left} x2={left + innerW} y1={sy(t)} y2={sy(t)} />
              <text className="chart-tick" x={left - 8} y={sy(t) + 3} textAnchor="end">
                {formatY(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const cx = left + group * i + group / 2
            const total = series.length * barW + (series.length - 1) * gap
            return (
              <g key={d.label} onPointerMove={() => setHover(i)}>
                <rect x={left + group * i} y={MARGIN.top} width={group} height={innerH} fill="transparent" />
                {hover === i && (
                  <rect className="chart-band" x={left + group * i + 2} y={MARGIN.top} width={group - 4} height={innerH} rx={6} />
                )}
                {series.map((s, k) => {
                  const v = d.values[s.key] ?? 0
                  const h = Math.max(0, MARGIN.top + innerH - sy(v))
                  return (
                    <path
                      key={s.key}
                      d={barPath(cx - total / 2 + k * (barW + gap), sy(v), barW, h, 4)}
                      style={{ fill: s.color ?? seriesColor(k) }}
                      opacity={hover === null || hover === i ? 1 : 0.55}
                    />
                  )
                })}
                <text className="chart-tick" x={cx} y={height - 6} textAnchor="middle">
                  {d.label}
                </text>
              </g>
            )
          })}
        </svg>
      )}

      {hover !== null && data[hover] && (
        <div
          className="chart-tip"
          style={{
            top: 8,
            left: left + group * hover + group / 2 > width * 0.62 ? undefined : left + group * hover + group / 2 + 14,
            right: left + group * hover + group / 2 > width * 0.62 ? width - (left + group * hover + group / 2) + 14 : undefined,
          }}
        >
          <div className="chart-tip-title">{data[hover].label}</div>
          {series.map((s, k) => (
            <div className="chart-tip-row" key={s.key}>
              <span>
                <i style={{ background: s.color ?? seriesColor(k) }} />
                {s.label}
              </span>
              <b>{formatY(data[hover].values[s.key] ?? 0)}</b>
            </div>
          ))}
        </div>
      )}

      <ul className="legend" aria-label="Legend">
        {series.map((s, k) => (
          <li key={s.key}>
            <i style={{ background: s.color ?? seriesColor(k) }} />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
