/**
 * Deterministic sample data. Prices, holdings and transactions are fictional and exist only
 * so every screen has something realistic to show. Replace this module with your API layer.
 */
import { addDays, addMonths, today, toKey } from '@/kit/lib/date'
import { mulberry32 } from '@/kit/lib/random'
import type { Point } from '@/kit/components/charts/AreaChart'
import type { Candle } from '@/kit/components/charts/CandlestickChart'
import type { CalendarEvent } from '@/kit/components/calendar/EventCalendar'

function walk(seed: number, n: number, vol: number, drift: number): number[] {
  const rand = mulberry32(seed)
  const out = [1]
  for (let i = 1; i < n; i++) out.push(out[i - 1] * (1 + drift + (rand() - 0.5) * vol * 2))
  return out
}

/* ---- assets ------------------------------------------------------------- */

export type AssetClass = 'stock' | 'etf' | 'crypto' | 'fx' | 'commodity'

export interface Asset {
  symbol: string
  name: string
  cls: AssetClass
  price: number
  seed: number
  vol: number
  drift: number
  /** Average daily volume in units. */
  volume: number
  decimals: number
}

export const CLASS_LABELS: Record<AssetClass, string> = {
  stock: 'Stocks',
  etf: 'ETFs',
  crypto: 'Crypto',
  fx: 'Forex',
  commodity: 'Commodities',
}

const a = (
  symbol: string,
  name: string,
  cls: AssetClass,
  price: number,
  seed: number,
  vol: number,
  drift: number,
  volume: number,
  decimals = 2,
): Asset => ({ symbol, name, cls, price, seed, vol, drift, volume, decimals })

export const ASSETS: Asset[] = [
  a('AAPL', 'Apple Inc.', 'stock', 231.4, 11, 0.011, 0.0006, 52e6),
  a('MSFT', 'Microsoft', 'stock', 432.1, 12, 0.01, 0.0005, 21e6),
  a('NVDA', 'NVIDIA', 'stock', 188.12, 13, 0.021, 0.0013, 190e6),
  a('AMZN', 'Amazon', 'stock', 214.6, 14, 0.013, 0.0007, 41e6),
  a('GOOGL', 'Alphabet', 'stock', 178.3, 15, 0.012, 0.0005, 28e6),
  a('META', 'Meta Platforms', 'stock', 612.8, 16, 0.016, 0.0008, 14e6),
  a('TSLA', 'Tesla', 'stock', 262.4, 17, 0.026, 0.0002, 95e6),
  a('JPM', 'JPMorgan Chase', 'stock', 247.5, 18, 0.009, 0.0005, 9e6),
  a('V', 'Visa', 'stock', 318.2, 19, 0.008, 0.0004, 7e6),
  a('KO', 'Coca-Cola', 'stock', 71.4, 20, 0.006, 0.0002, 14e6),
  a('SPY', 'SPDR S&P 500 ETF', 'etf', 604.2, 21, 0.007, 0.0004, 62e6),
  a('VOO', 'Vanguard S&P 500', 'etf', 548.9, 22, 0.007, 0.0004, 6e6),
  a('QQQ', 'Invesco QQQ', 'etf', 521.7, 23, 0.009, 0.0006, 38e6),
  a('VTI', 'Vanguard Total Market', 'etf', 288.3, 24, 0.007, 0.0004, 4e6),
  a('BTC', 'Bitcoin', 'crypto', 71204, 31, 0.028, 0.0011, 24e3, 0),
  a('ETH', 'Ethereum', 'crypto', 3812, 32, 0.032, 0.0009, 310e3, 0),
  a('SOL', 'Solana', 'crypto', 168.4, 33, 0.044, 0.0012, 4.1e6),
  a('XRP', 'XRP', 'crypto', 0.62, 34, 0.041, 0.0003, 880e6, 4),
  a('EURUSD', 'Euro / US Dollar', 'fx', 1.0842, 41, 0.0035, 0, 1, 4),
  a('GBPUSD', 'Pound / US Dollar', 'fx', 1.2951, 42, 0.0038, 0.0001, 1, 4),
  a('USDJPY', 'US Dollar / Yen', 'fx', 151.6, 43, 0.0045, 0.0002, 1, 2),
  a('USDTRY', 'US Dollar / Lira', 'fx', 34.92, 44, 0.0025, 0.0014, 1, 2),
  a('XAUUSD', 'Gold', 'commodity', 2688, 51, 0.008, 0.0006, 180e3, 0),
  a('XAGUSD', 'Silver', 'commodity', 31.6, 52, 0.014, 0.0005, 70e3),
  a('BRENT', 'Brent crude', 'commodity', 78.4, 53, 0.016, -0.0002, 260e3),
  a('WTI', 'WTI crude', 'commodity', 74.1, 54, 0.017, -0.0002, 310e3),
]

export const assetBySymbol = (symbol: string) => ASSETS.find((x) => x.symbol.toLowerCase() === symbol.toLowerCase())

const seriesCache = new Map<string, number[]>()

