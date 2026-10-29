import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useFieldProps } from './Field'

export interface SelectOption<T extends string> {
  value: T
  label: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
  /** Options with the same group are listed under one heading. */
  group?: string
}

interface SelectProps<T extends string> {
  options: SelectOption<T>[]
  value: T | null
  onChange: (value: T) => void
  placeholder?: string
  searchable?: boolean
  disabled?: boolean
  className?: string
  /** Used when the select is not inside a <Field>. */
  ariaLabel?: string
}

export function Select<T extends string>({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchable,
  disabled,
  className,
  ariaLabel,
}: SelectProps<T>) {
  const field = useFieldProps()
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const typed = useRef({ text: '', timer: 0 })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : options
  }, [options, query])

  const selected = options.find((o) => o.value === value)

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-start',
    middleware: [
      offset(6),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ rects, elements }) {
          elements.floating.style.minWidth = `${rects.reference.width}px`
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  })
  const { getReferenceProps, getFloatingProps } = useInteractions([useDismiss(context), useRole(context, { role: 'listbox' })])

  const show = () => {
    const i = filtered.findIndex((o) => o.value === value)
    setActive(i >= 0 ? i : 0)
    setQuery('')
    setOpen(true)
  }

  const choose = (i: number) => {
    const option = filtered[i]
    if (!option || option.disabled) return
    onChange(option.value)
    setOpen(false)
  }

  const move = (delta: number) => {
    if (!filtered.length) return
    let i = active
    for (let n = 0; n < filtered.length; n++) {
      i = (i + delta + filtered.length) % filtered.length
      if (!filtered[i].disabled) break
    }
    setActive(i)
  }

  useEffect(() => {
    if (open) document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open, uid])

  const onListKeys = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        move(1)
        return true
      case 'ArrowUp':
        e.preventDefault()
        move(-1)
        return true
      case 'Home':
        e.preventDefault()
        setActive(0)
        return true
      case 'End':
        e.preventDefault()
        setActive(Math.max(0, filtered.length - 1))
        return true
      case 'Enter':
        e.preventDefault()
        choose(active)
        return true
      default:
        return false
    }
  }

  const onTriggerKeyDown = (e: KeyboardEvent) => {
    if (disabled) return
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        show()
      }
      return
    }
    if (searchable) return
    if (e.key === ' ') {
      e.preventDefault()
      choose(active)
      return
    }
    if (onListKeys(e)) return
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      window.clearTimeout(typed.current.timer)
      typed.current.text += e.key.toLowerCase()
      typed.current.timer = window.setTimeout(() => (typed.current.text = ''), 500)
      const i = filtered.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text))
      if (i >= 0) setActive(i)
    }
  }

  let lastGroup: string | undefined

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        aria-activedescendant={open && !searchable ? `${uid}-opt-${active}` : undefined}
        aria-label={field.id ? undefined : ariaLabel}
        disabled={disabled}
        className={cn('input select-trigger', className)}
        {...field}
        {...getReferenceProps({
          onClick: () => (open ? setOpen(false) : show()),
          onKeyDown: onTriggerKeyDown,
          onKeyUp: (e) => {
            if (e.key === ' ') e.preventDefault()
          },
        })}
      >
        <span className={cn('select-value', !selected && 'is-placeholder')}>
          {selected?.icon}
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} initialFocus={searchable ? 0 : -1} returnFocus>
            <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 70 }} {...getFloatingProps()}>
              <div className="pop">
                {searchable && (
                  <div className="listbox-search">
                    <div className="input-wrap has-left">
                      <Search className="input-icon" aria-hidden="true" />
                      <input
                        className="input"
                        style={{ height: '2rem' }}
                        value={query}
                        placeholder="Search…"
                        aria-label="Search options"
                        role="combobox"
                        aria-expanded
                        aria-controls={`${uid}-list`}
                        aria-activedescendant={`${uid}-opt-${active}`}
                        onChange={(e) => {
                          setQuery(e.target.value)
                          setActive(0)
                        }}
                        onKeyDown={(e) => {
                          onListKeys(e)
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="listbox" id={`${uid}-list`} role="listbox" aria-label={ariaLabel}>
                  {filtered.map((o, i) => {
                    const header = o.group && o.group !== lastGroup ? o.group : null
                    lastGroup = o.group
                    return (
                      <div key={o.value} role="presentation">
                        {header && <div className="option-group">{header}</div>}
                        <div
                          id={`${uid}-opt-${i}`}
                          role="option"
                          className="option"
                          aria-selected={o.value === value}
                          aria-disabled={o.disabled || undefined}
                          data-active={i === active}
                          onMouseMove={() => setActive(i)}
                          onClick={() => choose(i)}
                        >
                          {o.icon}
                          <span>
                            {o.label}
                            {o.description && <small>{o.description}</small>}
                          </span>
                          {o.value === value && <Check className="option-check" aria-hidden="true" />}
                        </div>
                      </div>
                    )
                  })}
                  {!filtered.length && <div className="option-empty">No matches</div>}
                </div>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}
