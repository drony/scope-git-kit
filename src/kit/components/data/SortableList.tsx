import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { GripVertical } from 'lucide-react'
import { cn } from '@/kit/lib/cn'

export interface SortableItemState {
  index: number
  /** This item is being dragged with the mouse. */
  dragging: boolean
  /** This item is picked up with the keyboard. */
  grabbed: boolean
  /** The drag handle. Place it where you like inside the row. */
  handle: ReactNode
}

interface SortableListProps<T> {
  items: T[]
  getId: (item: T) => string
  /** Called with the new order on every move (live while dragging). */
  onChange: (items: T[]) => void
  renderItem: (item: T, state: SortableItemState) => ReactNode
  /** Names the list for screen readers. */
  label: string
  className?: string
}

/**
 * A reorderable list. Drag the handle with the mouse, or focus it and press Space, move with ↑ ↓, press Space to drop or
 * Escape to put the item back. Moves are announced to screen readers.
 */
export function SortableList<T>({ items, getId, onChange, renderItem, label, className }: SortableListProps<T>) {
  const [armed, setArmed] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [grabbed, setGrabbed] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const startOrder = useRef<T[]>([])
  const handles = useRef(new Map<string, HTMLButtonElement>())
  const refocus = useRef<string | null>(null)
  const labelId = useId()

  // After a keyboard move the row re-renders in a new place: put focus back on its handle.
  useEffect(() => {
    if (refocus.current) {
      handles.current.get(refocus.current)?.focus()
      refocus.current = null
    }
  })

  const indexOf = (id: string) => items.findIndex((it) => getId(it) === id)

  const move = (from: number, to: number) => {
    if (from < 0 || to < 0 || to >= items.length || from === to) return
    const next = items.slice()
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  const onHandleKey = (e: KeyboardEvent, id: string) => {
    const i = indexOf(id)
    const place = (n: number) => `position ${n + 1} of ${items.length}`
    if (grabbed !== id) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        startOrder.current = items
        setGrabbed(id)
        setMessage(`Picked up, ${place(i)}. Use the up and down arrow keys to move, Space to drop, Escape to cancel.`)
      }
      return
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const to = i + (e.key === 'ArrowUp' ? -1 : 1)
      if (to < 0 || to >= items.length) return
      move(i, to)
      refocus.current = id
      setMessage(`Moved to ${place(to)}.`)
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      setGrabbed(null)
      setMessage(`Dropped at ${place(i)}.`)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onChange(startOrder.current)
      refocus.current = id
      setGrabbed(null)
      setMessage('Move cancelled.')
    }
  }

  return (
    <>
      <ul className={cn('sortable', className)} aria-label={label} aria-labelledby={undefined} id={labelId}>
        {items.map((item, index) => {
          const id = getId(item)
          const handle = (
            <button
              type="button"
              className="sortable-handle"
              aria-label={`Reorder item ${index + 1} of ${items.length}`}
              aria-pressed={grabbed === id}
              ref={(el) => {
                if (el) handles.current.set(id, el)
                else handles.current.delete(id)
              }}
              onPointerDown={() => setArmed(id)}
              onPointerUp={() => setArmed(null)}
              onKeyDown={(e) => onHandleKey(e, id)}
              onBlur={() => grabbed === id && setGrabbed(null)}
            >
              <GripVertical aria-hidden="true" />
            </button>
          )
          return (
            <li
              key={id}
              className={cn('sortable-item', dragId === id && 'is-dragging', grabbed === id && 'is-grabbed')}
              draggable={armed === id}
              onDragStart={(e) => {
                setDragId(id)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', id)
              }}
              onDragEnter={() => dragId && dragId !== id && move(indexOf(dragId), index)}
              onDragOver={(e) => dragId && e.preventDefault()}
              onDragEnd={() => {
                setDragId(null)
                setArmed(null)
              }}
              onDrop={(e) => e.preventDefault()}
            >
              {renderItem(item, { index, dragging: dragId === id, grabbed: grabbed === id, handle })}
            </li>
          )
        })}
      </ul>
      <span className="sr-only" role="status" aria-live="assertive">
        {message}
      </span>
    </>
  )
}
