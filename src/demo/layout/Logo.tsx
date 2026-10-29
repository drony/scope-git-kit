import { useId } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '@/kit/context/ConfigContext'
import { cn } from '@/kit/lib/cn'

/** App-icon style mark. Its line uses the theme gradient, so it follows the Theme & Settings screen. */
export function BrandMark({ size = 40 }: { size?: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ borderRadius: '22%' }}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#23233a" />
          <stop offset="1" stopColor="#0b0b12" />
        </linearGradient>
        <linearGradient id={`${id}-ln`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--g1)' }} />
          <stop offset=".45" style={{ stopColor: 'var(--g3)' }} />
          <stop offset=".75" style={{ stopColor: 'var(--g4)' }} />
          <stop offset="1" style={{ stopColor: 'var(--g6)' }} />
        </linearGradient>
      </defs>
      <rect width="48" height="48" fill={`url(#${id}-bg)`} />
      <path
        d="M10 33 L19 23 L26 28 L38 14"
        fill="none"
        stroke={`url(#${id}-ln)`}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="14" r="3.2" style={{ fill: 'var(--g6)' }} />
    </svg>
  )
}

export function Logo({ className, size }: { className?: string; size?: number }) {
  const { name } = useSite()
  return (
    <Link to="/" className={cn('brand', className)} aria-label={`${name} home`}>
      <BrandMark size={size} />
      <span>{name}</span>
    </Link>
  )
}
