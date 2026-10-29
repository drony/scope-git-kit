import { cn } from '@/lib/cn'

/** Rounded letter tile used next to an asset or merchant name. */
export function AssetIcon({ symbol, className }: { symbol: string; className?: string }) {
  let h = 0
  for (const ch of symbol) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return (
    <span className={cn('board-icon', className)} style={{ background: `var(--chart-${(h % 5) + 1})` }} aria-hidden="true">
      {symbol[0]}
    </span>
  )
}
