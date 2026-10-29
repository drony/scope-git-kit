import { useState, type ReactNode } from 'react'
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  type Placement,
} from '@floating-ui/react'
import { cn } from '@/kit/lib/cn'

interface HoverCardProps {
  /** What the card shows. Not rendered until the card opens, so it can be as rich as you like. */
  content: ReactNode
  /** The element to hover. It is wrapped in an inline span. */
  children: ReactNode
  placement?: Placement
  /** Milliseconds the pointer must rest before the card opens. */
  delay?: number
  /** Called each time the card opens. */
  onOpen?: () => void
  className?: string
}

/**
 * A richer preview that appears when the pointer rests on something (or it receives keyboard focus): a mini chart, a few
 * facts. It stays open while the pointer travels onto it. Information only: put actions in a Popover instead.
 */
export function HoverCard({ content, children, placement = 'right-start', delay = 300, onOpen, className }: HoverCardProps) {
  const [open, setOpen] = useState(false)
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (next) => {
      setOpen(next)
      if (next) onOpen?.()
    },
    placement,
    middleware: [offset(10), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { mouseOnly: true, move: false, delay: { open: delay, close: 60 }, handleClose: safePolygon() }),
    useFocus(context),
    useDismiss(context),
    useRole(context, { role: 'tooltip' }),
  ])

  return (
    <>
      <span ref={refs.setReference} className="hovercard-ref" {...getReferenceProps()}>
        {children}
      </span>
      {open && (
        <FloatingPortal>
          <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 70 }} {...getFloatingProps()}>
            <div className={cn('pop hovercard', className)}>{content}</div>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
