import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/kit/lib/cn'

/** The logo link of a header: a mark and the product name. */
export function Brand({
  name,
  mark,
  to = '/',
  collapse,
  className,
}: {
  name: string
  mark: ReactNode
  to?: string
  /** Hide the name below 1280 px wide and keep the mark, so a crowded header still fits. */
  collapse?: boolean
  className?: string
}) {
  return (
    <Link to={to} className={cn('brand', collapse && 'brand-collapse', className)} aria-label={`${name} home`}>
      {mark}
      <span>{name}</span>
    </Link>
  )
}
