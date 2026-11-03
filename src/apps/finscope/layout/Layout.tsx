import { useEffect, useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { pageWidth } from '@/apps/finscope/config/pages'
import { AppSwitcher } from '@/kit/components/nav/AppSwitcher'
import { ThemeDock } from '@/kit/components/theme/ThemeDock'
import { Footer } from './Footer'
import { Header } from './Header'

export function Layout() {
  const { pathname, hash } = useLocation()

  // One place decides the content width for every page; CSS reads it from <html data-width>.
  useLayoutEffect(() => {
    document.documentElement.dataset.width = pageWidth(pathname)
  }, [pathname])

  // New page: scroll to the top, or to the #anchor when there is one.
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
    const id = decodeURIComponent(hash.slice(1))
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return (
    <>
      <AppSwitcher apps={import.meta.env.APP_LINKS} current="finscope" label="Two demos, one kit" />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <ThemeDock settingsPath="/settings" />
    </>
  )
}
