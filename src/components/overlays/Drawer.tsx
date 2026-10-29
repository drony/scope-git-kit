import { useId, type ReactNode } from 'react'
import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  side?: 'right' | 'left'
  footer?: ReactNode
}

/** Modal side sheet. For a non-blocking panel (the theme editor) see DockPanel. */
export function Drawer({ open, onClose, title, children, side = 'right', footer }: DrawerProps) {
  const headingId = useId()
  const { refs, context } = useFloating({
    open,
    onOpenChange: (next) => {
      if (!next) onClose()
    },
  })
  const { getFloatingProps } = useInteractions([useDismiss(context, { outsidePressEvent: 'mousedown' }), useRole(context)])

  if (!open) return null
  return (
    <FloatingPortal>
      <FloatingOverlay lockScroll className={cn('overlay', side === 'right' ? 'is-right' : 'is-left')}>
        <FloatingFocusManager context={context}>
          <div ref={refs.setFloating} className="drawer" aria-labelledby={headingId} {...getFloatingProps()}>
            <div className="drawer-head">
              <h2 id={headingId} style={{ fontSize: '1.0625rem' }}>
                {title}
              </h2>
              <Button variant="plain" size="sm" icon onClick={onClose} aria-label="Close">
                <X aria-hidden="true" />
              </Button>
            </div>
            <div className="drawer-body">{children}</div>
            {footer && <div className="card-head" style={{ borderTop: '1px solid var(--line)', borderBottom: 0 }}>{footer}</div>}
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  )
}
