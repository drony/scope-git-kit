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
import { cn } from '@/kit/lib/cn'
import { Button } from '@/kit/components/ui/Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** Buttons aligned to the bottom right. */
  actions?: ReactNode
  size?: 'md' | 'lg'
}

export function Modal({ open, onClose, title, description, children, actions, size = 'md' }: ModalProps) {
  const headingId = useId()
  const descId = useId()
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
      <FloatingOverlay lockScroll className="overlay">
        <FloatingFocusManager context={context}>
          <div
            ref={refs.setFloating}
            className={cn('modal', size === 'lg' && 'modal-lg')}
            aria-labelledby={headingId}
            aria-describedby={description ? descId : undefined}
            {...getFloatingProps()}
          >
            <Button variant="plain" size="sm" icon className="modal-close" onClick={onClose} aria-label="Close">
              <X aria-hidden="true" />
            </Button>
            <h2 className="modal-title" id={headingId}>
              {title}
            </h2>
            {description && (
              <p className="modal-desc" id={descId}>
                {description}
              </p>
            )}
            {children && <div className="modal-body">{children}</div>}
            {actions && <div className="modal-actions">{actions}</div>}
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  )
}
