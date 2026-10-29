import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Page numbers with ellipses: 1 … 4 5 [6] 7 8 … 20 */
function pageList(page: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const out: (number | 'gap')[] = [1]
  const from = Math.max(2, page - 1)
  const to = Math.min(count - 1, page + 1)
  if (from > 2) out.push('gap')
  for (let p = from; p <= to; p++) out.push(p)
  if (to < count - 1) out.push('gap')
  out.push(count)
  return out
}

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
}) {
  if (pageCount <= 1) return null
  return (
    <nav className="pager" aria-label="Pagination">
      <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft aria-hidden="true" />
      </button>
      {pageList(page, pageCount).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="pager-gap" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        <ChevronRight aria-hidden="true" />
      </button>
    </nav>
  )
}
