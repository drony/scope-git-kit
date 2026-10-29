/** Marketing copy that several pages share. Edit here to change it everywhere. */

export interface Plan {
  id: string
  name: string
  /** Monthly price when billed monthly. */
  monthly: number
  /** Per-month price when billed yearly. */
  yearly: number
  note: string
  features: string[]
  cta: string
  featured?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 0,
    yearly: 0,
    note: 'For getting a feel for it.',
    features: ['1 linked account', 'Quotes delayed 15 minutes', 'Portfolio dashboard and calendar', 'Community support'],
    cta: 'Start free',
  },
  {
    id: 'plus',
    name: 'Plus',
    monthly: 9,
    yearly: 7,
    note: 'Everything most people need.',
    features: ['Unlimited accounts', 'Real-time quotes', 'Price alerts by email and push', 'Cash-flow forecast', 'CSV export'],
    cta: 'Get Plus',
    featured: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 19,
    yearly: 15,
    note: 'For active investors and builders.',
    features: ['Everything in Plus', 'Candlestick charts and indicators', 'API access', 'Tax reports', 'Priority support'],
    cta: 'Get Pro',
  },
]

export interface Faq {
  id: string
  q: string
  a: string
}

export const FAQS: Faq[] = [
  {
    id: 'data',
    q: 'Where do the prices come from?',
    a: 'Quotes come from licensed exchange feeds. Starter shows them delayed by 15 minutes; Plus and Pro are real time. This demo uses sample data.',
  },
  {
    id: 'accounts',
    q: 'Which accounts can I connect?',
    a: 'Checking, savings, brokerage and crypto accounts from more than 12,000 institutions. You can also add manual assets such as property or a car.',
  },
  {
    id: 'security',
    q: 'Is my money safe?',
    a: 'Finscope has read-only access to linked accounts, and every login supports passkeys and two-step verification. Data is encrypted in transit and at rest.',
  },
  {
    id: 'free',
    q: 'Is there a free plan?',
    a: 'Yes. Starter is free forever, with one linked account and 15-minute delayed quotes. Upgrade whenever you want more.',
  },
  {
    id: 'cancel',
    q: 'Can I cancel anytime?',
    a: 'Anytime, from Settings. You keep access until the end of the period you paid for, and you can export everything first.',
  },
  {
    id: 'api',
    q: 'Do you have an API?',
    a: 'Pro includes a REST API for quotes, balances and transactions, plus webhooks for price alerts. See the API access guide in the Help center.',
  },
  {
    id: 'advice',
    q: 'Is this investment advice?',
    a: 'No. Finscope shows information and tools; it does not recommend what to buy or sell. All figures on this demo site are fictional.',
  },
]
