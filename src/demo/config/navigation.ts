import {
  Banknote,
  BookOpen,
  Bitcoin,
  CalendarDays,
  ChartCandlestick,
  ChartLine,
  ChartPie,
  Coins,
  Globe,
  Handshake,
  LayoutGrid,
  LifeBuoy,
  Landmark,
  Newspaper,
  Palette,
  PiggyBank,
  Receipt,
  Repeat,
  Rocket,
  ShieldCheck,
  SquareTerminal,
  Table2,
  Target,
  Users,
  Wallet,
} from 'lucide-react'
import type { MegaColumn as KitColumn, NavEntry as KitEntry, NavLink as KitLink } from '@/kit/components/nav/navTypes'
import type { AssetClass } from '@/demo/seed/market'

/**
 * Site navigation. Edit this file to change the mega menu, the mobile menu and the footer.
 */

/**
 * What the side panel of the mega menu shows while the pointer is on an item:
 * live-looking sample data for the item's page, so people can see what is behind the link.
 */
export type MegaPreview =
  | { kind: 'assets'; cls?: AssetClass }
  | { kind: 'portfolio' }
  | { kind: 'events' }
  | { kind: 'table' }
  | { kind: 'news' }
  | { kind: 'articles'; slugs?: string[] }
  | { kind: 'palette' }
  | { kind: 'facts'; points: string[] }

export type NavLink = KitLink<MegaPreview>
export type MegaColumn = KitColumn<MegaPreview>

export interface MegaFeatured {
  kind: 'portfolio' | 'movers' | 'help'
  eyebrow: string
  title: string
  text: string
  cta: NavLink
}

export type NavEntry = KitEntry<MegaPreview, MegaFeatured>

