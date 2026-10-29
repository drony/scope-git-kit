import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { FloatingPortal } from '@floating-ui/react'
import { CircleAlert, CircleCheck, Info, X, type LucideIcon } from 'lucide-react'

type ToastTone = 'info' | 'success' | 'error'

interface ToastInput {
  title: string
  description?: ReactNode
  tone?: ToastTone
  /** Milliseconds before it disappears. 0 keeps it until dismissed. */
  duration?: number
  /** A new toast with the same key replaces the old one, so repeated actions do not stack up. */
  key?: string
  /** A button inside the toast, e.g. Undo. The toast closes after it is clicked. */
  action?: { label: string; onClick: () => void }
}

interface ToastItem extends ToastInput {
  id: number
}

interface ToastContextValue {
  push: (toast: ToastInput) => number
  dismiss: (id: number) => void
}

const Ctx = createContext<ToastContextValue | null>(null)
const ICONS: Record<ToastTone, LucideIcon> = { info: Info, success: CircleCheck, error: CircleAlert }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setItems((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current++
      setItems((list) => {
        const kept = toast.key
          ? list.filter((t) => {
              if (t.key !== toast.key) return true
              window.clearTimeout(timers.current.get(t.id))
              timers.current.delete(t.id)
              return false
            })
          : list
        return [...kept.slice(-3), { ...toast, id }]
      })
      const duration = toast.duration ?? 4500
      if (duration > 0) timers.current.set(id, window.setTimeout(() => dismiss(id), duration))
      return id
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => map.forEach((t) => window.clearTimeout(t))
  }, [])

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss])

  return (
    <Ctx.Provider value={value}>
      {children}
      <FloatingPortal>
        <div className="toasts" role="region" aria-label="Notifications" aria-live="polite">
          {items.map((t) => {
            const tone = t.tone ?? 'info'
            const Icon = ICONS[tone]
            return (
              <div key={t.id} className={`toast toast-${tone}`}>
                <Icon aria-hidden="true" />
                <div>
                  <strong>{t.title}</strong>
                  {t.description && <p>{t.description}</p>}
                  {t.action && (
                    <button
                      type="button"
                      className="toast-action"
                      onClick={() => {
                        t.action?.onClick()
                        dismiss(t.id)
                      }}
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
                  <X aria-hidden="true" />
                </button>
              </div>
            )
          })}
        </div>
      </FloatingPortal>
    </Ctx.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
