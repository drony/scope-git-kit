import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="crumbs">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <Fragment key={item.label}>
              <li>{item.to && !last ? <Link to={item.to}>{item.label}</Link> : <span aria-current={last ? 'page' : undefined}>{item.label}</span>}</li>
              {!last && <ChevronRight aria-hidden="true" />}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