export const NAV: NavEntry[] = [
  {
    id: 'products',
    label: 'Products',
    mega: {
      columns: [
        {
          title: 'Invest',
          items: [
            { id: 'stocks', label: 'Stocks & ETFs', to: '/markets', description: 'Trade thousands of listings with no hidden fees.', icon: ChartCandlestick, preview: { kind: 'assets', cls: 'stock' } },
            { id: 'crypto', label: 'Crypto', to: '/markets?class=crypto', description: 'Bitcoin, Ethereum and the next 40 by volume.', icon: Bitcoin, preview: { kind: 'assets', cls: 'crypto' } },
            { id: 'metals', label: 'Gold & commodities', to: '/markets?class=commodity', description: 'Hold metals and energy through one account.', icon: Coins, preview: { kind: 'assets', cls: 'commodity' } },
          ],
        },
        {
          title: 'Plan',
          items: [
            { id: 'dashboard', label: 'Portfolio dashboard', to: '/dashboard', description: 'Net worth, allocation and daily moves.', icon: ChartPie, preview: { kind: 'portfolio' } },
            { id: 'calendar', label: 'Money calendar', to: '/calendar', description: 'Paydays, bills, dividends and earnings.', icon: CalendarDays, preview: { kind: 'events' } },
            { id: 'tables', label: 'Finance tables', to: '/tables', description: 'Editable cash flow and positions, with undo.', icon: Table2, badge: 'New', preview: { kind: 'table' } },
            {
              id: 'goals',
              label: 'Goals & budgets',
              to: '/dashboard',
              description: 'Set targets and track cash flow monthly.',
              icon: Target,
              preview: { kind: 'facts', points: ['Set a target amount and a date', 'See progress against your monthly cash flow', 'Get a nudge when a budget runs over'] },
            },
          ],
        },
        {
          title: 'Move money',
          items: [
            {
              id: 'transfers',
              label: 'Transfers',
              to: '/dashboard',
              description: 'Between your accounts, free and instant.',
              icon: Repeat,
              preview: { kind: 'facts', points: ['Free between your own accounts', 'Instant on weekdays, same day on weekends', 'Schedule one-off or repeating transfers'] },
            },
            {
              id: 'cards',
              label: 'Cards',
              to: '/pricing',
              description: 'Spend in 30 currencies at the mid-market rate.',
              icon: Wallet,
              preview: { kind: 'facts', points: ['Mid-market exchange rate in 30 currencies', 'Freeze and unfreeze from the app', 'Included with Plus and Pro'] },
            },
            { id: 'bills', label: 'Bill pay', to: '/calendar', description: 'Schedule it once and never miss a due date.', icon: Receipt, preview: { kind: 'events' } },
          ],
        },
      ],
      featured: {
        kind: 'portfolio',
        eyebrow: 'This month',
        title: 'Your portfolio',
        text: 'See every account on one calm page.',
        cta: { id: 'open-dashboard', label: 'Open dashboard', to: '/dashboard' },
      },
    },
  },
  {
    id: 'markets',
    label: 'Markets',
    mega: {
      columns: [
        {
          title: 'Explore',
          items: [
            { id: 'm-stocks', label: 'Stocks', to: '/markets?class=stock', description: 'US and global large caps.', icon: Landmark, preview: { kind: 'assets', cls: 'stock' } },
            { id: 'm-crypto', label: 'Crypto', to: '/markets?class=crypto', description: 'Prices that never sleep.', icon: Bitcoin, preview: { kind: 'assets', cls: 'crypto' } },
            { id: 'm-fx', label: 'Forex', to: '/markets?class=fx', description: 'Major, minor and exotic pairs.', icon: Globe, preview: { kind: 'assets', cls: 'fx' } },
            { id: 'm-commodities', label: 'Commodities', to: '/markets?class=commodity', description: 'Metals, oil and more.', icon: Coins, preview: { kind: 'assets', cls: 'commodity' } },
          ],
        },
        {
          title: 'Tools',
          items: [
            { id: 'screener', label: 'Screener', to: '/markets', description: 'Filter and sort every asset.', icon: LayoutGrid, preview: { kind: 'assets' } },
            { id: 'econ', label: 'Economic calendar', to: '/calendar', description: 'CPI, FOMC and earnings dates.', icon: CalendarDays, preview: { kind: 'events' } },
            { id: 'news', label: 'Market news', to: '/markets', description: 'Headlines that move prices.', icon: Newspaper, preview: { kind: 'news' } },
          ],
        },
      ],
      featured: {
        kind: 'movers',
        eyebrow: 'Top movers today',
        title: 'What is moving',
        text: 'Updated every morning with the biggest swings.',
        cta: { id: 'all-markets', label: 'All markets', to: '/markets' },
      },
    },
  },
  {
    id: 'solutions',
    label: 'Solutions',
    mega: {
      columns: [
        {
          title: 'For you',
          items: [
            {
              id: 'individuals',
              label: 'Individuals',
              to: '/pricing',
              description: 'Grow savings and invest with confidence.',
              icon: PiggyBank,
              preview: { kind: 'facts', points: ['Free plan with one linked account', 'Goals, budgets and a monthly summary', 'Upgrade only when you want real-time quotes'] },
            },
            {
              id: 'freelancers',
              label: 'Freelancers',
              to: '/pricing',
              description: 'Invoices, taxes and cash flow in one view.',
              icon: Banknote,
              preview: { kind: 'facts', points: ['Set aside tax as money comes in', 'Cash flow forecast for lean months', 'CSV and tax reports on Pro'] },
            },
            {
              id: 'families',
              label: 'Families',
              to: '/pricing',
              description: 'Shared goals with separate accounts.',
              icon: Users,
              preview: { kind: 'facts', points: ['Shared goals, private accounts', 'One dashboard for the household', 'Allowances and scheduled transfers'] },
            },
          ],
        },
        {
          title: 'For teams',
          items: [
            {
              id: 'startups',
              label: 'Startups',
              to: '/pricing',
              description: 'Treasury and runway for early teams.',
              icon: Rocket,
              preview: { kind: 'table' },
            },
            {
              id: 'advisors',
              label: 'Advisors',
              to: '/pricing',
              description: 'Client portfolios with white-label reports.',
              icon: Handshake,
              preview: { kind: 'portfolio' },
            },
            { id: 'security', label: 'Security', to: '/help/security-basics', description: 'How we protect accounts and data.', icon: ShieldCheck, preview: { kind: 'articles', slugs: ['security-basics', 'privacy'] } },
          ],
        },
      ],
      featured: {
        kind: 'help',
        eyebrow: 'Talk to us',
        title: 'Not sure where to start?',
        text: 'Our team replies within one business day.',
        cta: { id: 'contact', label: 'Contact support', to: '/help#contact' },
      },
    },
  },
  {
    id: 'resources',
    label: 'Resources',
    mega: {
      columns: [
        {
          title: 'Learn',
          items: [
            { id: 'help-center', label: 'Help center', to: '/help', description: 'Guides for accounts, trading and billing.', icon: LifeBuoy, preview: { kind: 'articles' } },
            { id: 'start', label: 'Getting started', to: '/help/getting-started', description: 'Open and fund your first account.', icon: BookOpen, preview: { kind: 'articles', slugs: ['getting-started', 'linking-accounts'] } },
            { id: 'api', label: 'API access', to: '/help/api-access', description: 'Read quotes and balances programmatically.', icon: SquareTerminal, preview: { kind: 'articles', slugs: ['api-access'] } },
          ],
        },
        {
          title: 'Build',
          items: [
            {
              id: 'components',
              label: 'UI components',
              to: '/components',
              description: 'Every component in this design system.',
              icon: LayoutGrid,
              preview: { kind: 'facts', points: ['Buttons, forms, calendars and overlays', 'Charts built as plain SVG', 'A data grid with editing, undo and autosave'] },
            },
            { id: 'theme', label: 'Theme & settings', to: '/settings', description: 'Colors, radius and fonts, edited live.', icon: Palette, preview: { kind: 'palette' } },
            { id: 'charts', label: 'Chart examples', to: '/components#charts', description: 'Area, bar, donut, candles and heatmap.', icon: ChartLine, preview: { kind: 'portfolio' } },
          ],
        },
      ],
      featured: {
        kind: 'help',
        eyebrow: 'Need a hand?',
        title: 'Help center',
        text: 'Guides for accounts, finance tables and the API.',
        cta: { id: 'open-help', label: 'Open help center', to: '/help' },
      },
    },
  },
  { id: 'pricing', label: 'Pricing', to: '/pricing' },
  { id: 'help', label: 'Help', to: '/help' },
]

export interface FooterColumn {
  title: string
  links: { label: string; to: string }[]
}

export const FOOTER: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Markets', to: '/markets' },
      { label: 'Calendar', to: '/calendar' },
      { label: 'Finance tables', to: '/tables' },
      { label: 'Pricing', to: '/pricing' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help center', to: '/help' },
      { label: 'Getting started', to: '/help/getting-started' },
      { label: 'Contact', to: '/help#contact' },
      { label: 'Sign in', to: '/login' },
    ],
  },
  {
    title: 'Build',
    links: [
      { label: 'UI components', to: '/components' },
      { label: 'Theme & settings', to: '/settings' },
      { label: 'API access', to: '/help/api-access' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '/help/privacy' },
      { label: 'Terms', to: '/help/terms' },
      { label: 'Security', to: '/help/security-basics' },
    ],
  },
]
