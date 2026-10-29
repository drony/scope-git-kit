import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/kit/lib/cn'

export interface TabItem {
  id: string
  label: ReactNode
  count?: number
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  /** Content for each tab; only the active one is rendered. */
  panels?: Record<string, ReactNode>
  ariaLabel: string
  className?: string
}

export function Tabs({ items, value, onChange, panels, ariaLabel, className }: TabsProps) {
  const uid = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    let next = index
    if (e.key === 'ArrowRight') next = (index + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return
    e.preventDefault()
    onChange(items[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div className={className}>
      <div className="tabs" role="tablist" aria-label={ariaLabel}>
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            id={`${uid}-tab-${item.id}`}
            type="button"
            role="tab"
            className="tab"
            aria-selected={value === item.id}
            aria-controls={`${uid}-panel-${item.id}`}
            tabIndex={value === item.id ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {item.label}
            {item.count !== undefined && <span className="tab-count">{item.count}</span>}
          </button>
        ))}
      </div>
      {panels && (
        <div
          className={cn('tab-panel')}
          role="tabpanel"
          id={`${uid}-panel-${value}`}
          aria-labelledby={`${uid}-tab-${value}`}
          tabIndex={0}
        >
          {panels[value]}
        </div>
      )}
    </div>
  )
}
