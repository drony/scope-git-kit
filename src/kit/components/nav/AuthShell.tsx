import type { ReactNode } from 'react'

/**
 * The shell of a sign-in, sign-up or reset page: the form on the left, a calm side panel on the right.
 * The side panel is hidden on narrow screens. It is decoration: do not put anything in it that a person must read,
 * and do not put private data in it on a page that is shown before sign-in.
 */
export function AuthShell({
  title,
  lead,
  children,
  footer,
  aside,
}: {
  title: ReactNode
  lead?: ReactNode
  children: ReactNode
  /** A line under the form, such as a link to the sign-up page. */
  footer?: ReactNode
  /** The side panel. Rendered inside `aside.auth-aside` with `aria-hidden`. */
  aside?: ReactNode
}) {
  return (
    <section className="auth">
      <div className="container">
        <div className="auth-grid">
          <div className="auth-main">
            <h1>{title}</h1>
            {lead && <p className="lead">{lead}</p>}
            <div className="auth-form">{children}</div>
            {footer && <p className="auth-footer">{footer}</p>}
          </div>
          {aside && (
            <aside className="auth-aside" aria-hidden="true">
              {aside}
            </aside>
          )}
        </div>
      </div>
    </section>
  )
}
