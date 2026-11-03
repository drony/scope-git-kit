import { useId } from 'react'
import { Brand } from '@/kit/components/nav/Brand'
import { useSite } from '@/kit/context/ConfigContext'

/** App-icon style mark: a small trophy. Its cup uses the theme gradient, so it follows the Theme & Settings screen. */
export function BrandMark({ size = 40 }: { size?: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ borderRadius: '22%' }}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a2550" />
          <stop offset="1" stopColor="#120f2a" />
        </linearGradient>
        <linearGradient id={`${id}-cup`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--g5)' }} />
          <stop offset="1" style={{ stopColor: 'var(--g6)' }} />
        </linearGradient>
      </defs>
      <rect width="48" height="48" fill={`url(#${id}-bg)`} />
      <path d="M15 11h18v9a9 9 0 0 1-18 0z" fill={`url(#${id}-cup)`} />
      <path d="M15 14h-4v3a5 5 0 0 0 5 5M33 14h4v3a5 5 0 0 1-5 5" fill="none" stroke={`url(#${id}-cup)`} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="22" y="28" width="4" height="7" fill={`url(#${id}-cup)`} />
      <rect x="16" y="35" width="16" height="3.4" rx="1.7" style={{ fill: 'var(--g3)' }} />
    </svg>
  )
}

export function Logo({ className, size }: { className?: string; size?: number }) {
  const { name } = useSite()
  return <Brand name={name} mark={<BrandMark size={size} />} className={className} />
}
