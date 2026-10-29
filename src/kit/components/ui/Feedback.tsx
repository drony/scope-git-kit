import type { CSSProperties, ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/kit/lib/cn'

/* ---- Alert ---------------------------------------------------------- */

type AlertTone = 'info' | 'success' | 'warning' | 'error'
const ALERT_ICON: Record<AlertTone, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
}

export function Alert({
  tone = 'info',
  title,
  children,
  actions,
  className,
}: {
  tone?: AlertTone
  title?: ReactNode
  children?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  const Icon = ALERT_ICON[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('alert', `alert-${tone}`, className)}>
      <Icon aria-hidden="true" />
      <div className="grow">
        {title && <strong>{title}</strong>}
        {children && <p>{children}</p>}
      </div>
      {actions}
    </div>
  )
}

/* ---- Meter / progress ---------------------------------------------------- */

export function Meter({
  value,
  max = 100,
  tone,
  label,
  className,
}: {
  value: number
  max?: number
  tone?: 'success' | 'warning' | 'error'
  label: string
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <span
      className={cn('meter', tone && `meter-${tone}`, className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <i style={{ width: `${pct}%` }} />
    </span>
  )
}

/* ---- Skeleton ---------------------------------------------------------------- */

export function Skeleton({
  width = '100%',
  height = '1em',
  radius,
  className,
}: {
  width?: string | number
  height?: string | number
  radius?: string | number
  className?: string
}) {
  const style: CSSProperties = { width, height, borderRadius: radius }
  return <span className={cn('skel', className)} style={{ display: 'block', ...style }} aria-hidden="true" />
}

/* ---- Empty state ---------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="empty">
      {icon && <span className="empty-icon">{icon}</span>}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div style={{ marginTop: '0.75rem' }}>{action}</div>}
    </div>
  )
}
