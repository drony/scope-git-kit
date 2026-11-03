import { cn } from '@/kit/lib/cn'

export interface AppLink {
  id: string
  title: string
  /** Where the app lives. A full page load: each app is its own page. */
  href: string
}

interface AppSwitcherProps {
  apps: ReadonlyArray<AppLink>
  /** The id of the app that is open. It is shown as the current one and is not a link. */
  current: string
  /** Names the strip, and is the short text before the links. */
  label?: string
  className?: string
}

/**
 * A slim strip for the top of a page that links the apps of one site: "Demos: First app · Second app". Put it above the
 * site header. The open app is marked; the others are plain links, so a visitor can look at every app in two clicks.
 */
export function AppSwitcher({ apps, current, label = 'Demos', className }: AppSwitcherProps) {
  if (apps.length < 2) return null
  return (
    <nav className={cn('app-switcher', className)} aria-label={label}>
      <div className="container app-switcher-in">
        <span className="app-switcher-label">{label}</span>
        <ul>
          {apps.map((a) => (
            <li key={a.id}>
              {a.id === current ? (
                <span aria-current="page">{a.title}</span>
              ) : (
                <a href={a.href}>
                  {a.title} <span aria-hidden="true">→</span>
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
