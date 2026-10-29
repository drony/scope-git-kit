import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { HELP_ARTICLES, HELP_CATEGORIES, articleBySlug, type Block } from '@/demo/seed/help'
import { useFormat } from '@/kit/lib/format'
import { fromKey } from '@/kit/lib/date'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { Button, ButtonLink } from '@/kit/components/ui/Button'
import { Tag } from '@/kit/components/ui/Badge'
import { Breadcrumbs } from '@/kit/components/nav/Breadcrumbs'
import { CopyButton } from '@/kit/components/ui/Terminal'

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case 'p':
      return <p key={i}>{block.text}</p>
    case 'h2':
      return <h2 key={i}>{block.text}</h2>
    case 'ul':
      return (
        <ul key={i}>
          {block.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={i}>
          {block.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      )
    case 'code':
      return (
        <div className="terminal" key={i}>
          <div className="terminal-row">
            <div className="terminal-cmd">
              <code>{block.text}</code>
            </div>
            <CopyButton text={block.text} />
          </div>
        </div>
      )
  }
}

export default function HelpArticlePage() {
  const { slug = '' } = useParams()
  const fmt = useFormat()
  const article = articleBySlug(slug)
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  usePageTitle(article?.title ?? 'Article not found')

  if (!article) {
    return (
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Help center</span>
          <h1>We could not find that article</h1>
          <p className="lead">It may have moved. Try searching the Help center.</p>
          <div className="cta-row">
            <ButtonLink to="/help" arrow>
              Back to Help
            </ButtonLink>
          </div>
        </div>
      </section>
    )
  }

  const category = HELP_CATEGORIES.find((c) => c.id === article.category)
  const related = HELP_ARTICLES.filter((a) => a.category === article.category && a.slug !== article.slug).slice(0, 3)
  const more = related.length ? related : HELP_ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3)

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: 'Help', to: '/help' }, { label: category?.title ?? 'Articles', to: '/help' }, { label: article.title }]} />
          <h1 style={{ marginTop: '1.25rem' }}>{article.title}</h1>
          <p className="lead">{article.summary}</p>
          <div className="row wrap" style={{ marginTop: '1.25rem' }}>
            <Tag>Updated {fmt.date(fromKey(article.updated), 'short')}</Tag>
            <Tag>{article.minutes} min read</Tag>
          </div>
        </div>
      </section>

      <section className="prose-section">
        <div className="container">
          <div className="article-layout">
            <article className="prose">{article.body.map(renderBlock)}</article>
            <aside className="article-side">
              <div className="card stack-sm">
                <strong>Was this helpful?</strong>
                {vote ? (
                  <p className="small" role="status">
                    Thanks for the feedback.
                  </p>
                ) : (
                  <div className="row">
                    <Button variant="ghost" size="sm" onClick={() => setVote('up')}>
                      <ThumbsUp aria-hidden="true" />
                      Yes
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setVote('down')}>
                      <ThumbsDown aria-hidden="true" />
                      No
                    </Button>
                  </div>
                )}
              </div>
              <div className="card stack-sm">
                <strong>Related</strong>
                <ul className="stack-sm">
                  {more.map((a) => (
                    <li key={a.slug}>
                      <Link to={`/help/${a.slug}`}>{a.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card stack-sm">
                <strong>Need a person?</strong>
                <p className="small">We reply within one business day.</p>
                <ButtonLink to="/help#contact" variant="ghost" size="sm">
                  Contact support
                </ButtonLink>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