/** Daily closes, oldest first, ending at `asset.price`. */
export function closes(asset: Asset, n = 400): number[] {
  const key = `${asset.symbol}:${n}`
  const hit = seriesCache.get(key)
  if (hit) return hit
  const raw = walk(asset.seed, n, asset.vol, asset.drift)
  const k = asset.price / raw[raw.length - 1]
  const out = raw.map((v) => v * k)
  seriesCache.set(key, out)
  return out
}

export function priceSeries(asset: Asset, n = 365): Point[] {
  const all = closes(asset, Math.max(n, 400))
  const slice = all.slice(-n)
  const end = today()
  return slice.map((y, i) => ({ x: addDays(end, -(slice.length - 1 - i)), y }))
}

export function ohlc(asset: Asset, n = 90): Candle[] {
  const c = closes(asset, Math.max(n + 1, 400))
  const rand = mulberry32(asset.seed * 7)
  const end = today()
  return Array.from({ length: n }, (_, i) => {
    const idx = c.length - n + i
    const o = c[idx - 1]
    const cl = c[idx]
    const spread = Math.abs(cl - o) + cl * asset.vol * 0.6 * rand()
    return {
      x: addDays(end, -(n - 1 - i)),
      o,
      c: cl,
      h: Math.max(o, cl) + spread * rand() * 0.7,
      l: Math.min(o, cl) - spread * rand() * 0.7,
      v: asset.volume * (0.55 + rand() * 0.9),
    }
  })
}

export interface AssetStats {
  change1d: number
  change7d: number
  change30d: number
  changeYtd: number
  high52: number
  low52: number
  spark: number[]
}

export function assetStats(asset: Asset): AssetStats {
  const c = closes(asset, 400)
  const last = c[c.length - 1]
  const at = (back: number) => c[c.length - 1 - back]
  const pct = (back: number) => (last / at(back) - 1) * 100
  const yearStart = Math.min(c.length - 1, Math.max(1, Math.round((today().getTime() - new Date(today().getFullYear(), 0, 1).getTime()) / 86400000)))
  const year = c.slice(-365)
  return {
    change1d: pct(1),
    change7d: pct(7),
    change30d: pct(30),
    changeYtd: pct(yearStart),
    high52: Math.max(...year),
    low52: Math.min(...year),
    spark: c.slice(-30),
  }
}

/* ---- portfolio -------------------------------------------------------------- */

export interface Holding {
  symbol: string
  qty: number
  cost: number
}

export const HOLDINGS: Holding[] = [
  { symbol: 'AAPL', qty: 80, cost: 168 },
  { symbol: 'NVDA', qty: 120, cost: 92 },
  { symbol: 'MSFT', qty: 25, cost: 380 },
  { symbol: 'VOO', qty: 40, cost: 470 },
  { symbol: 'QQQ', qty: 30, cost: 440 },
  { symbol: 'BTC', qty: 0.42, cost: 48000 },
  { symbol: 'ETH', qty: 3.2, cost: 2400 },
  { symbol: 'XAUUSD', qty: 2.5, cost: 2300 },
]

export const CASH = 14208

export interface HoldingRow {
  symbol: string
  name: string
  cls: AssetClass
  qty: number
  price: number
  value: number
  dayPct: number
  returnPct: number
  returnAbs: number
  spark: number[]
}

export function holdingRows(): HoldingRow[] {
  return HOLDINGS.map((h) => {
    const asset = assetBySymbol(h.symbol)!
    const stats = assetStats(asset)
    const value = h.qty * asset.price
    return {
      symbol: asset.symbol,
      name: asset.name,
      cls: asset.cls,
      qty: h.qty,
      price: asset.price,
      value,
      dayPct: stats.change1d,
      returnPct: (asset.price / h.cost - 1) * 100,
      returnAbs: value - h.qty * h.cost,
      spark: stats.spark,
    }
  })
}

export function allocation() {
  const rows = holdingRows()
  const by = new Map<string, number>()
  for (const r of rows) by.set(CLASS_LABELS[r.cls], (by.get(CLASS_LABELS[r.cls]) ?? 0) + r.value)
  by.set('Cash', CASH)
  return [...by.entries()].map(([label, value]) => ({ id: label.toLowerCase(), label, value }))
}

/** Portfolio value per day. Holdings are held constant, so this is a "what if" curve. */
export function portfolioSeries(n = 365): { portfolio: Point[]; benchmark: Point[] } {
  const end = today()
  const spy = closes(assetBySymbol('SPY')!, 400)
  const per = HOLDINGS.map((h) => ({ qty: h.qty, c: closes(assetBySymbol(h.symbol)!, 400) }))
  const portfolio: Point[] = []
  const benchmark: Point[] = []
  let firstValue = 0
  for (let i = 0; i < n; i++) {
    const idx = 400 - n + i
    const value = per.reduce((sum, p) => sum + p.qty * p.c[idx], 0) + CASH
    if (i === 0) firstValue = value
    const x = addDays(end, -(n - 1 - i))
    portfolio.push({ x, y: value })
    benchmark.push({ x, y: (spy[idx] / spy[400 - n]) * firstValue })
  }
  return { portfolio, benchmark }
}

