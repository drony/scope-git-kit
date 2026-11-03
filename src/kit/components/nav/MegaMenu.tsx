import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/kit/lib/cn'
import { Tag } from '@/kit/components/ui/Badge'
import type { NavEntry, NavLink } from './navTypes'

export interface MegaSideContext<P, F> {
  entry: NavEntry<P, F>
  /** The link under the pointer or keyboard focus, or null when none has been touched yet. */
  item: NavLink<P> | null
  /** Closes the panel; call it when a link inside the side column is followed. */
  close: () => void
}

interface MegaMenuProps<P, F> {
  entries: NavEntry<P, F>[]
  /** Content of the side column of a panel. Called again whenever the hovered link changes. */
  renderSide?: (context: MegaSideContext<P, F>) => ReactNode
}

/**
 * The primary navigation list with hover, click and keyboard (↓, Esc) behavior and a mega panel per entry.
 * Entries without `mega` are plain links. Styles: kit/styles/mega.css.
 */
export function MegaMenu<P, F>({ entries, renderSide }: MegaMenuProps<P, F>) {
  const [open, setOpen] = useState<string | null>(null)
  /** The menu item under the pointer (or focused); the side panel follows it. */
  const [previewId, setPreviewId] = useState<string | null>(null)
  const via = useRef<'hover' | 'click' | 'key'>('hover')
  const timer = useRef<number | undefined>(undefined)
  const root = useRef<HTMLUListElement>(null)
  const triggers = useRef(new Map<string, HTMLButtonElement>())
  const location = useLocation()

  const close = () => {
    window.clearTimeout(timer.current)
    setOpen(null)
  }

  useEffect(() => {
    window.clearTimeout(timer.current)
    setOpen(null)
  }, [location.pathname, location.search, location.hash])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // A freshly opened panel starts with its default card; the preview follows the pointer from there.
  useEffect(() => setPreviewId(null), [open])

  // The dimmed backdrop lives on <body>: a fixed element inside a blurred header would be clipped to it.
  useEffect(() => {
    document.body.classList.toggle('mega-open', open !== null)
    return () => document.body.classList.remove('mega-open')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        const id = open
        close()
        triggers.current.get(id)?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  const schedule = (id: string | null, delay: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      via.current = 'hover'
      setOpen(id)
    }, delay)
  }

  const onTriggerKey = (e: KeyboardEvent, entry: NavEntry<P, F>) => {
    if (e.key === 'ArrowDown' && entry.mega) {
      e.preventDefault()
      via.current = 'key'
      setOpen(entry.id)
      window.setTimeout(() => document.querySelector<HTMLElement>(`#mega-${entry.id} a`)?.focus(), 30)
    }
  }

  return (
    <ul
      ref={root}
      className="nav-list"
      onPointerLeave={(e) => e.pointerType === 'mouse' && schedule(null, 180)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && window.clearTimeout(timer.current)}
    >
      {entries.map((entry) => {
        const isOpen = open === entry.id
        const previewItem = isOpen ? (entry.mega?.columns.flatMap((c) => c.items).find((i) => i.id === previewId) ?? null) : null
        if (!entry.mega) {
          return (
            <li key={entry.id} onPointerEnter={(e) => e.pointerType === 'mouse' && schedule(null, 60)}>
              <Link
                to={entry.to ?? '/'}
                className={cn('nav-link', (entry.current ?? location.pathname === entry.to) && 'is-current')}
                aria-current={location.pathname === entry.to ? 'page' : undefined}
                onFocus={() => open && setOpen(null)}
              >
                {entry.label}
              </Link>
            </li>
          )
        }
        return (
          <li key={entry.id} onPointerEnter={(e) => e.pointerType === 'mouse' && schedule(entry.id, open ? 0 : 90)}>
            <button
              ref={(el) => {
                if (el) triggers.current.set(entry.id, el)
              }}
              type="button"
              className={cn('nav-link nav-trigger', isOpen && 'is-open', entry.current && 'is-current')}
              aria-current={entry.current ? 'true' : undefined}
              aria-expanded={isOpen}
              aria-controls={`mega-${entry.id}`}
              onFocus={() => open && open !== entry.id && setOpen(null)}
              onKeyDown={(e) => onTriggerKey(e, entry)}
              onClick={() => {
                if (isOpen && via.current === 'click') close()
                else {
                  window.clearTimeout(timer.current)
                  via.current = 'click'
                  setOpen(entry.id)
                }
              }}
            >
              {entry.label}
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {isOpen && (
              <div className="mega" id={`mega-${entry.id}`}>
                <div className="container">
                  <div className={cn('mega-grid', entry.mega.dense && 'is-dense')} style={{ '--cols': entry.mega.columns.length } as CSSProperties}>
                    {entry.mega.columns.map((col) => (
                      <div className="mega-col" key={col.title}>
                        <h3>{col.title}</h3>
                        <ul>
                          {col.items.map((item) => (
                            <li key={item.id}>
                              <Link
                                className={cn('mega-item', previewId === item.id && 'is-previewed')}
                                to={item.to}
                                onClick={close}
                                onPointerEnter={() => setPreviewId(item.id)}
                                onFocus={() => setPreviewId(item.id)}
                              >
                                {item.icon && (
                                  <span className="mega-icon">
                                    <item.icon size={16} aria-hidden="true" />
                                  </span>
                                )}
                                <span>
                                  <strong>
                                    {item.label}
                                    {item.badge && <Tag tone="accent">{item.badge}</Tag>}
                                  </strong>
                                  {item.description && <span>{item.description}</span>}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {renderSide?.({ entry, item: previewItem, close })}
                  </div>
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
