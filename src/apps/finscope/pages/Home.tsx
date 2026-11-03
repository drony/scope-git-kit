import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShieldCheck, SquareTerminal } from 'lucide-react'
import { useConfig, useSite } from '@/kit/context/ConfigContext'
import { FAQS } from '@/apps/finscope/seed/content'
import { useFormat } from '@/kit/lib/format'
import { ASSETS, assetStats, eventsForMonth, portfolioSeries } from '@/apps/finscope/seed/market'
import { asset } from '@/kit/lib/asset'
import { toKey, today } from '@/kit/lib/date'
import { useWatchlist } from '@/apps/finscope/hooks/useWatchlist'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { Button, ButtonLink } from '@/kit/components/ui/Button'
import { Delta } from '@/kit/components/ui/Badge'
import { AssetIcon } from '@/kit/components/ui/AssetIcon'
import { BrandMark } from '@/apps/finscope/layout/Logo'
import { Meter } from '@/kit/components/ui/Feedback'
import { Reveal } from '@/kit/components/ui/Reveal'
import { Card } from '@/kit/components/ui/Card'
import { Section, SectionHead } from '@/kit/components/ui/Section'
import { Terminal } from '@/kit/components/ui/Terminal'
import { Accordion } from '@/kit/components/nav/Accordion'
import { Segmented } from '@/kit/components/nav/Segmented'
import { AreaChart } from '@/kit/components/charts/AreaChart'
import { Sparkline } from '@/kit/components/charts/Sparkline'
import { Calendar, type CalendarMarks } from '@/kit/components/calendar/Calendar'
import { Shot } from '@/kit/components/media/Shot'
import { PricingSection } from '@/apps/finscope/components/PricingSection'

const WATCH = ['AAPL', 'NVDA', 'BTC', 'VOO', 'XAUUSD', 'EURUSD']

