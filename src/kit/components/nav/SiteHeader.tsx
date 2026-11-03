import type { ReactNode } from 'react'
import { cn } from '@/kit/lib/cn'

/**
 * The sticky page header: brand on the left, the primary navigation in the middle, actions on the right.
 * It only lays things out; the brand, the navigation and the actions come in as props.
 */
export function SiteHeader({
  brand,
  children,
  actions,
  below,
  navLabel = 'Primary',
  skipTo = '#main',
  skipLabel = 'Skip to content',
  className,
}: {
  brand: ReactNode
  /** The primary navigation, usually a `MegaMenu`. Hidden on narrow screens; give `actions` a menu button for those. */
  children?: ReactNode
  actions?: ReactNode
  /** Rendered inside the header under the bar, for a mobile menu panel. */
  below?: ReactNode
  navLabel?: string
  skipTo?: string
  skipLabel?: string
  className?: string
}) {
  return (
    <header className={cn('site-header', className)}>
      <a className="skip" href={skipTo}>
        {skipLabel}
      </a>
      <div className="container nav">
        {brand}
        {children && (
          <nav className="nav-main" aria-label={navLabel}>
            {children}
          </nav>
        )}
        {actions && <div className="nav-actions">{actions}</div>}
      </div>
      {below}
    </header>
  )
}
