import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return ((parts[0][0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '')).toUpperCase()
}

function hue(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return (h % 5) + 1
}

interface AvatarProps {
  name: string
  src?: string | null
  size?: number
  square?: boolean
  className?: string
}

export function Avatar({ name, src, size = 32, square, className }: AvatarProps) {
  const style = { '--size': `${size}px`, background: src ? undefined : `var(--chart-${hue(name)})` } as CSSProperties
  return (
    <span className={cn('avatar', square && 'avatar-square', className)} style={style} role="img" aria-label={name}>
      {src ? <img src={src} alt="" /> : initials(name)}
    </span>
  )
}

export function AvatarGroup({ names, size = 28 }: { names: string[]; size?: number }) {
  return (
    <span className="avatar-group">
      {names.map((n) => (
        <Avatar key={n} name={n} size={size} />
      ))}
    </span>
  )
}
