import { useMemo, useState, type PointerEvent } from 'react'
import { cn } from '@/lib/cn'
import { linear, niceTicks, useWidth } from './scale'

export interface Candle {
  x: Date
  o: number
  h: number
  l: number
  c: number
  v: number
}

interface CandlestickChartProps {
  data: Candle[]
  height?: number
  formatY?: (n: number) => string
  formatX?: (d: Date) => string
  formatVolume?: (n: number) => string
  ariaLabel: string
  className?: string
}

const MARGIN = { top: 12, right: 14, bottom: 26 }

export function CandlestickChart({
  data,
  height = 380,
  formatY = (n) => n.toFixed(2),
  formatX = (d) => d.toLocaleDateString(),
  formatVolume = (n) => String(n),
  ariaLabel,
  className,
}: CandlestickChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const times = useMemo(() => data.map((d) => d.x.getTime()), [data])
  const { ticks, maxVolume } = useMemo(() => {
    const lo = Math.min(...data.map((d) => d.l))
    const hi = Math.max(...data.map((d) => d.h))
    const pad = (hi - lo) * 0.06 || 1
    return { ticks: niceTicks(lo - pad, hi + pad, 6), maxVolume: Math.max(...data.map((d) => d.v), 1) }
  }, [data])

  const left = Math.max(40, Math.max(...ticks.map((t) => formatY(t).length)) * 6.2 + 12)
  const innerW = Math.max(0, width - left - MARGIN.right)
  const innerH = height - MARGIN.top - MARGIN.bottom
  const volH = innerH * 0.16
  const priceH = innerH - volH - 10
  const sx = (i: number) => left + ((i + 0.5) / data.length) * innerW
  const sy = linear(ticks[0], ticks[ticks.length - 1], MARGIN.top + priceH, MARGIN.top)
  const sv = linear(0, maxVolume, MARGIN.top + innerH, MARGIN.top + innerH - volH)
  const bodyW = Math.max(1, Math.min(14, (innerW / data.length) * 0.66))

  const tickIdx = useMemo(() => {
    const count = width < 420 ? 3 : width < 640 ? 4 : 6
    return Array.from({ length: count }, (_, i) => Math.round((i * (data.length - 1)) / (count - 1)))
  }, [data.length, width])

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left
    const i = Math.round(((x - left) / (innerW || 1)) * data.length - 0.5)
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  const hovered = hover !== null ? data[hover] : null
  const hx = hover !== null ? sx(hover) : 0
  const flip = hx > width * 0.62

  return (
    <div ref={ref} className={cn('chart', className)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {ticks.map((t) => (
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
              x={sx(i)}
              y={height - 6}
              textAnchor={k === 0 ? 'start' : k === tickIdx.length - 1 ? 'end' : 'middle'}
            >
              {formatX(data[i].x)}
            </text>
          ))}

          {data.map((d, i) => {
            const up = d.c >= d.o
            const color = up ? 'var(--success)' : 'var(--error)'
            const top = sy(Math.max(d.o, d.c))
            const h = Math.max(1, Math.abs(sy(d.o) - sy(d.c)))
            return (
              <g key={times[i]} opacity={hover === null || hover === i ? 1 : 0.7}>
                <line x1={sx(i)} x2={sx(i)} y1={sy(d.h)} y2={sy(d.l)} style={{ stroke: color }} strokeWidth={1} />
                <rect x={sx(i) - bodyW / 2} y={top} width={bodyW} height={h} rx={1} style={{ fill: color }} />
                <rect
                  x={sx(i) - bodyW / 2}
                  y={sv(d.v)}
                  width={bodyW}
                  height={MARGIN.top + innerH - sv(d.v)}
                  style={{ fill: color }}
                  opacity={0.28}
                />
              </g>
            )
          })}

          {hover !== null && (
            <g pointerEvents="none">
              <line className="chart-cross" x1={hx} x2={hx} y1={MARGIN.top} y2={MARGIN.top + innerH} />
            </g>
          )}
        </svg>
      )}

      {hovered && (
        <div className="chart-tip" style={{ top: 8, left: flip ? undefined : hx + 14, right: flip ? width - hx + 14 : undefined }}>
          <div className="chart-tip-title">{formatX(hovered.x)}</div>
          {(
            [
              ['Open', formatY(hovered.o)],
              ['High', formatY(hovered.h)],
              ['Low', formatY(hovered.l)],
              ['Close', formatY(hovered.c)],
              ['Volume', formatVolume(hovered.v)],
            ] as const
          ).map(([k, v]) => (
            <div className="chart-tip-row" key={k}>
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
