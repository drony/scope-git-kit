import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { storage } from '@/kit/lib/storage'

export interface User {
  name: string
  email: string
}

interface AuthContextValue {
  user: User | null
  login: (user: User) => void
  logout: () => void
}

const KEY = 'finscope.user'
const Ctx = createContext<AuthContextValue | null>(null)

function readUser(): User | null {
  const raw = storage.get(KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<User>
    return parsed.name && parsed.email ? { name: parsed.name, email: parsed.email } : null
  } catch {
    return null
  }
}

/** Demo-only session kept in localStorage. Swap for your real auth provider. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readUser)

  const login = useCallback((next: User) => {
    storage.set(KEY, JSON.stringify(next))
    setUser(next)
  }, [])

  const logout = useCallback(() => {
    storage.remove(KEY)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
