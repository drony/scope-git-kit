import { useState } from 'react'
import { cn } from '@/kit/lib/cn'
import type { MediaAsset } from '../data/types'
import { CENTER, FULL, rotatedAspect, visibleWindow, type Rotation } from '../lib/crop'

export type CroppedImageAsset = Pick<MediaAsset, 'url' | 'name' | 'alt' | 'width' | 'height' | 'focal' | 'transform'>

interface CroppedImageProps {
  asset: CroppedImageAsset
  /** Width ÷ height of the box, for example 1 for a square. Leave out to show the crop in its own shape. */
  ratio?: number
  /** Overrides the asset's crop, for live previews while editing. */
  override?: Pick<MediaAsset, 'transform' | 'focal'>
  alt?: string
  className?: string
}

/**
 * A picture shown through its saved crop, rotation and focal point. The file is never changed: this draws the right part
 * of it. In a box of another shape (`ratio`) the picture slides toward the focal point so the subject stays in view.
 */
export function CroppedImage({ asset, ratio, override, alt, className }: CroppedImageProps) {
  const [measured, setMeasured] = useState<{ w: number; h: number }>()
  const w = asset.width ?? measured?.w
  const h = asset.height ?? measured?.h
  const transform = (override ?? asset).transform
  const focal = (override ?? asset).focal ?? CENTER
  const rotate: Rotation = transform?.rotate ?? 0
  const text = alt ?? asset.alt ?? asset.name

  if (!w || !h) {
    // The size is unknown until the file has loaded; measure it, then draw.
    return (
      <div className={cn('cs-cropped', className)} style={{ aspectRatio: ratio ?? 4 / 3 }}>
        <img className="cs-cropped-plain" src={asset.url} alt={text} onLoad={(e) => setMeasured({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
      </div>
    )
  }

  const da = rotatedAspect(w, h, rotate)
  const rect = visibleWindow(da, transform ?? FULL, focal, ratio)
  const turned = rotate % 180 !== 0
  return (
    <div className={cn('cs-cropped', className)} style={{ aspectRatio: ratio ?? (rect.w * da) / rect.h }}>
      <div className="cs-cropped-view" style={{ left: `${(-rect.x / rect.w) * 100}%`, top: `${(-rect.y / rect.h) * 100}%`, width: `${100 / rect.w}%`, height: `${100 / rect.h}%` }}>
        <img
          src={asset.url}
          alt={text}
          draggable={false}
          style={{ width: turned ? '100cqh' : '100%', height: turned ? '100cqw' : '100%', transform: `translate(-50%, -50%) rotate(${rotate}deg)` }}
        />
      </div>
    </div>
  )
}
