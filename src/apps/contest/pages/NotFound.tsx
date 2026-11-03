import { ButtonLink } from '@/kit/components/ui/Button'
import { PageHero } from '@/kit/components/ui/Section'
import { usePageTitle } from '@/kit/hooks/usePageTitle'

export default function NotFound() {
  usePageTitle('Page not found')
  return <PageHero eyebrow="404" title="That page is not in this contest" lead="The link may be old, or the page has not been built yet." actions={<ButtonLink to="/">Back to the start</ButtonLink>} />
}
