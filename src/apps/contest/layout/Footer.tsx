import { adapter } from '@/apps/contest/data'
import { Button } from '@/kit/components/ui/Button'
import { useSite } from '@/kit/context/ConfigContext'
import { Logo } from './Logo'

export function Footer() {
  const site = useSite()
  return (
    <footer className="cs-footer">
      <div className="container cs-footer-in">
        <Logo size={32} />
        <p>
          {site.tagline} The contest, the people and the pictures on this site are fictional. Support: {site.supportEmail}
        </p>
        <Button
          variant="plain"
          size="sm"
          onClick={() => {
            adapter.reset()
            window.location.reload()
          }}
        >
          Reset demo data
        </Button>
      </div>
    </footer>
  )
}
