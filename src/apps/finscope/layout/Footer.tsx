import { Link } from 'react-router-dom'
import { FOOTER } from '@/apps/finscope/config/navigation'
import { useSite } from '@/kit/context/ConfigContext'
import { Logo } from '@/apps/finscope/layout/Logo'

export function Footer() {
  const site = useSite()
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo className="footer-brand" size={36} />
            <p>{site.tagline} All your accounts, markets and cash flow in one calm place.</p>
          </div>
          {FOOTER.map((col) => (
            <div key={col.title}>
              <h3>{col.title}</h3>
              {col.links.map((l) => (
                <Link key={l.label} to={l.to}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-line">
          Sample data for demonstration. Nothing here is investment advice. Support: {site.supportEmail}
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
          <span>Currency {site.currency} · Locale {site.locale}</span>
        </div>
      </div>
    </footer>
  )
}
