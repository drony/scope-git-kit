import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Removes padding so tables or charts can touch the edges. */
  flush?: boolean
}

export function Card({ flush, className, ...rest }: CardProps) {
  return <div className={cn('card', flush && 'card-flush', className)} {...rest} />
}

export function CardHead({ title, actions }: { title: ReactNode; actions?: ReactNode }) {
  return (
    <div className="card-head">
      <h3 className="card-title">{title}</h3>
      {actions && <div className="row">{actions}</div>}
    </div>
  )
}

export function Kpi({ label, value, sub }: { label: ReactNode; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {sub && <span className="kpi-sub">{sub}</span>}
    </div>
  )
}
