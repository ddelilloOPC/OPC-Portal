import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { User } from '../../types'
import { api } from '../../lib/api/client'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: () => void
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const u = await api.get<User>('/api/me')
      setUser(u)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const login = () => { window.location.href = '/auth/login' }
  const logout = () => { window.location.href = '/auth/logout' }

  return <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
