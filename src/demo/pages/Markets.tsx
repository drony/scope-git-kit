import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import { useFormat } from '@/kit/lib/format'
import { ASSETS, CLASS_LABELS, NEWS, assetStats, type Asset, type AssetClass, type AssetStats } from '@/demo/seed/market'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { AssetIcon } from '@/kit/components/ui/AssetIcon'
import { Delta } from '@/kit/components/ui/Badge'
import { EmptyState } from '@/kit/components/ui/Feedback'
import { Kpi } from '@/kit/components/ui/Card'
import { Reveal } from '@/kit/components/ui/Reveal'
import { Tabs } from '@/kit/components/nav/Tabs'
import { Pagination } from '@/kit/components/nav/Pagination'
import { DataTable, type Column } from '@/kit/components/data/DataTable'
import { Sparkline } from '@/kit/components/charts/Sparkline'
import { SearchInput } from '@/kit/components/forms/Field'

interface Row {
  a: Asset
  s: AssetStats
}

const PAGE_SIZE = 10
const CLASSES: (AssetClass | 'all')[] = ['all', 'stock', 'etf', 'crypto', 'fx', 'commodity']

export default function Markets() {
  usePageTitle('Markets')
  const fmt = useFormat()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const requested = params.get('class') as AssetClass | null
  const cls: AssetClass | 'all' = requested && CLASSES.includes(requested) ? requested : 'all'
  const [query, setQuery] = useState('')
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
    return all.filter(({ a }) => (cls === 'all' || a.cls === cls) && (!q || `${a.symbol} ${a.name}`.toLowerCase().includes(q)))
  }, [all, cls, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const gainer = [...all].sort((x, y) => y.s.change1d - x.s.change1d)[0]
  const loser = [...all].sort((x, y) => x.s.change1d - y.s.change1d)[0]
  const active = [...all].filter((r) => r.a.cls !== 'fx').sort((x, y) => y.a.volume * y.a.price - x.a.volume * x.a.price)[0]

  const price = (a: Asset) => fmt.money(a.price, a.decimals > 2 ? a.decimals : a.price > 1000 ? 0 : 2)

  const columns: Column<Row>[] = [
    {
      key: 'asset',
      header: 'Asset',
      sortValue: ({ a }) => a.symbol,
      render: ({ a }) => (
        <span className="row">
          <AssetIcon symbol={a.symbol} />
          <span className="board-name">
            <strong>{a.symbol}</strong>
            <span>{a.name}</span>
          </span>
        </span>
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

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Markets</span>
          <h1>
            What is <span className="gradient">moving</span> today
          </h1>
          <p className="lead">Stocks, ETFs, crypto, currencies and metals in one table. Sort any column, search by name, or open a full chart.</p>
        </div>
      </section>

      <section className="section dash-section">
        <div className="container stack-lg">
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
                  setParams(id === 'all' ? {} : { class: id }, { replace: true })
                }}
                items={CLASSES.map((c) => ({
                  id: c,
                  label: c === 'all' ? 'All' : CLASS_LABELS[c],
                  count: c === 'all' ? ASSETS.length : ASSETS.filter((a) => a.cls === c).length,
                }))}
              />
              <div style={{ width: '16rem', maxWidth: '100%' }}>
                <SearchInput
                  ref={searchRef}
                  value={query}
                  onValueChange={(v) => {
                    setQuery(v)
                    setPage(1)
                  }}
                  shortcut="/"
                  placeholder="Search assets"
                  aria-label="Search assets"
                />
              </div>
            </div>
            <DataTable
              caption="Markets"
              columns={columns}
              rows={visible}
              rowKey={({ a }) => a.symbol}
              onRowClick={({ a }) => navigate(`/markets/${a.symbol}`)}
              empty={<EmptyState icon={<Inbox size={18} />} title="No assets match">Try another name or clear the search.</EmptyState>}
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
