import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { PLANS } from '@/lib/content'
import { useFormat } from '@/lib/format'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Segmented } from '@/components/nav/Segmented'

export function PricingSection({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
  const fmt = useFormat()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const Heading = headingLevel === 1 ? 'h1' : 'h2'

  return (
    <div className="container">
      <Reveal className="section-head center">
        <span className="eyebrow">Pricing</span>
        <Heading>
          Start free.
          <br />
          Pay when it earns its keep.
        </Heading>
        <p className="lead" style={{ marginInline: 'auto' }}>
          One simple price per plan. Every plan includes the dashboard, calendar and charts.
        </p>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <Segmented
            ariaLabel="Billing period"
            value={billing}
            onChange={setBilling}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly · save 20%' },
            ]}
          />
        </div>
      </Reveal>

      <div className="plans plans-3">
        {PLANS.map((plan, i) => {
          const price = billing === 'yearly' ? plan.yearly : plan.monthly
          return (
            <Reveal as="article" index={i} className={cn('plan', plan.featured && 'is-featured')} key={plan.id}>
              <h3>
                {plan.name}
                {plan.featured && <span className="save">POPULAR</span>}
                {plan.yearly > 0 && billing === 'yearly' && <span className="save">SAVE 20%</span>}
              </h3>
              <div className="price">
                <span className="amount">{fmt.money(price, 0)}</span>
                <span className="per">/ month</span>
              </div>
              <p className="plan-note">
                {plan.monthly === 0 ? 'Free forever.' : billing === 'yearly' ? `Billed ${fmt.money(plan.yearly * 12, 0)} once a year.` : 'Cancel anytime.'} {plan.note}
              </p>
              <ul className="checks">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <ButtonLink to="/register" variant={plan.featured ? 'primary' : 'ghost'} arrow>
                {plan.cta}
              </ButtonLink>
              <p className="plan-guarantee">{plan.monthly === 0 ? 'No card required' : '14-day money-back guarantee'}</p>
            </Reveal>
          )
        })}
      </div>

      <Reveal className="guarantee" >
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>Not the right fit? Get every cent back.</strong>
          <p>Email us within 14 days of your first payment and we will refund it, no questions asked.</p>
        </div>
      </Reveal>
    </div>
  )
}
