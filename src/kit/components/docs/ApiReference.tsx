import { useMemo, useState, type ReactNode } from 'react'
import { importStatement } from '@/kit/catalog/define'
import type { ComponentDoc, GroupDoc } from '@/kit/catalog/define'
import { SearchInput } from '@/kit/components/forms/Field'
import { Tabs } from '@/kit/components/nav/Tabs'
import { Tag } from '@/kit/components/ui/Badge'
import { EmptyState } from '@/kit/components/ui/Feedback'
import { CopyButton } from '@/kit/components/ui/Terminal'

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="terminal">
      <div className="terminal-row">
        <div className="terminal-cmd">
          <code>{code}</code>
        </div>
        <CopyButton text={code} />
      </div>
    </div>
  )
}

function Entry({ doc }: { doc: ComponentDoc<string> }) {
  const statement = importStatement(doc)
  const isCode = doc.kind === 'hook' || doc.kind === 'utility'
  return (
    <details className="api-entry" id={`api-${doc.id}`}>
      <summary>
        <strong>{doc.name}</strong>
        {doc.kind && doc.kind !== 'component' && <Tag>{doc.kind}</Tag>}
        <span className="api-summary">{doc.summary}</span>
      </summary>
      <div className="api-body">
        {statement && <CodeBlock code={statement} />}
        {doc.props && doc.props.length > 0 && (
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table className="api-table">
              <thead>
                <tr>
                  <th scope="col">{isCode ? 'Parameter' : 'Prop'}</th>
                  <th scope="col">Type</th>
                  <th scope="col">Default</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                {doc.props.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <code>{p.name}</code>
                      {p.required && <span className="api-req"> required</span>}
                    </td>
                    <td>
                      <code>{p.type}</code>
                    </td>
                    <td>{p.default && <code>{p.default}</code>}</td>
                    <td>{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <CodeBlock code={doc.example} />
        {doc.notes && doc.notes.length > 0 && (
          <ul className="api-notes">
            {doc.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
      </div>
    </details>
  )
}

interface ApiReferenceProps {
  /** The catalog entries to show. */
  docs: ComponentDoc<string>[]
  /** The groups, in the order of the tabs. */
  groups: GroupDoc<string>[]
  /** Text under the heading. Say where the catalog lives and how the written docs are made. */
  intro?: ReactNode
  className?: string
}

/** A component catalog as a searchable reference: one tab per group, one expandable entry per component with its props, an example and notes. */
export function ApiReference({ docs, groups, intro, className }: ApiReferenceProps) {
  const [group, setGroup] = useState(groups[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const found = useMemo(() => (q ? docs.filter((d) => `${d.name} ${d.summary} ${(d.exports ?? []).join(' ')}`.toLowerCase().includes(q)) : []), [docs, q])
  const list = (entries: ComponentDoc<string>[]) => (
    <div className="api-list">
      {entries.map((d) => (
        <Entry key={d.id} doc={d} />
      ))}
    </div>
  )

  return (
    <section id="reference" className={className}>
      <span className="eyebrow">API reference</span>
      {intro && <p className="lead">{intro}</p>}
      <div className="stack" style={{ marginTop: '1.25rem' }}>
        <div style={{ maxWidth: '24rem' }}>
          <SearchInput value={query} onValueChange={setQuery} placeholder={`Search ${docs.length} entries`} aria-label="Search the API reference" />
        </div>
        {q ? (
          found.length ? (
            list(found)
          ) : (
            <EmptyState title="No match">Try a component name or a prop.</EmptyState>
          )
        ) : (
          <Tabs
            ariaLabel="Component groups"
            value={group}
            onChange={setGroup}
            items={groups.map((g) => ({ id: g.id, label: g.title, count: docs.filter((d) => d.group === g.id).length }))}
            panels={{ [group]: list(docs.filter((d) => d.group === group)) }}
          />
        )}
      </div>
    </section>
  )
}
