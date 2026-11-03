import { createContext, useContext, type ReactNode } from 'react'
import type { ContestAdapter } from '../data/adapter'

const Ctx = createContext<ContestAdapter | null>(null)

/** Gives the hooks in `contest/hooks` their backend. Contest components themselves never read it: they take props. */
export function ContestProvider({ adapter, children }: { adapter: ContestAdapter; children: ReactNode }) {
  return <Ctx.Provider value={adapter}>{children}</Ctx.Provider>
}

export function useContestAdapter(): ContestAdapter {
  const adapter = useContext(Ctx)
  if (!adapter) throw new Error('useContestAdapter needs a <ContestProvider>.')
  return adapter
}
