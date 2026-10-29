import type { ReactNode } from 'react'
import { cn } from '@/kit/lib/cn'

/** Colors a figure by its sign: green for gains, red for losses. */
export function Signed({ value, children }: { value: number; children: ReactNode }) {
  return <span className={cn(value > 0 && 'g-pos', value < 0 && 'g-neg')}>{children}</span>
}
