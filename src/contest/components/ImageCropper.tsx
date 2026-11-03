import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { RotateCcw, RotateCw, Undo2 } from 'lucide-react'
import { Segmented } from '@/kit/components/nav/Segmented'
import { Button } from '@/kit/components/ui/Button'
import { cn } from '@/kit/lib/cn'
import type { MediaAsset } from '../data/types'
import { CENTER, clamp, currentCrop, fitAspect, FULL, MIN_CROP, rotatedAspect, rotateCrop, type Point, type Transform } from '../lib/crop'
import { CroppedImage } from './CroppedImage'

export interface CropValue {
  transform: Transform
  focal: Point
}

interface ImageCropperProps {
  asset: MediaAsset
  /** The crop being edited. Leave out to start from what the asset has saved. */
  value?: CropValue
  onChange: (value: CropValue) => void
  className?: string
}

type Handle = 'move' | 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se'
type Shape = 'free' | '1' | '1.3333' | '1.7778'

const SHAPES: Array<{ value: Shape; label: string }> = [
  { value: 'free', label: 'Free' },
  { value: '1', label: '1:1' },
  { value: '1.3333', label: '4:3' },
  { value: '1.7778', label: '16:9' },
]
const PREVIEWS = [
  { ratio: 1, label: 'Square' },
  { ratio: 16 / 9, label: 'Wide' },
  { ratio: 4 / 5, label: 'Tall' },
]
const CORNERS: Handle[] = ['nw', 'ne', 'sw', 'se']
const EDGES: Handle[] = ['n', 's', 'e', 'w']

/**
 * Crop, rotate and set a focal point without touching the file. Drag the box to move it, drag a handle to resize it, drag
 * the dot to say where the subject is. Arrow keys work too. It reports the new numbers through `onChange`; the previews
 * under the picture show how square, wide and tall thumbnails would look, so the focal point has a visible effect.
 */
