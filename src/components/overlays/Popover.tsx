import { cloneElement, useState, type ReactElement, type ReactNode } from 'react'
import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  type Placement,
} from '@floating-ui/react'
import { cn } from '@/lib/cn'

interface PopoverProps {
  /** The element that opens the popover. It receives a ref and aria/click props. */
  trigger: ReactElement<Record<string, unknown>>
  children: ReactNode | ((api: { close: () => void }) => ReactNode)
  open?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: Placement
  role?: 'dialog' | 'menu' | 'listbox'
  /** Make the panel as wide as the trigger. */
  matchWidth?: boolean
  className?: string
  /** -1 leaves focus alone so the content can focus something itself. */
  initialFocus?: number
}

export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  placement = 'bottom-start',
  role = 'dialog',
  matchWidth,
  className,
  initialFocus = 0,
}: PopoverProps) {
  const [inner, setInner] = useState(false)
  const isOpen = open ?? inner
  const setOpen = (value: boolean) => {
    setInner(value)
    onOpenChange?.(value)
  }

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setOpen,
    placement,
    middleware: [
      offset(6),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ rects, elements }) {
          if (matchWidth) elements.floating.style.width = `${rects.reference.width}px`
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
    useRole(context, { role }),
  ])

  return (
    <>
      {cloneElement(trigger, getReferenceProps({ ref: refs.setReference, ...trigger.props }))}
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} initialFocus={initialFocus}>
            <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 70 }} {...getFloatingProps()}>
              <div className={cn('pop', className)}>
                {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}
