import { createElement, useEffect, useRef, useState, type CSSProperties, type ElementType, type HTMLAttributes } from 'react'
import { cn } from '@/kit/lib/cn'

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  /** Position in a group; each step adds 60ms of delay. */
  index?: number
}

/** Fades content up when it scrolls into view (ascope.app's `data-rise`). */
export function Reveal({ as = 'div', index = 0, className, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.02 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return createElement(
    as,
    {
      ...rest,
      ref,
      'data-rise': '',
      className: cn(className, shown && 'is-in'),
      style: { ...rest.style, '--i': index } as CSSProperties,
    },
    children,
  )
}