/** Daily profit and loss keyed by date, for the heatmap. */
export function dailyPnl(n = 365): Record<string, number> {
  const { portfolio } = portfolioSeries(n)
  const out: Record<string, number> = {}
  for (let i = 1; i < portfolio.length; i++) out[toKey(portfolio[i].x)] = portfolio[i].y - portfolio[i - 1].y
  return out
}

export interface MonthFlow {
  label: string
  values: { income: number; spend: number }
  month: Date
}

export function cashFlow(months = 12): { label: string; values: Record<string, number> }[] {
  const rand = mulberry32(99)
  const now = today()
  return Array.from({ length: months }, (_, i) => {
    const d = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), -(months - 1 - i))
    return {
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      values: {
        income: Math.round(4200 + rand() * 900 + (i % 3 === 0 ? 1400 : 0)),
        spend: Math.round(2900 + rand() * 1300),
      },
    }
  })
}

/* ---- transactions -------------------------------------------------------------- */

export type TxCategory = 'Groceries' | 'Rent' | 'Dining' | 'Transport' | 'Salary' | 'Dividends' | 'Subscriptions' | 'Utilities' | 'Investing'

export interface Transaction {
  id: string
  date: Date
  title: string
  category: TxCategory
  account: string
  amount: number
  status: 'posted' | 'pending'
}

const TX_TEMPLATES: [string, TxCategory, number, number][] = [
  ['Whole Foods Market', 'Groceries', -64, -142],
  ['Trader Joe’s', 'Groceries', -38, -96],
  ['Blue Bottle Coffee', 'Dining', -5, -14],
  ['Osteria Luna', 'Dining', -48, -122],
  ['City Transit', 'Transport', -2.9, -2.9],
  ['Uber', 'Transport', -11, -34],
  ['Spotify', 'Subscriptions', -11.99, -11.99],
  ['Netflix', 'Subscriptions', -15.49, -15.49],
  ['Electric Co.', 'Utilities', -62, -118],
  ['Dividend · KO', 'Dividends', 14.2, 51.8],
  ['Buy · VOO', 'Investing', -500, -1500],
]

export function transactions(count = 48): Transaction[] {
  const rand = mulberry32(2026)
  const now = today()
  const out: Transaction[] = []
  for (let i = 0; i < count; i++) {
    const [title, category, lo, hi] = TX_TEMPLATES[Math.floor(rand() * TX_TEMPLATES.length)]
    out.push({
      id: `tx-${i}`,
      date: addDays(now, -Math.floor(i * 1.7 + rand() * 2)),
      title,
      category,
      account: rand() > 0.35 ? 'Everyday ·· 4821' : 'Savings ·· 0917',
      amount: Math.round((lo + (hi - lo) * rand()) * 100) / 100,
      status: i < 2 ? 'pending' : 'posted',
    })
  }
  out.push({ id: 'tx-salary', date: addDays(now, -3), title: 'Payroll · Northwind', category: 'Salary', account: 'Everyday ·· 4821', amount: 4250, status: 'posted' })
  return out.sort((x, y) => y.date.getTime() - x.date.getTime())
}

/* ---- calendar events -------------------------------------------------------------- */

export function eventsForMonth(year: number, month: number): CalendarEvent[] {
  const d = (day: number) => new Date(year, month, day)
  const list: [number, string, CalendarEvent['tone']][] = [
    [1, 'Payday · $4,250', 'success'],
    [3, 'Rent due · $1,850', 'warning'],
    [7, 'Spotify renews', 'accent'],
    [8, 'FOMC decision', 'accent'],
    [12, 'Card statement', 'warning'],
    [14, 'KO dividend · $0.51', 'success'],
    [15, 'Payday · $4,250', 'success'],
    [15, 'Tax estimate due', 'error'],
    [18, 'AAPL ex-dividend', 'accent'],
    [21, 'Netflix renews', 'accent'],
    [22, 'NVDA earnings', 'accent'],
    [26, 'CPI release', 'accent'],
    [28, 'MSFT earnings', 'accent'],
  ]
  return list.map(([day, title, tone], i) => ({ id: `${year}-${month}-${i}`, date: d(day), title, tone }))
}

/* ---- misc ----------------------------------------------------------------------------- */

export const NEWS = [
  { id: 'n1', source: 'Finscope Desk', time: '2h', title: 'Chipmakers lead the open as AI demand guidance beats estimates' },
  { id: 'n2', source: 'Markets', time: '4h', title: 'Treasury yields ease ahead of Thursday’s inflation print' },
  { id: 'n3', source: 'Crypto', time: '6h', title: 'Bitcoin consolidates near range highs while ETF inflows slow' },
  { id: 'n4', source: 'Commodities', time: '9h', title: 'Gold holds near record as dollar softens against majors' },
]
