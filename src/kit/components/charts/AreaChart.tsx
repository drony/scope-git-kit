import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '@/kit/lib/cn'
import { linear, linePath, monotonePath, nearestIndex, niceTicks, seriesColor, useWidth } from './scale'

export interface Point {
  x: Date
  y: number
}

export interface Series {
  id: string
  label: string
  data: Point[]
  /** Any CSS color. Defaults to the theme chart palette. */
  color?: string
  /** Fill under the line. */
  area?: boolean
  dashed?: boolean
}

interface AreaChartProps {
  series: Series[]
  height?: number
  formatY?: (n: number) => string
  formatX?: (d: Date) => string
  /** Title row of the tooltip. */
  formatTip?: (d: Date) => string
  /** Describes the chart for screen readers. */
  ariaLabel: string
  smooth?: boolean
  /** Called when the reader hovers the chart or steps through it with the arrow keys. */
  onHover?: () => void
  className?: string
}

const MARGIN = { top: 12, right: 14, bottom: 26 }

export function AreaChart({
  series,
  height = 280,
  formatY = (n) => String(Math.round(n)),
  formatX = (d) => d.toLocaleDateString(),
  formatTip = formatX,
  ariaLabel,
  smooth = true,
  onHover,
  className,
}: AreaChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const uid = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)

  const base = series[0]?.data ?? []
  const times = useMemo(() => base.map((p) => p.x.getTime()), [base])

  const geometry = useMemo(() => {
    const values = series.flatMap((s) => s.data.map((p) => p.y))
    let lo = Math.min(...values)
    let hi = Math.max(...values)
    const pad = (hi - lo) * 0.08 || 1
    lo -= pad
    hi += pad
    const ticks = niceTicks(lo, hi, 5)
    return { ticks, y0: ticks[0], y1: ticks[ticks.length - 1] }
  }, [series])

  const labelWidth = Math.max(...geometry.ticks.map((t) => formatY(t).length)) * 6.2 + 12
  const left = Math.max(36, labelWidth)
  const innerW = Math.max(0, width - left - MARGIN.right)
  const innerH = height - MARGIN.top - MARGIN.bottom
  const x0 = times[0]
  const x1 = times[times.length - 1]
  const sx = useMemo(() => linear(x0, x1, left, left + innerW), [x0, x1, left, innerW])
  const sy = useMemo(() => linear(geometry.y0, geometry.y1, MARGIN.top + innerH, MARGIN.top), [geometry.y0, geometry.y1, innerH])

  const paths = useMemo(
    () =>
      series.map((s) => {
        const pts = s.data.map((p): [number, number] => [sx(p.x.getTime()), sy(p.y)])
        const line = smooth && pts.length < 400 ? monotonePath(pts) : linePath(pts)
        const area = pts.length ? `${line}L${pts[pts.length - 1][0]},${MARGIN.top + innerH}L${pts[0][0]},${MARGIN.top + innerH}Z` : ''
        return { line, area }
      }),
    [series, sx, sy, innerH, smooth],
  )

  const tickIdx = useMemo(() => {
    const n = base.length
    if (n < 2) return [0]
    const count = width < 420 ? 3 : width < 640 ? 4 : 6
    return Array.from({ length: count }, (_, i) => Math.round((i * (n - 1)) / (count - 1)))
  }, [base.length, width])

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const t = times[0] + ((x - left) / (innerW || 1)) * (times[times.length - 1] - times[0])
    setHover(nearestIndex(times, t))
    onHover?.()
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? base.length) - 1))
    else if (e.key === 'ArrowRight') setHover((h) => Math.min(base.length - 1, (h ?? -1) + 1))
    else if (e.key === 'Escape') setHover(null)
    else return
    e.preventDefault()
    if (e.key !== 'Escape') onHover?.()
  }

  const hx = hover !== null && base[hover] ? sx(base[hover].x.getTime()) : null
  const flip = hx !== null && hx > width * 0.62

  return (
    <div ref={ref} className={cn('chart', className)}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          <defs>
            {series.map((s, i) =>
              s.area ? (
                <linearGradient key={s.id} id={`${uid}-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" style={{ stopColor: s.color ?? seriesColor(i), stopOpacity: 0.2 }} />
                  <stop offset="1" style={{ stopColor: s.color ?? seriesColor(i), stopOpacity: 0 }} />
                </linearGradient>
              ) : null,
            )}
          </defs>

          {geometry.ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={left} x2={left + innerW} y1={sy(t)} y2={sy(t)} />
              <text className="chart-tick" x={left - 8} y={sy(t) + 3} textAnchor="end">
                {formatY(t)}
              </text>
            </g>
          ))}

          {tickIdx.map((i, k) => (
            <text
              key={i}
              className="chart-tick"
              x={sx(times[i])}
              y={height - 6}
              textAnchor={k === 0 ? 'start' : k === tickIdx.length - 1 ? 'end' : 'middle'}
            >
              {formatX(base[i].x)}
            </text>
          ))}

          {series.map((s, i) => (
            <g key={s.id}>
              {s.area && <path d={paths[i].area} fill={`url(#${uid}-${s.id})`} />}
              <path
                d={paths[i].line}
                fill="none"
                style={{ stroke: s.color ?? seriesColor(i) }}
                strokeWidth={1.75}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={s.dashed ? '4 4' : undefined}
              />
            </g>
          ))}

          {hover !== null && hx !== null && (
            <g pointerEvents="none">
              <line className="chart-cross" x1={hx} x2={hx} y1={MARGIN.top} y2={MARGIN.top + innerH} />
              {series.map((s, i) =>
                s.data[hover] ? (
                  <circle
                    key={s.id}
                    cx={hx}
                    cy={sy(s.data[hover].y)}
                    r={4}
                    className="chart-dot"
                    style={{ stroke: s.color ?? seriesColor(i) }}
                  />
                ) : null,
              )}
            </g>
          )}
        </svg>
      )}

      {hover !== null && hx !== null && base[hover] && (
        <div className="chart-tip" style={{ top: 8, left: flip ? undefined : hx + 14, right: flip ? width - hx + 14 : undefined }}>
          <div className="chart-tip-title">{formatTip(base[hover].x)}</div>
          {series.map((s, i) =>
            s.data[hover] ? (
              <div className="chart-tip-row" key={s.id}>
                <span>
                  <i style={{ background: s.color ?? seriesColor(i) }} />
                  {s.label}
                </span>
                <b>{formatY(s.data[hover].y)}</b>
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}
