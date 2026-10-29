import type { LucideIcon } from 'lucide-react'

/**
 * Navigation data for `<MegaMenu>`. The two type parameters let a project attach its own data without the kit knowing about it:
 * `P` is what a link carries for its hover preview, `F` is what a menu carries for its default side card.
 */
export interface NavLink<P = unknown> {
  id: string
  label: string
  to: string
  description?: string
  icon?: LucideIcon
  /** A small tag next to the label, e.g. "New". */
  badge?: string
  /** Whatever the side panel needs to preview this link. The kit passes it back to `renderSide` untouched. */
  preview?: P
}

export interface MegaColumn<P = unknown> {
  title: string
  items: NavLink<P>[]
}

export interface NavEntry<P = unknown, F = unknown> {
  id: string
  label: string
  /** A plain link when there is no mega panel. */
  to?: string
  mega?: { columns: MegaColumn<P>[]; featured?: F }
}