export function ImageCropper({ asset, value, onChange, className }: ImageCropperProps) {
  const now = value ?? currentCrop(asset)
  const { transform, focal } = now
  const [shape, setShape] = useState<Shape>('free')
  const stage = useRef<HTMLDivElement>(null)
  const drag = useRef<{ handle: Handle | 'focal'; px: number; py: number; rect: Transform; point: Point } | null>(null)
  const size = asset.width && asset.height ? { w: asset.width, h: asset.height } : { w: 4, h: 3 }
  const da = rotatedAspect(size.w, size.h, transform.rotate)
  const locked = shape === 'free' ? null : Number(shape)

  const setRect = (rect: Partial<Transform>) => onChange({ transform: { ...transform, ...rect }, focal })
  const setShapeAndFit = (next: Shape) => {
    setShape(next)
    if (next === 'free') return
    const r = fitAspect(transform, Number(next), da)
    onChange({ transform: { ...transform, ...r }, focal: { x: clamp(focal.x, r.x, r.x + r.w), y: clamp(focal.y, r.y, r.y + r.h) } })
  }

  const start = (handle: Handle | 'focal') => (e: PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { handle, px: e.clientX, py: e.clientY, rect: transform, point: focal }
  }

  const move = (e: PointerEvent) => {
    const d = drag.current
    const box = stage.current?.getBoundingClientRect()
    if (!d || !box) return
    const dx = (e.clientX - d.px) / box.width
    const dy = (e.clientY - d.py) / box.height
    const r = d.rect
    if (d.handle === 'focal') return onChange({ transform, focal: { x: clamp(d.point.x + dx, 0, 1), y: clamp(d.point.y + dy, 0, 1) } })
    if (d.handle === 'move') return setRect({ x: clamp(r.x + dx, 0, 1 - r.w), y: clamp(r.y + dy, 0, 1 - r.h) })

    const h = d.handle
    const west = h.includes('w')
    const north = h.includes('n')
    if (locked && h.length === 2) {
      const rel = locked / da
      const ax = west ? r.x + r.w : r.x
      const ay = north ? r.y + r.h : r.y
      const mx = (west ? r.x : r.x + r.w) + dx
      const my = (north ? r.y : r.y + r.h) + dy
      let w = Math.max(Math.abs(mx - ax), Math.abs(my - ay) * rel)
      w = clamp(w, MIN_CROP, Math.min(west ? ax : 1 - ax, (north ? ay : 1 - ay) * rel))
      const hh = w / rel
      return setRect({ x: west ? ax - w : ax, y: north ? ay - hh : ay, w, h: hh })
    }
    let L = r.x
    let R = r.x + r.w
    let T = r.y
    let B = r.y + r.h
    if (h.includes('w')) L = clamp(L + dx, 0, R - MIN_CROP)
    if (h.includes('e')) R = clamp(R + dx, L + MIN_CROP, 1)
    if (h.includes('n')) T = clamp(T + dy, 0, B - MIN_CROP)
    if (h.includes('s')) B = clamp(B + dy, T + MIN_CROP, 1)
    setRect({ x: L, y: T, w: R - L, h: B - T })
  }

  const end = () => {
    drag.current = null
  }

  const keysForBox = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.05 : 0.01
    const dir = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key as 'ArrowLeft']
    if (dir) {
      e.preventDefault()
      return setRect({ x: clamp(transform.x + dir[0], 0, 1 - transform.w), y: clamp(transform.y + dir[1], 0, 1 - transform.h) })
    }
    if (e.key === '+' || e.key === '=' || e.key === '-') {
      e.preventDefault()
      const k = e.key === '-' ? 0.95 : 1 / 0.95
      const w = clamp(transform.w * k, MIN_CROP, 1)
      const h = clamp(transform.h * k, MIN_CROP, 1)
      setRect({ w, h, x: clamp(transform.x + (transform.w - w) / 2, 0, 1 - w), y: clamp(transform.y + (transform.h - h) / 2, 0, 1 - h) })
    }
  }
  const keysForFocal = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.05 : 0.01
    const dir = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key as 'ArrowLeft']
    if (!dir) return
    e.preventDefault()
    onChange({ transform, focal: { x: clamp(focal.x + dir[0], 0, 1), y: clamp(focal.y + dir[1], 0, 1) } })
  }

  const turn = (dir: 'cw' | 'ccw') => onChange(rotateCrop(now, dir))
  const pct = (n: number) => `${n * 100}%`
  const untouched = transform.rotate === 0 && transform.x === 0 && transform.y === 0 && transform.w === 1 && transform.h === 1 && focal.x === CENTER.x && focal.y === CENTER.y

  return (
    <div className={cn('cs-cropper', className)}>
      <div className="cs-crop-tools">
        <Segmented<Shape> ariaLabel="Shape of the crop" value={shape} onChange={setShapeAndFit} options={SHAPES} />
        <span className="cs-crop-buttons">
          <Button variant="plain" size="sm" icon aria-label="Turn left" onClick={() => turn('ccw')}>
            <RotateCcw aria-hidden="true" />
          </Button>
          <Button variant="plain" size="sm" icon aria-label="Turn right" onClick={() => turn('cw')}>
            <RotateCw aria-hidden="true" />
          </Button>
          <Button variant="plain" size="sm" disabled={untouched} onClick={() => onChange({ transform: { ...FULL, rotate: 0 }, focal: CENTER })}>
            <Undo2 aria-hidden="true" /> Reset
          </Button>
        </span>
      </div>

      <div className="cs-crop-stage" ref={stage} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        <CroppedImage asset={asset} override={{ transform: { ...FULL, rotate: transform.rotate }, focal }} alt="" />
        <div className="cs-crop-box" style={{ left: pct(transform.x), top: pct(transform.y), width: pct(transform.w), height: pct(transform.h) }} tabIndex={0} role="group" aria-label="Crop area. Arrow keys move it; plus and minus resize it." onPointerDown={start('move')} onKeyDown={keysForBox}>
          <span className="cs-crop-grid" aria-hidden="true" />
          {(locked ? CORNERS : [...CORNERS, ...EDGES]).map((h) => (
            <span key={h} className={`cs-crop-handle is-${h}`} aria-hidden="true" onPointerDown={start(h)} />
          ))}
        </div>
        <span className="cs-crop-focal" style={{ left: pct(focal.x), top: pct(focal.y) }} tabIndex={0} role="img" aria-label={`Focal point at ${Math.round(focal.x * 100)} percent across and ${Math.round(focal.y * 100)} percent down. Arrow keys move it.`} onPointerDown={start('focal')} onKeyDown={keysForFocal} />
      </div>
      <p className="field-hint">Drag the box to crop. Drag the dot onto the subject, so thumbnails of other shapes keep it in view.</p>

      <div className="cs-crop-previews" aria-label="How thumbnails look">
        {PREVIEWS.map((p) => (
          <figure key={p.label}>
            <CroppedImage asset={asset} override={{ transform, focal }} ratio={p.ratio} alt="" />
            <figcaption>{p.label}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
