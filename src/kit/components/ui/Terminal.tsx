import { Check, Copy } from 'lucide-react'
import { useCopy } from '@/kit/hooks/useCopy'
import { cn } from '@/kit/lib/cn'

export interface TerminalRow {
  label?: string
  code: string
  /** Prefixes the line with a green "$". */
  shell?: boolean
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const { copied, copy } = useCopy()
  return (
    <button type="button" className={cn('copy', className)} onClick={() => copy(text)} aria-label="Copy to clipboard">
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

export function Terminal({ head, rows }: { head?: string; rows: TerminalRow[] }) {
  return (
    <div className="terminal">
      {head && <div className="terminal-head">{head}</div>}
      {rows.map((row) => (
        <div className="terminal-row" key={row.code}>
          <div className="terminal-cmd">
            {row.label && <span className="terminal-for">{row.label}</span>}
            <code className={row.shell ? 'is-shell' : undefined}>{row.code}</code>
          </div>
          <CopyButton text={row.code} />
        </div>
      ))}
    </div>
  )
}
