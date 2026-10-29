import { useEffect, useRef, useState } from 'react'
import { cn } from '@/kit/lib/cn'

export type CommitDirection = 'down' | 'right' | 'left' | 'none'

interface CellEditorProps {
  initial: string
  /** Select the whole value (opened with Enter or double-click) instead of replacing it (opened by typing). */
  selectAll: boolean
  align: 'left' | 'right'
  invalid: boolean
  ariaLabel: string
  /** Return false to keep editing (the text was rejected). */
  onCommit: (text: string, direction: CommitDirection, fromBlur: boolean) => boolean
  onCancel: () => void
  onTyping: () => void
}

/** The text box shown inside a cell while it is being edited. */
export function CellEditor({ initial, selectAll, align, invalid, ariaLabel, onCommit, onCancel, onTyping }: CellEditorProps) {
  const [text, setText] = useState(initial)
  const ref = useRef<HTMLInputElement>(null)
  // Once the editor has handed its value over, the blur caused by unmounting must not commit again.
  const done = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    if (selectAll) el.select()
    else el.setSelectionRange(el.value.length, el.value.length)
  }, [selectAll])

  const finish = (direction: CommitDirection, fromBlur: boolean) => {
    if (done.current) return
    if (onCommit(text, direction, fromBlur)) done.current = true
  }

  return (
    <input
      ref={ref}
      className={cn('g-input', align === 'right' && 'is-right', invalid && 'is-invalid')}
      value={text}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      inputMode="decimal"
      onChange={(e) => {
        setText(e.target.value)
        onTyping()
      }}
      onBlur={() => finish('none', true)}
      onKeyDown={(e) => {
        // Keys handled here must not reach the grid's own keyboard handler.
        e.stopPropagation()
        if (e.key === 'Enter') {
          e.preventDefault()
          finish('down', false)
        } else if (e.key === 'Tab') {
          e.preventDefault()
          finish(e.shiftKey ? 'left' : 'right', false)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          done.current = true
          onCancel()
        }
      }}
    />
  )
}
