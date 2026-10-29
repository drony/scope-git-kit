import { Check, Minus } from 'lucide-react'
import { FAQS } from '@/lib/content'
import { usePageTitle } from '@/lib/usePageTitle'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import { Accordion } from '@/components/nav/Accordion'
import { PricingSection } from '@/components/marketing/PricingSection'

const ROWS: [string, boolean | string, boolean | string, boolean | string][] = [
  ['Linked accounts', '1', 'Unlimited', 'Unlimited'],
  ['Quote speed', '15 min delay', 'Real time', 'Real time'],
  ['Portfolio dashboard', true, true, true],
  ['Money calendar', true, true, true],
  ['Price alerts', false, true, true],
  ['Cash-flow forecast', false, true, true],
  ['Candlestick charts and indicators', false, false, true],
  ['API access', false, false, true],
  ['Tax reports', false, false, true],
  ['Support', 'Community', 'Email', 'Priority'],
]

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={16} aria-label="Included" style={{ color: 'var(--accent)' }} />
  if (value === false) return <Minus size={16} aria-label="Not included" style={{ color: 'var(--line-strong)' }} />
  return <>{value}</>
}

export default function Pricing() {
  usePageTitle('Pricing')
  return (
    <>
      <Section className="pricing-hero">
        <PricingSection headingLevel={1} />
      </Section>
      <Section>
        <Reveal className="section-head">
          <span className="eyebrow">Compare</span>
          <h2>Every feature, side by side</h2>
        </Reveal>
        <div className="table-wrap" style={{ marginTop: 0 }}>
          <table>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">Starter</th>
                <th scope="col">Plus</th>
                <th scope="col">Pro</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, a, b, c]) => (
                <tr key={label}>
                  <th scope="row" style={{ fontFamily: 'var(--sans)', textTransform: 'none', letterSpacing: 0, fontSize: '0.875rem', color: 'var(--ink)', fontWeight: 450 }}>
                    {label}
                  </th>
                  <td>
                    <Cell value={a} />
                  </td>
                  <td>
                    <Cell value={b} />
                  </td>
                  <td>
                    <Cell value={c} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section>
        <div className="faq-layout">
          <div>
            <span className="eyebrow">FAQ</span>
            <h2>Billing questions</h2>
          </div>
          <Accordion name="pricing-faq" items={FAQS.filter((f) => ['free', 'cancel', 'api', 'advice'].includes(f.id)).map((f) => ({ id: f.id, title: f.q, content: <p>{f.a}</p> }))} />
        </div>
      </Section>
    </>
  )
}
