import { useLayoutEffect, useRef } from 'react'

interface Options {
  /** Milliseconds each move takes. */
  duration?: number
}

/**
 * Animates a list when its order changes: items slide from where they were to where they are now (the FLIP technique).
 * Put the returned ref on the list's container and `data-flip="<key>"` on each item. Pass the keys in their current order.
 * It does nothing when the person prefers reduced motion.
 */
export function useFlip<E extends HTMLElement>(order: string[], { duration = 320 }: Options = {}) {
  const container = useRef<E>(null)
  const before = useRef(new Map<string, number>())

  useLayoutEffect(() => {
    const box = container.current
    if (!box) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const origin = box.getBoundingClientRect().top
    const next = new Map<string, number>()
    box.querySelectorAll<HTMLElement>('[data-flip]').forEach((node) => {
      const key = node.dataset.flip as string
      // Measured inside the container, so scrolling the page between two renders does not look like a move.
      const top = node.getBoundingClientRect().top - origin
      next.set(key, top)
      const was = before.current.get(key)
      if (!reduce && was !== undefined && Math.abs(was - top) > 1) {
        node.animate([{ transform: `translateY(${was - top}px)` }, { transform: 'none' }], { duration, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' })
      }
    })
    before.current = next
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.join('|'), duration])

  return container
}
