import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Inbox, Sparkles, Star } from 'lucide-react'
import { AssetPeek } from '@/apps/finscope/components/AssetPeek'
import { useWatchlist } from '@/apps/finscope/hooks/useWatchlist'
import { ASSETS, CLASS_LABELS, NEWS, assetStats, type Asset, type AssetClass, type AssetStats } from '@/apps/finscope/seed/market'
import { Sparkline } from '@/kit/components/charts/Sparkline'
import { DataTable, type Column } from '@/kit/components/data/DataTable'
import { SearchInput } from '@/kit/components/forms/Field'
import { TryList, type TryTask } from '@/kit/components/grid/TryList'
import { Pagination } from '@/kit/components/nav/Pagination'
import { Tabs } from '@/kit/components/nav/Tabs'
import { HoverCard } from '@/kit/components/overlays/HoverCard'
import { AssetIcon } from '@/kit/components/ui/AssetIcon'
import { Chip, Delta } from '@/kit/components/ui/Badge'
import { Button } from '@/kit/components/ui/Button'
import { Kpi } from '@/kit/components/ui/Card'
import { EmptyState } from '@/kit/components/ui/Feedback'
import { Reveal } from '@/kit/components/ui/Reveal'
import { StarButton } from '@/kit/components/ui/StarButton'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { useTryList } from '@/kit/hooks/useTryList'
import { useFormat } from '@/kit/lib/format'

interface Row {
  a: Asset
  s: AssetStats
}

const PAGE_SIZE = 10
type ClassTab = AssetClass | 'all' | 'watchlist'
const TABS: ClassTab[] = ['all', 'watchlist', 'stock', 'etf', 'crypto', 'fx', 'commodity']

type Quick = 'gainers' | 'losers' | 'volume'
const QUICK: { id: Quick; label: string }[] = [
  { id: 'gainers', label: 'Gainers today' },
  { id: 'losers', label: 'Losers today' },
  { id: 'volume', label: 'Most traded' },
]

/** What a visitor can do on this page; each one ticks a step of the "Try it" list. */
type MarketEvent = 'class' | 'search' | 'sort' | 'peek' | 'watch' | 'quick'
const EVENT_TASKS: Record<MarketEvent, string> = { class: 'class', search: 'search', sort: 'sort', peek: 'peek', watch: 'watch', quick: 'quick' }

const tabLabel = (c: ClassTab) => (c === 'all' ? 'All' : c === 'watchlist' ? 'Watchlist' : CLASS_LABELS[c])