function Hero() {
  const fmt = useFormat()
  const { currency } = useSite()
  const rows = WATCH.map((s) => ASSETS.find((a) => a.symbol === s)!)
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          <Reveal>
            <h1>
              Every account.
              <br />
              <span className="gradient gradient-head">One clear picture.</span>
            </h1>
            <p className="lead">
              Finscope brings your bank, brokerage and crypto accounts into one calm page, with the same five numbers next to every holding.{' '}
              <strong>No spreadsheets, no tab juggling.</strong>
            </p>
            <div className="cta-row">
              <ButtonLink to="/register" size="lg" arrow>
                Open an account
              </ButtonLink>
              <ButtonLink to="/dashboard" size="lg" variant="ghost">
                See the dashboard
              </ButtonLink>
            </div>
            <p className="hero-note">Free to start. Plus is $7 a month billed yearly. Every figure on this page is sample data.</p>
            <div className="hero-badges">
              <Link className="badge" to="/help/security-basics">
                <ShieldCheck aria-hidden="true" />
                <strong>Read-only access</strong>
              </Link>
              <Link className="badge" to="/help/api-access">
                <SquareTerminal aria-hidden="true" />
                <span>
                  <strong>API</strong> <span>for developers</span>
                </span>
              </Link>
            </div>
          </Reveal>

          <Reveal index={2} className="board" aria-label="Example watchlist">
            <div className="board-bar">
              <span className="board-query">
                <Search aria-hidden="true" />
                Your watchlist
              </span>
              <span className="board-meta board-meta-country">{currency} · Live</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th>30D</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a, i) => {
                  const s = assetStats(a)
                  return (
                    <tr key={a.symbol} className={i === 0 ? 'is-you' : undefined}>
                      <td>
                        <Link to={`/markets/${a.symbol}`}>{a.symbol}</Link>
                      </td>
                      <td className="mono">{fmt.money(a.price, a.decimals > 2 ? 4 : a.price > 1000 ? 0 : 2)}</td>
                      <td>
                        <Delta value={s.change1d} />
                      </td>
                      <td>
                        <Sparkline data={s.spark} width={72} height={22} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="board-caption">
              <span>An example watchlist, read this morning</span>
              <span>6 of 42 symbols</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function FiveNumbers() {
  const fmt = useFormat()
  return (
    <Section>
      <SectionHead
        eyebrow="Five numbers"
        title={
          <>
            Enough to tell you
            <br />
            where to put the next dollar.
          </>
        }
        lead={
          <>
            Every holding carries the same five readings, refreshed all day. More on <Link to="/markets">markets</Link> and the{' '}
            <Link to="/dashboard">portfolio dashboard</Link>.
          </>
        }
      />
      <Reveal className="anatomy">
        <div>
          <div className="cell cell-keyword">
            <strong>AAPL</strong>
            <span>NASDAQ</span>
          </div>
          <strong className="anatomy-label">Symbol</strong>
          <p className="small">Any listing across 40+ markets. Compare the same name in different currencies.</p>
        </div>
        <div>
          <div className="cell">
            <b>{fmt.money(231.4)}</b>
          </div>
          <strong className="anatomy-label">Price</strong>
          <p className="small">Live in market hours, delayed 15 minutes on Starter.</p>
        </div>
        <div>
          <div className="cell">
            <b className="delta" style={{ fontFamily: 'var(--sans)', fontSize: '1.375rem' }}>
              +2.41%
            </b>
          </div>
          <strong className="anatomy-label">Change</strong>
          <p className="small">Since yesterday’s close. Switch to 1 week, 1 year or since you bought.</p>
        </div>
        <div>
          <div className="cell">
            <b>62</b>
            <Meter value={62} label="Momentum 62 of 100" />
          </div>
          <strong className="anatomy-label">Momentum</strong>
          <p className="small">A 0 to 100 score built from price trend and volume. Higher means stronger.</p>
        </div>
        <div>
          <div className="cell">
            <b>41</b>
            <Meter value={41} label="Risk 41 of 100" />
          </div>
          <strong className="anatomy-label">Risk</strong>
          <p className="small">0 to 100, based on recent swings. Lower is calmer.</p>
        </div>
      </Reveal>
    </Section>
  )
}

function ChartSection() {
  const fmt = useFormat()
  const [range, setRange] = useState<'1M' | '3M' | '1Y'>('3M')
  const days = { '1M': 30, '3M': 90, '1Y': 365 }[range]
  const { portfolio, benchmark } = useMemo(() => portfolioSeries(days), [days])
  const first = portfolio[0].y
  const last = portfolio[portfolio.length - 1].y

  return (
    <Section>
      <div className="split">
        <Reveal>
          <span className="eyebrow">Charts</span>
          <h2>
            It opens at once, and
            <br />
            draws without a spinner.
          </h2>
          <p className="lead">
            Hover or use the arrow keys to read any day. Compare your portfolio with the S&P 500 and see what your last move really did.
          </p>
          <ul className="checks">
            <li>Area, bar, donut, candlestick and heatmap charts</li>
            <li>Keyboard and screen reader friendly</li>
            <li>Colors follow your theme, light or dark</li>
          </ul>
        </Reveal>
        <Reveal index={2} className="card">
          <div className="row spread top" style={{ marginBottom: '1rem' }}>
            <div className="kpi">
              <span className="kpi-label">Portfolio value</span>
              <span className="kpi-value">{fmt.money(last, 0)}</span>
              <span className="kpi-sub">
                <Delta value={(last / first - 1) * 100} /> over {range === '1Y' ? 'a year' : range === '3M' ? '3 months' : 'a month'}
              </span>
            </div>
            <Segmented
              ariaLabel="Chart range"
              mono
              value={range}
              onChange={setRange}
              options={[
                { value: '1M', label: '1M' },
                { value: '3M', label: '3M' },
                { value: '1Y', label: '1Y' },
              ]}
            />
          </div>
          <AreaChart
            ariaLabel={`Portfolio value over ${range}, compared with the S&P 500`}
            height={260}
            formatY={(n) => fmt.moneyCompact(n)}
            formatX={(d) => fmt.date(d, 'day')}
            formatTip={(d) => fmt.date(d, 'short')}
            series={[
              { id: 'p', label: 'Portfolio', data: portfolio, area: true },
              { id: 'b', label: 'S&P 500', data: benchmark, dashed: true, color: 'var(--muted)' },
            ]}
          />
        </Reveal>
      </div>
      <dl className="facts">
        <Reveal as="div">
          <dt>Your data stays yours</dt>
          <dd>Read-only connections, passkey sign-in and exports whenever you want them.</dd>
        </Reveal>
        <Reveal as="div" index={1}>
          <dt>Costs, already counted</dt>
          <dd>Fees and taxes are shown next to every trade, so the number you see is the number you keep.</dd>
        </Reveal>
        <Reveal as="div" index={2}>
          <dt>Every account, one place</dt>
          <dd>Checking, brokerage, crypto and manual assets, in any currency, on one chart.</dd>
        </Reveal>
      </dl>
    </Section>
  )
}

function ScreenSection() {
  const { resolvedMode } = useConfig()
  return (
    <Section>
      <SectionHead
        eyebrow="The dashboard"
        title={
          <>
            Everything you own,
            <br />
            on a single screen.
          </>
        }
        lead="Net worth, allocation, holdings and the month's cash flow, all aligned to the same grid."
      />
      <Reveal>
        <Shot
          src={asset(resolvedMode === 'dark' ? 'images/dashboard-dark.svg' : 'images/dashboard-light.svg')}
          alt="The Finscope dashboard showing net worth, a performance chart, allocation and holdings"
          width={1600}
          height={1000}
          caption="Sample data. The screenshot switches with your color mode."
        />
      </Reveal>
    </Section>
  )
}

function Movers() {
  const fmt = useFormat()
  const watchlist = useWatchlist()
  const movers = useMemo(
    () =>
      ASSETS.map((a) => ({ a, s: assetStats(a) }))
        .sort((x, y) => Math.abs(y.s.change1d) - Math.abs(x.s.change1d))
        .slice(0, 5),
    [],
  )

  return (
    <Section>
      <div className="split">
        <Reveal>
          <span className="eyebrow">Movers</span>
          <h2>
            See what moved
            <br />
            before your coffee cools.
          </h2>
          <p className="lead">The five biggest swings across stocks, crypto, currencies and metals, with price and volume beside each one.</p>
          <ul className="checks">
            <li>One tap to watch any of them</li>
            <li>Alerts when a watched name moves 5% or more</li>
            <li>Jump straight to a full chart and order ticket</li>
          </ul>
        </Reveal>
        <Reveal index={2} className="board">
          <div className="board-bar">
            <span className="board-meta">Top movers today</span>
          </div>
          <ul className="mover-rows">
            {movers.map(({ a, s }) => (
              <li key={a.symbol}>
                <AssetIcon symbol={a.symbol} />
                <span className="board-name">
                  <strong>
                    <Link to={`/markets/${a.symbol}`} style={{ color: 'inherit' }}>
                      {a.name}
                    </Link>
                  </strong>
                  <span>{a.symbol}</span>
                </span>
                <span className="board-ratings">
                  {fmt.money(a.price, a.decimals > 2 ? 4 : a.price > 1000 ? 0 : 2)}
                  <br />
                  <Delta value={s.change1d} />
                </span>
                <button type="button" className={watchlist.has(a.symbol) ? 'watch-btn is-on' : 'watch-btn'} aria-pressed={watchlist.has(a.symbol)} onClick={() => watchlist.toggle(a.symbol)}>
                  {watchlist.has(a.symbol) ? 'Watching' : 'Watch'}
                </button>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  )
}

function CalendarSection() {
  const now = today()
  const events = useMemo(() => eventsForMonth(now.getFullYear(), now.getMonth()), [now])
  const marks: CalendarMarks = useMemo(() => Object.fromEntries(events.map((e) => [toKey(e.date), e.tone])), [events])
  const fmt = useFormat()
  const [selected, setSelected] = useState<Date | null>(now)
  const upcoming = events.filter((e) => e.date >= now).slice(0, 4)

  return (
    <Section>
      <div className="split">
        <Reveal className="card calendar-card">
          <Calendar mode="single" value={selected} onChange={setSelected} marks={marks} />
        </Reveal>
        <Reveal index={2}>
          <span className="eyebrow">Money calendar</span>
          <h2>
            Never miss a payday,
            <br />a bill or a dividend.
          </h2>
          <p className="lead">Paydays, due dates, dividends and earnings land on one calendar, with the month and year pickers you would expect.</p>
          <ul className="upcoming">
            {upcoming.map((e) => (
              <li key={e.id}>
                <span className={`dot ${e.tone === 'warning' ? 'dot-warning' : e.tone === 'error' ? 'dot-error' : ''}`} aria-hidden="true" />
                <span>{e.title}</span>
                <span className="mono small">{fmt.date(e.date, 'day')}</span>
              </li>
            ))}
          </ul>
          <div className="cta-row">
            <ButtonLink to="/calendar" variant="ghost">
              Open the calendar
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

function ApiSection() {
  return (
    <Section>
      <div className="split">
        <Reveal>
          <span className="eyebrow">API · Included in Pro</span>
          <h2>
            Ask which holdings
            <br />
            dropped this week.
          </h2>
          <p className="lead">
            Read quotes, balances and transactions with one request, or connect an assistant and just ask. It runs against your own data, with a key you can revoke.
          </p>
          <Terminal
            head="Connect"
            rows={[
              { label: 'cURL', code: 'curl -H "Authorization: Bearer $FINSCOPE_KEY" https://api.finscope.example/v1/holdings', shell: true },
              { label: 'Node', code: 'npm install @finscope/client', shell: true },
            ]}
          />
          <ul className="clients">
            {['cURL', 'Python', 'Node', 'Google Sheets', 'Excel', 'Any REST client'].map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="cta-row">
            <ButtonLink to="/help/api-access" variant="ghost">
              Read the API guide
            </ButtonLink>
          </div>
        </Reveal>
        <Reveal index={2} className="chat" aria-label="Example conversation">
          <div className="chat-source">Assistant, connected to your portfolio</div>
          <p className="msg-user">Which holdings dropped this week?</p>
          <div className="msg-ai">
            <p>Three positions fell since last Monday:</p>
            <ul>
              <li>
                <span>BTC</span>
                <span>$74,380 → $71,204</span>
                <span className="delta delta-down">−4.3%</span>
              </li>
              <li>
                <span>QQQ</span>
                <span>$531 → $522</span>
                <span className="delta delta-down">−1.7%</span>
              </li>
              <li>
                <span>XAUUSD</span>
                <span>$2,701 → $2,688</span>
                <span className="delta delta-down">−0.5%</span>
              </li>
            </ul>
            <p>
              Bitcoin is <strong>11% of your portfolio</strong>, so it moved your total the most, down about 0.5% on the week.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

/** A way into the other demo built on the same kit. */
function OtherDemo() {
  const other = import.meta.env.APP_LINKS.find((a) => a.id !== 'finscope')
  if (!other) return null
  return (
    <Section>
      <Card className="row spread wrap">
        <div className="stack">
          <span className="eyebrow">Same kit, another product</span>
          <strong>Looking at something different?</strong>
          <p>
            {other.title} is a contest platform built from the same components: questions and answers, media, announcements, participants and scoring.
          </p>
        </div>
        <a className="btn has-arrow" href={other.href}>
          Open {other.title}
        </a>
      </Card>
    </Section>
  )
}

export default function Home() {
  usePageTitle()
  return (
    <>
      <Hero />
      <OtherDemo />
      <FiveNumbers />
      <ChartSection />
      <ScreenSection />
      <Movers />
      <CalendarSection />
      <ApiSection />
      <Section id="pricing">
        <PricingSection />
      </Section>
      <Section id="faq">
        <div className="faq-layout">
          <Reveal>
            <span className="eyebrow">FAQ</span>
            <h2>
              Questions,
              <br />
              answered
            </h2>
            <p className="lead">Cannot find yours? The Help center has guides for every part of the product.</p>
            <div className="cta-row">
              <ButtonLink to="/help" variant="ghost" size="sm">
                Visit the Help center
              </ButtonLink>
            </div>
          </Reveal>
          <Reveal index={2}>
            <Accordion name="home-faq" items={FAQS.map((f) => ({ id: f.id, title: f.q, content: <p>{f.a}</p> }))} />
          </Reveal>
        </div>
      </Section>
      <section className="final-cta">
        <div className="container center">
          <Reveal>
            <BrandMark size={72} />
            <h2>
              Find out where you
              <br />
              stand today
            </h2>
            <p className="lead">Link an account in about a minute. After that Finscope keeps the picture up to date while you get on with your day.</p>
            <div className="cta-row">
              <ButtonLink to="/register" size="lg" arrow>
                Open an account
              </ButtonLink>
              <Button variant="ghost" size="lg" onClick={() => document.getElementById('pricing')?.scrollIntoView()}>
                Compare plans
              </Button>
            </div>
            <span className="final-guarantee">
              <ShieldCheck aria-hidden="true" />
              Free to start, full refund within 14 days
            </span>
          </Reveal>
        </div>
      </section>
    </>
  )
}
