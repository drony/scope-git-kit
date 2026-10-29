import {
  ChartCandlestick,
  CreditCard,
  Landmark,
  Rocket,
  ShieldCheck,
  SquareTerminal,
  type LucideIcon,
} from 'lucide-react'

export interface HelpCategory {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; text: string }

export interface HelpArticle {
  slug: string
  title: string
  category: string
  summary: string
  updated: string
  minutes: number
  popular?: boolean
  body: Block[]
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: 'start', title: 'Getting started', description: 'Open an account, fund it and take the tour.', icon: Rocket },
  { id: 'accounts', title: 'Accounts & linking', description: 'Connect banks, brokerages and crypto wallets.', icon: Landmark },
  { id: 'trading', title: 'Markets & trading', description: 'Orders, alerts, charts and watchlists.', icon: ChartCandlestick },
  { id: 'security', title: 'Security & privacy', description: 'Passkeys, two-step verification and your data.', icon: ShieldCheck },
  { id: 'billing', title: 'Plans & billing', description: 'Upgrades, invoices, refunds and taxes.', icon: CreditCard },
  { id: 'developers', title: 'Developers', description: 'API keys, webhooks and rate limits.', icon: SquareTerminal },
]

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'getting-started',
    title: 'Getting started with Finscope',
    category: 'start',
    summary: 'From sign-up to your first dashboard in about five minutes.',
    updated: '2026-10-02',
    minutes: 4,
    popular: true,
    body: [
      { type: 'p', text: 'Finscope works best once your accounts are connected. Here is the fastest way to get a complete picture.' },
      { type: 'h2', text: 'Create your account' },
      { type: 'ol', items: ['Choose Get started and enter your name, email and a password.', 'Add a profile photo and your date of birth.', 'Pick a plan. You can start on Starter and upgrade at any time.'] },
      { type: 'h2', text: 'Link your first account' },
      { type: 'p', text: 'Open Accounts, choose Link account and search for your bank or broker. Finscope uses a read-only connection, so it can show balances and transactions but can never move money.' },
      { type: 'h2', text: 'Take a look around' },
      { type: 'ul', items: ['The dashboard shows net worth, allocation and daily change.', 'The calendar lists paydays, bills and dividends.', 'Markets lets you search any asset and set a price alert.'] },
    ],
  },
  {
    slug: 'linking-accounts',
    title: 'Linking a bank or brokerage account',
    category: 'accounts',
    summary: 'How read-only connections work and what to do if one stops syncing.',
    updated: '2026-09-18',
    minutes: 3,
    popular: true,
    body: [
      { type: 'p', text: 'Finscope connects through your institution’s own sign-in page. We never see or store your bank password.' },
      { type: 'h2', text: 'If a connection stops syncing' },
      { type: 'ol', items: ['Open Accounts and select the account that shows a warning.', 'Choose Reconnect and sign in to your institution again.', 'Syncing resumes within a few minutes. Past transactions are kept.'] },
      { type: 'p', text: 'Some institutions ask you to renew consent every 90 days. We send a reminder a week before it expires.' },
    ],
  },
  {
    slug: 'price-alerts',
    title: 'Setting price alerts',
    category: 'trading',
    summary: 'Get an email or push notification when an asset crosses a level.',
    updated: '2026-08-30',
    minutes: 2,
    popular: true,
    body: [
      { type: 'p', text: 'Alerts are available on Plus and Pro. You can set them from any asset page or from your watchlist.' },
      { type: 'ol', items: ['Open an asset and choose Alert.', 'Pick a condition: price above, price below, or moves by a percentage.', 'Choose email, push, or both.'] },
      { type: 'p', text: 'Alerts fire once and then switch off, so you are not notified repeatedly.' },
    ],
  },
  {
    slug: 'security-basics',
    title: 'Security basics: passkeys and two-step verification',
    category: 'security',
    summary: 'Turn on the two protections that stop almost every account takeover.',
    updated: '2026-10-11',
    minutes: 3,
    popular: true,
    body: [
      { type: 'p', text: 'A passkey replaces your password with your device’s fingerprint, face or PIN. It cannot be phished or reused.' },
      { type: 'h2', text: 'Turn on two-step verification' },
      { type: 'ol', items: ['Go to Settings and open Security.', 'Choose Add a passkey, or scan the QR code with an authenticator app.', 'Save your recovery codes somewhere safe.'] },
      { type: 'h2', text: 'What we protect' },
      { type: 'ul', items: ['Linked accounts are read-only.', 'Data is encrypted in transit and at rest.', 'You can export or delete your data at any time.'] },
    ],
  },
  {
    slug: 'fees-and-pricing',
    title: 'Plans, fees and invoices',
    category: 'billing',
    summary: 'What each plan includes, how billing works and where to find invoices.',
    updated: '2026-09-02',
    minutes: 3,
    body: [
      { type: 'p', text: 'Finscope has three plans. Billing is monthly or yearly, and yearly saves 20%.' },
      { type: 'ul', items: ['Starter is free, with one linked account.', 'Plus adds real-time quotes, alerts and unlimited accounts.', 'Pro adds the API, candlestick charts and tax reports.'] },
      { type: 'p', text: 'Invoices are in Settings under Billing. If you are not happy in the first 14 days, email support and we will refund the payment.' },
    ],
  },
  {
    slug: 'api-access',
    title: 'API access',
    category: 'developers',
    summary: 'Create a key and read quotes, holdings and transactions over REST.',
    updated: '2026-10-20',
    minutes: 5,
    popular: true,
    body: [
      { type: 'p', text: 'The API is included in Pro. Keys are read-only unless you explicitly grant a scope.' },
      { type: 'h2', text: 'Make your first request' },
      { type: 'code', text: 'curl -H "Authorization: Bearer $FINSCOPE_KEY" \\\n  https://api.finscope.example/v1/holdings' },
      { type: 'h2', text: 'Limits' },
      { type: 'ul', items: ['120 requests per minute per key.', 'Quotes are real time on Pro.', 'Webhooks retry for 24 hours.'] },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy policy',
    category: 'security',
    summary: 'What data we collect, why, and how to control it.',
    updated: '2026-07-01',
    minutes: 6,
    body: [
      { type: 'p', text: 'This is a demonstration page. In a real product this is where your privacy policy lives.' },
      { type: 'h2', text: 'What we collect' },
      { type: 'ul', items: ['Account details you give us.', 'Read-only balances and transactions from accounts you link.', 'Basic usage data to keep the service reliable.'] },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of service',
    category: 'billing',
    summary: 'The agreement between you and Finscope.',
    updated: '2026-07-01',
    minutes: 8,
    body: [
      { type: 'p', text: 'This is a demonstration page. In a real product this is where your terms of service live.' },
      { type: 'p', text: 'Finscope provides information and tools only. Nothing on the service is investment, tax or legal advice.' },
    ],
  },
]

export const articleBySlug = (slug: string) => HELP_ARTICLES.find((a) => a.slug === slug)
