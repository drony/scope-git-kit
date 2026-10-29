import { cloneElement, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
  type Placement,
} from '@floating-ui/react'
import { cn } from '@/lib/cn'

export type MenuEntry =
  | {
      type?: 'item'
      id: string
      label: ReactNode
      icon?: ReactNode
      onSelect?: () => void
      /** Renders a router link instead of a button. */
      to?: string
      danger?: boolean
    }
  | { type: 'separator'; id: string }
  | { type: 'label'; id: string; label: ReactNode }
  | { type: 'custom'; id: string; node: ReactNode }

export function Menu({
  trigger,
  entries,
  placement = 'bottom-end',
}: {
  trigger: ReactElement<Record<string, unknown>>
  entries: MenuEntry[]
  placement?: Placement
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<number | null>(null)
  const listRef = useRef<(HTMLElement | null)[]>([])

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    useClick(context),
    useDismiss(context),
    useRole(context, { role: 'menu' }),
    useListNavigation(context, { listRef, activeIndex: active, onNavigate: setActive, loop: true }),
  ])

  let index = -1

  return (
    <>
      {cloneElement(trigger, getReferenceProps({ ref: refs.setReference, ...trigger.props }))}
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} initialFocus={-1}>
            <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 70 }} {...getFloatingProps()}>
              <div className="pop menu">
                {entries.map((entry) => {
                  if (entry.type === 'separator') return <div key={entry.id} className="menu-sep" role="separator" />
                  if (entry.type === 'label') {
                    return (
                      <div key={entry.id} className="menu-label">
                        {entry.label}
                      </div>
                    )
                  }
                  if (entry.type === 'custom') return <div key={entry.id}>{entry.node}</div>

                  index += 1
                  const i = index
                  const common = {
                    role: 'menuitem',
                    tabIndex: active === i ? 0 : -1,
                    'data-active': active === i,
                    className: cn('menu-item', entry.danger && 'is-danger'),
                  }
                  const props = getItemProps({
                    onClick() {
                      entry.onSelect?.()
                      setOpen(false)
                    },
                  })
                  return entry.to ? (
                    <Link
                      key={entry.id}
                      to={entry.to}
                      ref={(el) => {
                        listRef.current[i] = el
                      }}
                      {...common}
                      {...props}
                    >
                      {entry.icon}
                      {entry.label}
                    </Link>
                  ) : (
                    <button
                      key={entry.id}
                      type="button"
                      ref={(el) => {
                        listRef.current[i] = el
                      }}
                      {...common}
                      {...props}
                    >
                      {entry.icon}
                      {entry.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}
