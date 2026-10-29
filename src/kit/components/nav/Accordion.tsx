import type { ReactNode } from 'react'

export interface AccordionItem {
  id: string
  title: ReactNode
  content: ReactNode
}

/** Native <details> list styled like ascope.app's FAQ. A shared `name` makes it single-open. */
export function Accordion({
  items,
  name,
  defaultOpen,
}: {
  items: AccordionItem[]
  name?: string
  defaultOpen?: string
}) {
  return (
    <div className="faq">
      {items.map((item) => (
        <details key={item.id} name={name} open={defaultOpen === item.id || undefined}>
          <summary>{item.title}</summary>
          <div className="faq-body">{item.content}</div>
        </details>
      ))}
    </div>
  )
}
