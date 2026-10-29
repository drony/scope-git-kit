import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { NAV, type MegaFeatured, type NavEntry } from '@/config/navigation'
import { ASSETS, assetStats, portfolioSeries } from '@/lib/mock'
import { useFormat } from '@/lib/format'
import { Sparkline } from '@/components/charts/Sparkline'
import { Delta } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Badge'

/* ---- featured card (right side of a mega panel) --------------------------------- */

function Featured({ data, onNavigate }: { data: MegaFeatured; onNavigate: () => void }) {
  const fmt = useFormat()
  const { portfolio } = portfolioSeries(30)
  const movers = [...ASSETS]
    .map((a) => ({ a, change: assetStats(a).change1d }))
    .sort((x, y) => Math.abs(y.change) - Math.abs(x.change))
    .slice(0, 3)
  const first = portfolio[0].y
  const last = portfolio[portfolio.length - 1].y

  return (
    <div className="mega-featured">
      <span className="eyebrow" style={{ marginBottom: 0 }}>
        {data.eyebrow}
      </span>
      <h3>{data.title}</h3>

      {data.kind === 'portfolio' && (
        <div className="mega-figure">
          <div className="row spread">
            <strong className="mono">{fmt.money(last, 0)}</strong>
            <Delta value={(last / first - 1) * 100} />
          </div>
          <Sparkline data={portfolio.map((p) => p.y)} width={260} height={56} />
        </div>
      )}

      {data.kind === 'movers' && (
        <ul className="mega-movers">
          {movers.map(({ a, change }) => (
            <li key={a.symbol}>
              <span className="mono">{a.symbol}</span>
              <span className="muted">{fmt.money(a.price, a.decimals > 2 ? 4 : 2)}</span>
              <Delta value={change} />
            </li>
          ))}
        </ul>
      )}

      <p className="small">{data.text}</p>
      <Link className="mega-cta" to={data.cta.to} onClick={onNavigate}>
        {data.cta.label}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}

/* ---- the nav list ---------------------------------------------------------------- */

export function MegaMenu() {
  const [open, setOpen] = useState<string | null>(null)
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

  // The dimmed backdrop lives on <body>: a fixed element inside the blurred header would be clipped to it.
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

  const onTriggerKey = (e: KeyboardEvent, entry: NavEntry) => {
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
      {NAV.map((entry) => {
        const isOpen = open === entry.id
        if (!entry.mega) {
          return (
            <li key={entry.id} onPointerEnter={(e) => e.pointerType === 'mouse' && schedule(null, 60)}>
              <Link
                to={entry.to ?? '/'}
                className={cn('nav-link', location.pathname === entry.to && 'is-current')}
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
              className={cn('nav-link nav-trigger', isOpen && 'is-open')}
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
            {isOpen && entry.mega && (
              <div className="mega" id={`mega-${entry.id}`}>
                <div className="container">
                  <div className="mega-grid" style={{ '--cols': entry.mega.columns.length } as CSSProperties}>
                    {entry.mega.columns.map((col) => (
                      <div className="mega-col" key={col.title}>
                        <h3>{col.title}</h3>
                        <ul>
                          {col.items.map((item) => (
                            <li key={item.id}>
                              <Link className="mega-item" to={item.to} onClick={close}>
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
                    {entry.mega.featured && <Featured data={entry.mega.featured} onNavigate={close} />}
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
