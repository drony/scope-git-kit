import type { ReactNode } from 'react'
import { cn } from '@/kit/lib/cn'
import { Reveal } from './Reveal'

export function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn('section', className)}>
      <div className="container">{children}</div>
    </section>
  )
}

interface SectionHeadProps {
  eyebrow?: ReactNode
  title: ReactNode
  lead?: ReactNode
  center?: boolean
  className?: string
  children?: ReactNode
}

export function SectionHead({ eyebrow, title, lead, center, className, children }: SectionHeadProps) {
  return (
    <Reveal className={cn('section-head', center && 'center', className)}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {lead && <p className="lead" style={center ? { marginInline: 'auto' } : undefined}>{lead}</p>}
      {children}
    </Reveal>
  )
}

interface PageHeroProps {
  eyebrow?: ReactNode
  title: ReactNode
  lead?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

export function PageHero({ eyebrow, title, lead, actions, children }: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="container">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {actions && <div className="cta-row">{actions}</div>}
        {children}
      </div>
    </section>
  )
}
