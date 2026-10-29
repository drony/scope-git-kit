import { useMemo, useState } from 'react'
import { DOCS, GROUPS, docsOf, importStatement, type ComponentDoc, type GroupId } from '@/kit/catalog'
import { Tag } from '@/kit/components/ui/Badge'
import { CopyButton } from '@/kit/components/ui/Terminal'
import { SearchInput } from '@/kit/components/forms/Field'
import { EmptyState } from '@/kit/components/ui/Feedback'
import { Tabs } from '@/kit/components/nav/Tabs'

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

function Entry({ doc }: { doc: ComponentDoc }) {
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

/** The API reference, generated from the same catalog as docs/components/*.md. */
export function ApiReference() {
  const [group, setGroup] = useState<GroupId>('ui')
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const found = useMemo(
    () => (q ? DOCS.filter((d) => `${d.name} ${d.summary} ${(d.exports ?? []).join(' ')}`.toLowerCase().includes(q)) : []),
    [q],
  )
  const list = (docs: ComponentDoc[]) => (
    <div className="api-list">
      {docs.map((d) => (
        <Entry key={d.id} doc={d} />
      ))}
    </div>
  )

  return (
    <section id="reference" className="kit-block">
      <span className="eyebrow">API reference</span>
      <p className="lead">
        Every component, hook and utility, with props, an example and notes. Generated from <code>src/kit/catalog</code>; the same data
        becomes <code>docs/components/*.md</code> with <code>npm run docs</code>.
      </p>
      <div className="stack" style={{ marginTop: '1.25rem' }}>
        <div style={{ maxWidth: '24rem' }}>
          <SearchInput value={query} onValueChange={setQuery} placeholder={`Search ${DOCS.length} entries`} aria-label="Search the API reference" />
        </div>
        {q ? (
          found.length ? (
            list(found)
          ) : (
            <EmptyState title="No match">Try a component name such as “Select” or “useHistory”.</EmptyState>
          )
        ) : (
          <Tabs
            ariaLabel="Component groups"
            value={group}
            onChange={(g) => setGroup(g as GroupId)}
            items={GROUPS.map((g) => ({ id: g.id, label: g.title, count: docsOf(g.id).length }))}
            panels={{ [group]: list(docsOf(group)) }}
          />
        )}
      </div>
    </section>
  )
}
