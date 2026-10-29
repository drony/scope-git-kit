/**
 * Pages that use the wide content width (`shellWide` in app.config.json) instead of the regular one.
 * Data-heavy screens get room for more columns; reading pages (home, help, sign in) keep a comfortable line length.
 * A path matches itself and everything below it, so '/markets' also covers '/markets/AAPL'.
 */
export const WIDE_PAGES = ['/dashboard', '/markets', '/calendar', '/tables', '/components', '/settings']

export type PageWidth = 'default' | 'wide'

export function pageWidth(pathname: string): PageWidth {
  return WIDE_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ? 'wide' : 'default'
}
