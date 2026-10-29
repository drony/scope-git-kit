import { ButtonLink } from '@/kit/components/ui/Button'
import { usePageTitle } from '@/kit/hooks/usePageTitle'

export default function NotFound() {
  usePageTitle('Page not found')
  return (
    <section className="page-hero">
      <div className="container">
        <span className="eyebrow">Error 404</span>
        <h1>
          That page is <span className="gradient">off the chart.</span>
        </h1>
        <p className="lead">The address may be wrong, or the page may have moved. Here are some good places to go next.</p>
        <div className="cta-row">
          <ButtonLink to="/" arrow>
            Go home
          </ButtonLink>
          <ButtonLink to="/markets" variant="ghost">
            Browse markets
          </ButtonLink>
          <ButtonLink to="/help" variant="ghost">
            Help center
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
