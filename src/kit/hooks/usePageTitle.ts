import { useEffect } from 'react'
import { useSite } from '@/kit/context/ConfigContext'

/** Sets the document title to "Page · Site name" (or "Site name: tagline" with no title). */
export function usePageTitle(title?: string) {
  const { name, tagline } = useSite()
  useEffect(() => {
    document.title = title ? `${title} · ${name}` : `${name}: ${tagline}`
  }, [title, name, tagline])
}