export default function Markets() {
  usePageTitle('Markets')
  const fmt = useFormat()
  const navigate = useNavigate()
  const watch = useWatchlist()
  const tryout = useTryList<MarketEvent>('finscope.try.markets', EVENT_TASKS)
  const [params, setParams] = useSearchParams()
  const requested = params.get('class') as ClassTab | null
  const cls: ClassTab = requested && TABS.includes(requested) ? requested : 'all'
  const [query, setQuery] = useState('')
  const [quick, setQuick] = useState<Quick | null>(null)
  const [page, setPage] = useState(1)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const all: Row[] = useMemo(() => ASSETS.map((a) => ({ a, s: assetStats(a) })), [])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const inTab = all.filter(({ a }) => (cls === 'all' ? true : cls === 'watchlist' ? watch.has(a.symbol) : a.cls === cls))
    const searched = q ? inTab.filter(({ a }) => `${a.symbol} ${a.name}`.toLowerCase().includes(q)) : inTab
    if (quick === 'gainers') return searched.filter((r) => r.s.change1d > 0)
    if (quick === 'losers') return searched.filter((r) => r.s.change1d < 0)
    if (quick === 'volume') {
      return searched
        .filter((r) => r.a.cls !== 'fx')
        .sort((x, y) => y.a.volume * y.a.price - x.a.volume * x.a.price)
        .slice(0, 8)
    }
    return searched
    // `watch.has` changes identity with every toggle, which is what refreshes the watchlist tab.
  }, [all, cls, query, quick, watch.has])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const gainer = [...all].sort((x, y) => y.s.change1d - x.s.change1d)[0]
  const loser = [...all].sort((x, y) => x.s.change1d - y.s.change1d)[0]
  const active = [...all].filter((r) => r.a.cls !== 'fx').sort((x, y) => y.a.volume * y.a.price - x.a.volume * x.a.price)[0]

  const price = (a: Asset) => fmt.money(a.price, a.decimals > 2 ? a.decimals : a.price > 1000 ? 0 : 2)

  const columns: Column<Row>[] = [
    {
      key: 'watch',
      header: <span className="sr-only">Watchlist</span>,
      align: 'center',
      width: 48,
      render: ({ a }) => (
        <StarButton
          pressed={watch.has(a.symbol)}
          label={watch.has(a.symbol) ? `Remove ${a.symbol} from your watchlist` : `Add ${a.symbol} to your watchlist`}
          onToggle={() => {
            watch.toggle(a.symbol)
            tryout.mark('watch')
          }}
        />
      ),
    },
    {
      key: 'asset',
      header: 'Asset',
      align: 'left',
      sortValue: ({ a }) => a.symbol,
      render: ({ a }) => (
        <HoverCard content={<AssetPeek asset={a} />} onOpen={() => tryout.mark('peek')}>
          <span className="row">
            <AssetIcon symbol={a.symbol} />
            <span className="board-name">
              <strong>{a.symbol}</strong>
              <span>{a.name}</span>
            </span>
          </span>
        </HoverCard>
      ),
    },
    { key: 'price', header: 'Price', sortValue: ({ a }) => a.price, render: ({ a }) => price(a) },
    { key: 'd1', header: '1D', sortValue: ({ s }) => s.change1d, render: ({ s }) => <Delta value={s.change1d} /> },
    { key: 'd7', header: '7D', sortValue: ({ s }) => s.change7d, render: ({ s }) => <Delta value={s.change7d} /> },
    { key: 'd30', header: '30D', sortValue: ({ s }) => s.change30d, render: ({ s }) => <Delta value={s.change30d} /> },
    { key: 'spark', header: 'Trend', render: ({ s }) => <Sparkline data={s.spark} width={80} height={24} /> },
    {
      key: 'vol',
      header: 'Volume',
      sortValue: ({ a }) => a.volume,
      render: ({ a }) => (a.cls === 'fx' ? <span className="muted">—</span> : fmt.compact(a.volume)),
    },
  ]

  const tasks: TryTask[] = [
    { id: 'class', title: 'Pick an asset class', hint: 'Open Crypto, Forex or Commodities from the tabs.' },
    { id: 'search', title: 'Search', hint: 'Press / and type a name such as “gold” or “apple”.' },
    { id: 'sort', title: 'Sort a column', hint: 'Click 30D or Volume in the table header.' },
    { id: 'peek', title: 'Peek at an asset', hint: 'Rest the pointer on a name for a moment to see a mini chart and key figures.' },
    { id: 'watch', title: 'Add to your watchlist', hint: 'Click a star. The message has an Undo button, and the Watchlist tab fills up.' },
    { id: 'quick', title: 'Use a quick filter', hint: 'Try “Gainers today” or “Most traded” under the tabs.' },
  ]

  const watchedCount = ASSETS.filter((a) => watch.has(a.symbol)).length

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Markets</span>
          <h1>
            What is <span className="gradient">moving</span> today
          </h1>
          <p className="lead">Stocks, ETFs, crypto, currencies and metals in one table. Sort any column, search by name, or open a full chart.</p>
          <div className="cta-row">
            <Button variant="ghost" aria-expanded={tryout.open} onClick={() => tryout.setOpen(!tryout.open)}>
              <Sparkles aria-hidden="true" />
              Try it
              <span className="g-badge">
                {tryout.done.size}/{tasks.length}
              </span>
            </Button>
          </div>
        </div>
      </section>

      <section className="section dash-section">
        <div className="container stack-lg">
          {tryout.open && (
            <TryList
              heading="Try the markets"
              tasks={tasks}
              done={tryout.done}
              allDoneText="You have tried everything. Your watchlist is shared with the home page and the asset pages."
              closeLabel="Hide"
              onClose={() => tryout.setOpen(false)}
            />
          )}

          <Reveal className="lattice lattice-3">
            <Kpi label="Top gainer" value={gainer.a.symbol} sub={<Delta value={gainer.s.change1d} />} />
            <Kpi label="Top loser" value={loser.a.symbol} sub={<Delta value={loser.s.change1d} />} />
            <Kpi label="Most traded" value={active.a.symbol} sub={`${fmt.compact(active.a.volume)} units a day`} />
          </Reveal>

          <div className="stack">
            <div className="row spread wrap">
              <Tabs
                ariaLabel="Asset class"
                value={cls}
                onChange={(id) => {
                  setPage(1)
                  if (id !== 'all') tryout.mark('class')
                  setParams(id === 'all' ? {} : { class: id }, { replace: true })
                }}
                items={TABS.map((c) => ({
                  id: c,
                  label: tabLabel(c),
                  count: c === 'all' ? ASSETS.length : c === 'watchlist' ? watchedCount : ASSETS.filter((a) => a.cls === c).length,
                }))}
              />
              <div style={{ width: '16rem', maxWidth: '100%' }}>
                <SearchInput
                  ref={searchRef}
                  value={query}
                  onValueChange={(v) => {
                    setQuery(v)
                    setPage(1)
                    if (v) tryout.mark('search')
                  }}
                  shortcut="/"
                  placeholder="Search assets"
                  aria-label="Search assets"
                />
              </div>
            </div>

            <div className="row wrap">
              <span className="small">Quick filters</span>
              {QUICK.map((q) => (
                <Chip
                  key={q.id}
                  pressed={quick === q.id}
                  onClick={() => {
                    setQuick(quick === q.id ? null : q.id)
                    setPage(1)
                    tryout.mark('quick')
                  }}
                >
                  {q.label}
                </Chip>
              ))}
            </div>

            <DataTable
              caption="Markets"
              columns={columns}
              rows={visible}
              rowKey={({ a }) => a.symbol}
              onRowClick={({ a }) => navigate(`/markets/${a.symbol}`)}
              onSortChange={(sort) => sort && tryout.mark('sort')}
              empty={
                cls === 'watchlist' && !query && !quick ? (
                  <EmptyState icon={<Star size={18} />} title="Your watchlist is empty">
                    Click the star next to an asset to add it here.
                  </EmptyState>
                ) : (
                  <EmptyState icon={<Inbox size={18} />} title="No assets match">
                    Try another name, or clear the quick filter.
                  </EmptyState>
                )
              }
            />
            <div className="row spread">
              <span className="small">
                Showing {visible.length ? (current - 1) * PAGE_SIZE + 1 : 0}–{(current - 1) * PAGE_SIZE + visible.length} of {filtered.length}
              </span>
              <Pagination page={current} pageCount={pageCount} onChange={setPage} />
            </div>
          </div>

          <Reveal>
            <span className="eyebrow">Headlines</span>
            <div className="board">
              <ul className="mover-rows news-rows">
                {NEWS.map((n) => (
                  <li key={n.id}>
                    <span className="board-icon" style={{ background: 'var(--accent)' }} aria-hidden="true">
                      {n.source[0]}
                    </span>
                    <span className="board-name">
                      <strong>
                        <Link to="/markets" style={{ color: 'inherit' }}>
                          {n.title}
                        </Link>
                      </strong>
                      <span>{n.source}</span>
                    </span>
                    <span className="board-ratings">{n.time} ago</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
