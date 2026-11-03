import type { ReactNode } from 'react'

/** The band under the header that names the page: a small label, the title and the page's actions. */
export function PageBar({
  eyebrow,
  title,
  actions,
  above,
  children,
}: {
  /** Small uppercase label above the title, such as the section name. */
  eyebrow?: ReactNode
  title: ReactNode
  /** Buttons and pickers on the right. */
  actions?: ReactNode
  /** Content above the title row, such as breadcrumbs. */
  above?: ReactNode
  /** Content under the title, such as a one-line description. */
  children?: ReactNode
}) {
  return (
    <section className="page-bar">
      <div className="container stack">
        {above}
        <div className="row spread wrap top">
          <div>
            {eyebrow && (
              <span className="eyebrow" style={{ marginBottom: '0.5rem' }}>
                {eyebrow}
              </span>
            )}
            <h1 className="page-bar-title">{title}</h1>
            {children}
          </div>
          {actions && <div className="row wrap">{actions}</div>}
        </div>
      </div>
    </section>
  )
}
