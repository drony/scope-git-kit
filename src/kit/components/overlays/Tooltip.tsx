import { cloneElement, useState, type ReactElement, type ReactNode } from 'react'
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  type Placement,
} from '@floating-ui/react'

export function Tooltip({
  label,
  children,
  placement = 'top',
}: {
  label: ReactNode
  children: ReactElement<Record<string, unknown>>
  placement?: Placement
}) {
  const [open, setOpen] = useState(false)
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { move: false, delay: { open: 120, close: 0 } }),
    useFocus(context),
    useDismiss(context),
    useRole(context, { role: 'tooltip' }),
  ])

  return (
    <>
      {cloneElement(children, getReferenceProps({ ref: refs.setReference, ...children.props }))}
      {open && (
        <FloatingPortal>
          <div ref={refs.setFloating} style={floatingStyles} className="tip" {...getFloatingProps()}>
            {label}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
