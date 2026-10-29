import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail, MessageSquare } from 'lucide-react'
import { FAQS } from '@/demo/seed/content'
import { HELP_ARTICLES, HELP_CATEGORIES } from '@/demo/seed/help'
import { usePageTitle } from '@/kit/hooks/usePageTitle'
import { useSite } from '@/kit/context/ConfigContext'
import { useToast } from '@/kit/context/ToastContext'
import { Button } from '@/kit/components/ui/Button'
import { Dot, Tag } from '@/kit/components/ui/Badge'
import { Reveal } from '@/kit/components/ui/Reveal'
import { Section, SectionHead } from '@/kit/components/ui/Section'
import { Accordion } from '@/kit/components/nav/Accordion'
import { Tabs } from '@/kit/components/nav/Tabs'
import { Field, Input, SearchInput, Textarea } from '@/kit/components/forms/Field'
import { Select } from '@/kit/components/forms/Select'
import { Dropzone } from '@/kit/components/forms/Dropzone'

const TOPICS = [
  { value: 'general', label: 'General question' },
  { value: 'billing', label: 'Billing and plans' },
  { value: 'accounts', label: 'Linking an account' },
  { value: 'bug', label: 'Something is broken' },
  { value: 'api', label: 'API and developers' },
]

function SearchBox() {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return HELP_ARTICLES.filter((a) => `${a.title} ${a.summary}`.toLowerCase().includes(q)).slice(0, 5)
  }, [query])

  return (
    <div className="help-search">
      <SearchInput
        ref={inputRef}
        size="lg"
        value={query}
        onValueChange={setQuery}
        shortcut="/"
        placeholder="Search for answers, e.g. “price alerts”"
        aria-label="Search the help center"
      />
      {query.trim() && (
        <div className="help-results card card-flush" role="region" aria-label="Search results" aria-live="polite">
          {results.length ? (
            <ul>
              {results.map((a) => (
                <li key={a.slug}>
                  <Link to={`/help/${a.slug}`}>
                    <span>
                      <strong>{a.title}</strong>
                      <span className="small">{a.summary}</span>
                    </span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small" style={{ padding: '1rem' }}>
              Nothing matched “{query}”. Try a shorter word, or contact us below.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ContactForm() {
  const toast = useToast()
  const [topic, setTopic] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!topic) next.topic = 'Choose a topic.'
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.'
    if (message.trim().length < 10) next.message = 'Tell us a little more (at least 10 characters).'
    setErrors(next)
    if (Object.keys(next).length) return
    setSending(true)
    window.setTimeout(() => {
      setSending(false)
      setTopic(null)
      setEmail('')
      setMessage('')
      setFiles([])
      toast.push({ tone: 'success', title: 'Message sent', description: 'We usually reply within one business day.' })
    }, 700)
  }

  return (
    <form className="card stack" onSubmit={submit} noValidate>
      <div className="form-grid">
        <Field label="Topic" error={errors.topic}>
          <Select value={topic} onChange={setTopic} options={TOPICS} placeholder="Choose a topic" />
        </Field>
        <Field label="Your email" error={errors.email}>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="How can we help?" error={errors.message} className="span-2">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe what happened and what you expected." />
        </Field>
        <Field label="Screenshots" optional className="span-2">
          <Dropzone value={files} onChange={setFiles} maxFiles={4} title="Drop screenshots here, or click to browse" />
        </Field>
      </div>
      <div className="row spread">
        <span className="small">We reply to the address above.</span>
        <Button type="submit" loading={sending} arrow>
          Send message
        </Button>
      </div>
    </form>
  )
}

export default function Help() {
  usePageTitle('Help center')
  const site = useSite()
  const [faqCat, setFaqCat] = useState('all')

  const popular = HELP_ARTICLES.filter((a) => a.popular)
  const faqItems = FAQS.map((f) => ({ id: f.id, title: f.q, content: <p>{f.a}</p> }))

  return (
    <>
      <section className="page-hero help-hero">
        <div className="container">
          <span className="eyebrow">Help center</span>
          <h1>
            How can we <span className="gradient">help?</span>
          </h1>
          <p className="lead">Search the guides, browse by topic, or write to us. Most questions are answered in under a minute.</p>
          <SearchBox />
        </div>
      </section>

      <Section>
        <SectionHead eyebrow="Browse by topic" title="Find your way around" />
        <div className="lattice">
          {HELP_CATEGORIES.map((c, i) => {
            const count = HELP_ARTICLES.filter((a) => a.category === c.id).length
            const first = HELP_ARTICLES.find((a) => a.category === c.id)
            return (
              <Reveal as="div" index={i} key={c.id}>
                <Link to={first ? `/help/${first.slug}` : '/help'} className="help-cat">
                  <span className="mega-icon">
                    <c.icon size={16} aria-hidden="true" />
                  </span>
                  <h3>{c.title}</h3>
                  <p className="small">{c.description}</p>
                  <span className="mono small">
                    {count} {count === 1 ? 'article' : 'articles'}
                  </span>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </Section>

      <Section>
        <div className="split split-top">
          <div>
            <SectionHead eyebrow="Popular" title="Read these first" lead="The guides people open most." />
          </div>
          <Reveal className="board">
            <ul className="mover-rows help-list">
              {popular.map((a) => (
                <li key={a.slug}>
                  <span className="board-icon" style={{ background: 'var(--accent)' }} aria-hidden="true">
                    {a.title[0]}
                  </span>
                  <span className="board-name">
                    <strong>
                      <Link to={`/help/${a.slug}`} style={{ color: 'inherit' }}>
                        {a.title}
                      </Link>
                    </strong>
                    <span>{a.summary}</span>
                  </span>
                  <span className="board-ratings">{a.minutes} min</span>
                  <ArrowRight size={14} aria-hidden="true" className="muted" />
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      <Section id="faq">
        <div className="faq-layout">
          <div>
            <span className="eyebrow">FAQ</span>
            <h2>Quick answers</h2>
            <p className="lead">The questions we hear most often.</p>
          </div>
          <Tabs
            ariaLabel="FAQ topics"
            value={faqCat}
            onChange={setFaqCat}
            items={[
              { id: 'all', label: 'All', count: FAQS.length },
              { id: 'money', label: 'Money' },
              { id: 'product', label: 'Product' },
            ]}
            panels={{
              all: <Accordion name="faq-all" items={faqItems} />,
              money: <Accordion name="faq-money" items={faqItems.filter((f) => ['free', 'cancel', 'security'].includes(f.id))} />,
              product: <Accordion name="faq-product" items={faqItems.filter((f) => ['data', 'accounts', 'api', 'advice'].includes(f.id))} />,
            }}
          />
        </div>
      </Section>

      <Section id="contact">
        <div className="split split-top">
          <div>
            <SectionHead eyebrow="Contact" title="Still stuck? Write to us." lead="A real person reads every message. We reply within one business day." />
            <ul className="stack">
              <li className="row top">
                <Mail size={18} aria-hidden="true" className="muted" />
                <span>
                  <strong>Email</strong>
                  <br />
                  <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
                </span>
              </li>
              <li className="row top">
                <MessageSquare size={18} aria-hidden="true" className="muted" />
                <span>
                  <strong>Live chat</strong>
                  <br />
                  <span className="small">Plus and Pro, weekdays 9:00 to 18:00 UTC.</span>
                </span>
              </li>
              <li className="row top">
                <Dot />
                <span>
                  <strong>All systems operational</strong> <Tag tone="success">99.98% uptime</Tag>
                </span>
              </li>
            </ul>
          </div>
          <Reveal>
            <ContactForm />
          </Reveal>
        </div>
      </Section>
    </>
  )
}
