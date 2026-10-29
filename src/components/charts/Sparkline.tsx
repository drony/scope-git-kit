import { useId } from 'react'
import { monotonePath } from './scale'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  /** Defaults to green when the series ends higher than it started, red otherwise. */
  color?: string
  /** Soft fill under the line. */
  fill?: boolean
  className?: string
}

/** Tiny decorative trend line. Pair it with a text value for accessibility. */
export function Sparkline({ data, width = 88, height = 28, color, fill = true, className }: SparklineProps) {
  const uid = useId().replace(/:/g, '')
  if (data.length < 2) return null

  const lo = Math.min(...data)
  const hi = Math.max(...data)
  const pad = 2
  const pts = data.map((v, i): [number, number] => [
    pad + (i / (data.length - 1)) * (width - pad * 2),
    pad + (1 - (v - lo) / (hi - lo || 1)) * (height - pad * 2),
  ])
  const line = monotonePath(pts)
  const stroke = color ?? (data[data.length - 1] >= data[0] ? 'var(--success)' : 'var(--error)')
  const last = pts[pts.length - 1]

  return (
    <svg className={className} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {fill && (
        <>
          <defs>
            <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: stroke, stopOpacity: 0.18 }} />
              <stop offset="1" style={{ stopColor: stroke, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path d={`${line}L${last[0]},${height}L${pts[0][0]},${height}Z`} fill={`url(#${uid})`} />
        </>
      )}
      <path d={line} fill="none" style={{ stroke }} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
