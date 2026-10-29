import { useLayoutEffect, useRef, useState } from 'react'

/** Maps a domain value to a pixel position. */
export const linear = (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
  r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0)

/** "Nice" tick values covering [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min]
  const span = max - min
  const rough = span / Math.max(1, count - 1)
  const pow = 10 ** Math.floor(Math.log10(rough))
  const frac = rough / pow
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10) * pow
  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const out: number[] = []
  for (let v = start; v <= end + step / 2; v += step) out.push(Math.round(v / step) * step)
  return out
}

export function linePath(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join('')
}

/** Smooth path that never overshoots the data (monotone cubic, like d3.curveMonotoneX). */
export function monotonePath(points: [number, number][]): string {
  const n = points.length
  if (n < 3) return linePath(points)

  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0]
    slope[i] = (points[i + 1][1] - points[i][1]) / (dx[i] || 1)
  }

  const t: number[] = [slope[0]]
  for (let i = 1; i < n - 1; i++) t[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2
  t[n - 1] = slope[n - 2]

  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      t[i] = 0
      t[i + 1] = 0
      continue
    }
    const a = t[i] / slope[i]
    const b = t[i + 1] / slope[i]
    const s = a * a + b * b
    if (s > 9) {
      const k = 3 / Math.sqrt(s)
      t[i] = k * a * slope[i]
      t[i + 1] = k * b * slope[i]
    }
  }

  let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    d +=
      `C${(points[i][0] + h).toFixed(2)},${(points[i][1] + t[i] * h).toFixed(2)}` +
      ` ${(points[i + 1][0] - h).toFixed(2)},${(points[i + 1][1] - t[i + 1] * h).toFixed(2)}` +
      ` ${points[i + 1][0].toFixed(2)},${points[i + 1][1].toFixed(2)}`
  }
  return d
}

/** Width of an element, kept up to date with a ResizeObserver. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/** Index of the nearest x value in a sorted array of timestamps. */
export function nearestIndex(times: number[], t: number): number {
  let lo = 0
  let hi = times.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (times[mid] < t) lo = mid
    else hi = mid
  }
  return Math.abs(times[lo] - t) <= Math.abs(times[hi] - t) ? lo : hi
}

export const seriesColor = (i: number) => `var(--chart-${(i % 5) + 1})`
