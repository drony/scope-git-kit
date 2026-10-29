import { useMemo, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { useSite } from '@/context/ConfigContext'
import { useToast } from '@/context/ToastContext'
import { useFormat } from '@/lib/format'
import { useText } from '@/lib/i18n'
import { useHistory } from '@/lib/useHistory'
import { editKey, loadEdits, sameEdits, saveEdits, type Edits } from '@/lib/finance'
import { HOLDINGS, assetBySymbol, assetStats, type AssetClass } from '@/lib/mock'
import { AssetIcon } from '@/components/ui/AssetIcon'
import { Button } from '@/components/ui/Button'
import { DataGrid } from '@/components/grid/DataGrid'
import { Signed } from '@/components/grid/Signed'
import type { CellChange, DataGridHandle, FilterDef, GridColumn, GroupOption } from '@/components/grid/types'
import { Sparkline } from '@/components/charts/Sparkline'
import { TableHead } from './TableHead'

const STORAGE = 'finscope.table.positions'

interface Position {
  symbol: string
  name: string
  cls: AssetClass
  qty: number
  cost: number
  price: number
  day: number
  spark: number[]
  decimals: number
}

const TEXT = {
  en: {
    workspace: 'Workspace',
    finance: 'Finance',
    title: 'Portfolio positions',
    lead: 'Quantities and average cost are editable. Value, weight and profit update as you type.',
    export: 'Export',
    grid: 'Positions',
    asset: 'Asset',
    qty: 'Quantity',
    cost: 'Avg. cost',
    price: 'Price',
    value: 'Value',
    weight: 'Weight',
    day: 'Day',
    ret: 'Return',
    pnl: 'Profit / loss',
    total: 'Total',
    class: 'Asset class',
    result: 'Result',
    gaining: 'In profit',
    losing: 'At a loss',
    byClass: 'By asset class',
    trend: '30-day trend',
    bought: 'Invested',
    classes: { stock: 'Stocks', etf: 'ETFs', crypto: 'Crypto', fx: 'Forex', commodity: 'Commodities' } as Record<AssetClass, string>,
    saved: 'Saved',
    savedHint: 'Your edits are stored in this browser.',
  },
  tr: {
    workspace: 'Çalışma alanı',
    finance: 'Finans',
    title: 'Portföy pozisyonları',
    lead: 'Adet ve ortalama maliyet düzenlenebilir. Değer, ağırlık ve kâr siz yazdıkça güncellenir.',
    export: 'Dışa aktar',
    grid: 'Pozisyonlar',
    asset: 'Varlık',
    qty: 'Adet',
    cost: 'Ort. maliyet',
    price: 'Fiyat',
    value: 'Değer',
    weight: 'Ağırlık',
    day: 'Gün',
    ret: 'Getiri',
    pnl: 'Kâr / zarar',
    total: 'Toplam',
    class: 'Varlık sınıfı',
    result: 'Sonuç',
    gaining: 'Kârda',
    losing: 'Zararda',
    byClass: 'Varlık sınıfına göre',
    trend: '30 günlük eğilim',
    bought: 'Yatırılan',
    classes: { stock: 'Hisse senetleri', etf: 'ETF’ler', crypto: 'Kripto', fx: 'Döviz', commodity: 'Emtia' } as Record<AssetClass, string>,
    saved: 'Kaydedildi',
    savedHint: 'Düzenlemeleriniz bu tarayıcıda saklanır.',
  },
}

export function PositionsTable() {
  const t = useText(TEXT)
  const fmt = useFormat()
  const { currency } = useSite()
  const toast = useToast()
  const gridApi = useRef<DataGridHandle | null>(null)

  const history = useHistory<Edits>(() => loadEdits(STORAGE))
  const [saved, setSaved] = useState<Edits>(history.value)
  const edits = history.value
  const dirty = !sameEdits(edits, saved)

  const rows = useMemo<Position[]>(
    () =>
      HOLDINGS.map((h) => {
        const asset = assetBySymbol(h.symbol)!
        const stats = assetStats(asset)
        const qty = edits[editKey(h.symbol, 'qty')]
        const cost = edits[editKey(h.symbol, 'cost')]
        return {
          symbol: asset.symbol,
          name: asset.name,
          cls: asset.cls,
          qty: typeof qty === 'number' ? qty : h.qty,
          cost: typeof cost === 'number' ? cost : h.cost,
          price: asset.price,
          day: stats.change1d,
          spark: stats.spark,
          decimals: asset.decimals,
        }
      }),
    [edits],
  )

  const totalValue = rows.reduce((s, r) => s + r.qty * r.price, 0)
  const priceText = (r: Position) => fmt.money(r.price, r.price > 1000 ? 0 : 2)
  const money0 = (n: number) => fmt.money(n, 0)
  const qtyText = (n: number) => fmt.num(n, Number.isInteger(n) ? 0 : 2)
  const pct = (n: number) => <Signed value={n}>{fmt.pct(n, 2)}</Signed>
  const valueOf = (r: Position) => r.qty * r.price
  const pnlOf = (r: Position) => r.qty * (r.price - r.cost)

  const columns = useMemo<GridColumn<Position>[]>(
    () => [
      {
        id: 'asset',
        header: t.asset,
        value: (r) => r.symbol,
        locked: true,
        render: (r) => (
          <span className="row">
            <AssetIcon symbol={r.symbol} />
            <span className="board-name">
              <strong>{r.symbol}</strong>
              <span>{r.name}</span>
            </span>
          </span>
        ),
      },
      { id: 'qty', header: t.qty, value: (r) => r.qty, format: qtyText, editable: true, minWidth: 110 },
      { id: 'cost', header: t.cost, value: (r) => r.cost, format: (n) => fmt.money(n, n > 1000 ? 0 : 2), editable: true, minWidth: 120 },
      { id: 'price', header: t.price, value: (r) => r.price, render: (r) => priceText(r), minWidth: 120 },
      { id: 'value', header: t.value, value: valueOf, format: money0, summary: 'sum', minWidth: 130 },
      {
        id: 'weight',
        header: t.weight,
        value: (r) => (totalValue ? (valueOf(r) / totalValue) * 100 : 0),
        format: (n) => fmt.pct(n, 1, false),
        summary: 'sum',
        minWidth: 100,
      },
      {
        id: 'day',
        header: t.day,
        value: (r) => r.day,
        format: pct,
        summary: (list) => {
          const value = list.reduce((s, r) => s + valueOf(r), 0)
          return pct(value ? list.reduce((s, r) => s + valueOf(r) * r.day, 0) / value : 0)
        },
        minWidth: 100,
      },
      {
        id: 'ret',
        header: t.ret,
        value: (r) => (r.price / r.cost - 1) * 100,
        format: pct,
        summary: (list) => {
          const invested = list.reduce((s, r) => s + r.qty * r.cost, 0)
          return pct(invested ? (list.reduce((s, r) => s + pnlOf(r), 0) / invested) * 100 : 0)
        },
        minWidth: 110,
      },
      {
        id: 'pnl',
        header: t.pnl,
        value: pnlOf,
        format: (n) => <Signed value={n}>{fmt.moneySigned(n, 0)}</Signed>,
        summary: 'sum',
        minWidth: 140,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, fmt, totalValue],
  )

  const groups = useMemo<GroupOption<Position>[]>(
    () => [
      {
        id: 'class',
        label: t.byClass,
        key: (r) => r.cls,
        title: (k) => t.classes[k as AssetClass] ?? k,
        order: ['stock', 'etf', 'crypto', 'commodity', 'fx'],
      },
    ],
    [t],
  )

  const filters = useMemo<FilterDef<Position>[]>(
    () => [
      {
        id: 'class',
        label: t.class,
        options: (['stock', 'etf', 'crypto', 'commodity'] as AssetClass[]).map((c) => ({ value: c, label: t.classes[c] })),
        test: (r, v) => r.cls === v,
      },
      {
        id: 'result',
        label: t.result,
        options: [
          { value: 'gain', label: t.gaining },
          { value: 'loss', label: t.losing },
        ],
        test: (r, v) => (v === 'gain' ? pnlOf(r) > 0 : pnlOf(r) < 0),
      },
    ],
    [t],
  )

  const onEdit = (changes: CellChange[]) =>
    history.set((prev) => {
      const next = { ...prev }
      for (const c of changes) next[editKey(c.rowId, c.colId)] = c.value
      return next
    })

  const onSave = () => {
    saveEdits(STORAGE, edits)
    setSaved(edits)
    toast.push({ tone: 'success', title: t.saved, description: t.savedHint })
  }

  const detail = (r: Position) => (
    <>
      <div className="g-spark">
        <span className="eyebrow">{t.trend}</span>
        <Sparkline data={r.spark} width={260} height={52} />
      </div>
      <dl>
        <div>
          <dt>{t.bought}</dt>
          <dd>{money0(r.qty * r.cost)}</dd>
        </div>
        <div>
          <dt>{t.value}</dt>
          <dd>{money0(valueOf(r))}</dd>
        </div>
        <div>
          <dt>{t.pnl}</dt>
          <dd>
            <Signed value={pnlOf(r)}>{fmt.moneySigned(pnlOf(r), 0)}</Signed>
          </dd>
        </div>
      </dl>
    </>
  )

  return (
    <div className="stack-lg">
      <TableHead
        crumbs={[{ label: t.workspace, to: '/dashboard' }, { label: t.finance }]}
        title={t.title}
        lead={t.lead}
        actions={
          <Button variant="ghost" onClick={() => gridApi.current?.exportCsv()}>
            <Download aria-hidden="true" />
            {t.export}
          </Button>
        }
      />
      <DataGrid<Position>
        title={t.grid}
        unit={currency}
        storageKey="positions"
        columns={columns}
        rows={rows}
        rowId={(r) => r.symbol}
        searchText={(r) => `${r.symbol} ${r.name}`}
        groups={groups}
        defaultGroup="class"
        filters={filters}
        detail={detail}
        totalLabel={t.total}
        onEdit={onEdit}
        history={history}
        save={{ dirty, onSave }}
        apiRef={gridApi}
      />
    </div>
  )
}
