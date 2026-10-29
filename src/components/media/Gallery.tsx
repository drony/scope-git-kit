import { useEffect, useState, type KeyboardEvent } from 'react'
import {
  FloatingFocusManager,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Shot } from './Shot'

export interface GalleryItem {
  src: string
  alt: string
  caption?: string
  width?: number
  height?: number
}

interface LightboxProps {
  items: GalleryItem[]
  index: number | null
  onIndexChange: (index: number | null) => void
}

/** Full-screen photo viewer: arrows or ← → to browse, Esc to close. */
export function Lightbox({ items, index, onIndexChange }: LightboxProps) {
  const open = index !== null
  const { refs, context } = useFloating({
    open,
    onOpenChange: (next) => {
      if (!next) onIndexChange(null)
    },
  })
  const { getFloatingProps } = useInteractions([useDismiss(context), useRole(context)])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (index === null) return null
  const item = items[index]
  const go = (delta: number) => onIndexChange((index + delta + items.length) % items.length)

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') go(-1)
    else if (e.key === 'ArrowRight') go(1)
  }

  return (
    <FloatingPortal>
      <FloatingFocusManager context={context}>
        <div
          ref={refs.setFloating}
          className="lightbox"
          aria-label="Photo viewer"
          onKeyDown={onKeyDown}
          {...getFloatingProps()}
        >
          <div className="lightbox-bar">
            <span>
              {index + 1} / {items.length}
            </span>
            <Button variant="plain" size="sm" icon onClick={() => onIndexChange(null)} aria-label="Close viewer">
              <X aria-hidden="true" />
            </Button>
          </div>
          <div className="lightbox-stage">
            {items.length > 1 && (
              <Button variant="ghost" icon className="lightbox-nav prev" onClick={() => go(-1)} aria-label="Previous photo">
                <ChevronLeft aria-hidden="true" />
              </Button>
            )}
            <img src={item.src} alt={item.alt} />
            {items.length > 1 && (
              <Button variant="ghost" icon className="lightbox-nav next" onClick={() => go(1)} aria-label="Next photo">
                <ChevronRight aria-hidden="true" />
              </Button>
            )}
          </div>
          <p className="lightbox-caption">{item.caption ?? item.alt}</p>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  )
}

/** Responsive grid of photos that open in the Lightbox. */
export function Gallery({ items }: { items: GalleryItem[] }) {
  const [index, setIndex] = useState<number | null>(null)
  return (
    <>
      <div className="gallery">
        {items.map((item, i) => (
          <Shot
            key={item.src}
            src={item.src}
            alt={item.alt}
            width={item.width ?? 1200}
            height={item.height ?? 800}
            caption={item.caption}
            onOpen={() => setIndex(i)}
          />
        ))}
      </div>
      <Lightbox items={items} index={index} onIndexChange={setIndex} />
    </>
  )
}
