import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/kit/lib/cn'
import { storage } from '@/kit/lib/storage'

interface SplitPaneProps {
  start: ReactNode
  end: ReactNode
  /** Share of the width the first pane gets before the person drags, 0 to 1. */
  initial?: number
  /** Smallest share either pane can have. */
  min?: number
  /** Remembers the divider position in this browser. */
  storageKey?: string
  /** Names the divider for screen readers. */
  label?: string
  className?: string
}

const clamp = (n: number, min: number) => Math.min(1 - min, Math.max(min, n))

/**
 * Two panes with a draggable divider, for "edit on the left, preview on the right". The divider also moves with ← →
 * (Home and End jump to the limits). Below about 720 px the panes stack and the divider hides.
 */
export function SplitPane({ start, end, initial = 0.5, min = 0.25, storageKey, label = 'Resize panes', className }: SplitPaneProps) {
  const saved = storageKey ? Number(storage.get(`kit.split.${storageKey}`)) : NaN
  const [share, setShare] = useState(Number.isFinite(saved) && saved > 0 ? clamp(saved, min) : clamp(initial, min))
  const box = useRef<HTMLDivElement>(null)

  const set = (n: number) => {
    const v = clamp(n, min)
    setShare(v)
    if (storageKey) storage.set(`kit.split.${storageKey}`, String(v))
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId) || !box.current) return
    const r = box.current.getBoundingClientRect()
    set((e.clientX - r.left) / r.width)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.1 : 0.03
    if (e.key === 'ArrowLeft') set(share - step)
    else if (e.key === 'ArrowRight') set(share + step)
    else if (e.key === 'Home') set(min)
    else if (e.key === 'End') set(1 - min)
    else return
    e.preventDefault()
  }

  return (
    <div ref={box} className={cn('split', className)} style={{ ['--split' as string]: `${share * 100}%` }}>
      <div className="split-pane">{start}</div>
      <div
        className="split-bar"
        role="separator"
        aria-orientation="vertical"
        aria-label={label}
        aria-valuemin={Math.round(min * 100)}
        aria-valuemax={Math.round((1 - min) * 100)}
        aria-valuenow={Math.round(share * 100)}
        tabIndex={0}
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
      />
      <div className="split-pane">{end}</div>
    </div>
  )
}
