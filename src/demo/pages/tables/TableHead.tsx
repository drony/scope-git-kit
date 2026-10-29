import type { ReactNode } from 'react'
import { Breadcrumbs, type Crumb } from '@/kit/components/nav/Breadcrumbs'

/** Breadcrumbs, title, description and the page-level actions above a table. */
export function TableHead({ crumbs, title, lead, actions }: { crumbs: Crumb[]; title: string; lead: string; actions?: ReactNode }) {
  return (
    <div className="table-head">
      <div>
        <Breadcrumbs items={crumbs} />
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
      </div>
      {actions && <div className="table-head-actions">{actions}</div>}
    </div>
  )
}
