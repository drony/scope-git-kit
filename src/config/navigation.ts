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
  type LucideIcon,
} from 'lucide-react'

/**
 * Site navigation. Edit this file to change the mega menu, the mobile menu and the footer.
 */

export interface NavLink {
  id: string
  label: string
  to: string
  description?: string
  icon?: LucideIcon
  badge?: string
}

export interface MegaColumn {
  title: string
  items: NavLink[]
}

export interface MegaFeatured {
  kind: 'portfolio' | 'movers' | 'help'
  eyebrow: string
  title: string
  text: string
  cta: NavLink
}

export interface NavEntry {
  id: string
  label: string
  /** A plain link when there is no mega panel. */
  to?: string
  mega?: { columns: MegaColumn[]; featured?: MegaFeatured }
}

export const NAV: NavEntry[] = [
  {
    id: 'products',
    label: 'Products',
    mega: {
      columns: [
        {
          title: 'Invest',
          items: [
            { id: 'stocks', label: 'Stocks & ETFs', to: '/markets', description: 'Trade thousands of listings with no hidden fees.', icon: ChartCandlestick },
            { id: 'crypto', label: 'Crypto', to: '/markets?class=crypto', description: 'Bitcoin, Ethereum and the next 40 by volume.', icon: Bitcoin },
            { id: 'metals', label: 'Gold & commodities', to: '/markets?class=commodity', description: 'Hold metals and energy through one account.', icon: Coins },
          ],
        },
        {
          title: 'Plan',
          items: [
            { id: 'dashboard', label: 'Portfolio dashboard', to: '/dashboard', description: 'Net worth, allocation and daily moves.', icon: ChartPie },
            { id: 'calendar', label: 'Money calendar', to: '/calendar', description: 'Paydays, bills, dividends and earnings.', icon: CalendarDays },
            { id: 'tables', label: 'Finance tables', to: '/tables', description: 'Editable cash flow and positions, with undo.', icon: Table2, badge: 'New' },
            { id: 'goals', label: 'Goals & budgets', to: '/dashboard', description: 'Set targets and track cash flow monthly.', icon: Target },
          ],
        },
        {
          title: 'Move money',
          items: [
            { id: 'transfers', label: 'Transfers', to: '/dashboard', description: 'Between your accounts, free and instant.', icon: Repeat },
            { id: 'cards', label: 'Cards', to: '/pricing', description: 'Spend in 30 currencies at the mid-market rate.', icon: Wallet },
            { id: 'bills', label: 'Bill pay', to: '/calendar', description: 'Schedule it once and never miss a due date.', icon: Receipt },
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
            { id: 'm-stocks', label: 'Stocks', to: '/markets?class=stock', description: 'US and global large caps.', icon: Landmark },
            { id: 'm-crypto', label: 'Crypto', to: '/markets?class=crypto', description: 'Prices that never sleep.', icon: Bitcoin },
            { id: 'm-fx', label: 'Forex', to: '/markets?class=fx', description: 'Major, minor and exotic pairs.', icon: Globe },
            { id: 'm-commodities', label: 'Commodities', to: '/markets?class=commodity', description: 'Metals, oil and more.', icon: Coins },
          ],
        },
        {
          title: 'Tools',
          items: [
            { id: 'screener', label: 'Screener', to: '/markets', description: 'Filter and sort every asset.', icon: LayoutGrid },
            { id: 'econ', label: 'Economic calendar', to: '/calendar', description: 'CPI, FOMC and earnings dates.', icon: CalendarDays },
            { id: 'news', label: 'Market news', to: '/markets', description: 'Headlines that move prices.', icon: Newspaper },
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
            { id: 'individuals', label: 'Individuals', to: '/pricing', description: 'Grow savings and invest with confidence.', icon: PiggyBank },
            { id: 'freelancers', label: 'Freelancers', to: '/pricing', description: 'Invoices, taxes and cash flow in one view.', icon: Banknote },
            { id: 'families', label: 'Families', to: '/pricing', description: 'Shared goals with separate accounts.', icon: Users },
          ],
        },
        {
          title: 'For teams',
          items: [
            { id: 'startups', label: 'Startups', to: '/pricing', description: 'Treasury and runway for early teams.', icon: Rocket },
            { id: 'advisors', label: 'Advisors', to: '/pricing', description: 'Client portfolios with white-label reports.', icon: Handshake },
            { id: 'security', label: 'Security', to: '/help/security-basics', description: 'How we protect accounts and data.', icon: ShieldCheck },
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
            { id: 'help-center', label: 'Help center', to: '/help', description: 'Guides for accounts, trading and billing.', icon: LifeBuoy },
            { id: 'start', label: 'Getting started', to: '/help/getting-started', description: 'Open and fund your first account.', icon: BookOpen },
            { id: 'api', label: 'API access', to: '/help/api-access', description: 'Read quotes and balances programmatically.', icon: SquareTerminal },
          ],
        },
        {
          title: 'Build',
          items: [
            { id: 'components', label: 'UI components', to: '/components', description: 'Every component in this design system.', icon: LayoutGrid },
            { id: 'theme', label: 'Theme & settings', to: '/settings', description: 'Colors, radius and fonts, edited live.', icon: Palette },
            { id: 'charts', label: 'Chart examples', to: '/components#charts', description: 'Area, bar, donut, candles and heatmap.', icon: ChartLine },
          ],
        },
      ],
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
