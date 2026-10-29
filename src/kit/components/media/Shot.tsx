import type { ReactNode } from 'react'
import { cn } from '@/kit/lib/cn'

interface ShotProps {
  src: string
  alt: string
  /** Intrinsic size; sets the aspect ratio so the layout does not jump while loading. */
  width?: number
  height?: number
  caption?: ReactNode
  /** Makes the photo a button, e.g. to open a lightbox. */
  onOpen?: () => void
  /** Load immediately instead of lazily (above the fold). */
  priority?: boolean
  className?: string
}

/** Photo holder: the padded, rounded, lifted frame ascope.app uses for screenshots. */
export function Shot({ src, alt, width = 1600, height = 1000, caption, onOpen, priority, className }: ShotProps) {
  const image = (
    <span className="shot-frame" style={{ aspectRatio: `${width} / ${height}` }}>
      <img src={src} alt={onOpen ? '' : alt} width={width} height={height} loading={priority ? 'eager' : 'lazy'} decoding="async" />
    </span>
  )
  return (
    <figure className={cn('shot', className)}>
      {onOpen ? (
        <button type="button" className="shot-zoom" onClick={onOpen} aria-label={`Enlarge: ${alt}`}>
          {image}
        </button>
      ) : (
        image
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
