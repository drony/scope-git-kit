/**
 * URL of a file from /public (images, favicon). It respects the base path the site is deployed under, so the same
 * build works at the root of a domain and at https://user.github.io/repo/. Use it instead of a hard-coded "/images/…".
 */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
