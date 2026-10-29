import { useSearchParams } from 'react-router-dom'
import { useText } from '@/lib/i18n'
import { usePageTitle } from '@/lib/usePageTitle'
import { Tabs } from '@/components/nav/Tabs'
import { CashFlowTable } from './tables/CashFlowTable'
import { PositionsTable } from './tables/PositionsTable'

const TEXT = {
  en: { pageTitle: 'Finance tables', label: 'Finance tables', cashflow: 'Cash flow', positions: 'Positions' },
  tr: { pageTitle: 'Finans tabloları', label: 'Finans tabloları', cashflow: 'Nakit akışı', positions: 'Pozisyonlar' },
}

type TableId = 'cashflow' | 'positions'

export default function Tables() {
  const t = useText(TEXT)
  usePageTitle(t.pageTitle)
  const [params, setParams] = useSearchParams()
  const table: TableId = params.get('table') === 'positions' ? 'positions' : 'cashflow'

  return (
    <section className="section dash-section">
      <div className="container">
        <Tabs
          ariaLabel={t.label}
          value={table}
          onChange={(id) => setParams(id === 'cashflow' ? {} : { table: id }, { replace: true })}
          items={[
            { id: 'cashflow', label: t.cashflow },
            { id: 'positions', label: t.positions },
          ]}
          panels={{ cashflow: <CashFlowTable />, positions: <PositionsTable /> }}
        />
      </div>
    </section>
  )
}
