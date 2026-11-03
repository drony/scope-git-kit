/**
 * Pages that use the wide content width (`shellWide` in app.config.json) instead of the regular one.
 * Back-office screens (tables, editors) get room; reading pages (home, play) keep a comfortable line length.
 * A path matches itself and everything below it.
 */
export const WIDE_PAGES = ['/admin', '/components', '/settings']

export type PageWidth = 'default' | 'wide'

export function pageWidth(pathname: string): PageWidth {
  return WIDE_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ? 'wide' : 'default'
}
