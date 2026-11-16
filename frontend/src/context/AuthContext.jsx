import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authService } from '../services/authService'
import { tokenStore } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser())
  const [loading, setLoading] = useState(true)

  // Hydrate user profile from server on mount if a token exists
  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      if (!tokenStore.get()) {
        setLoading(false)
        return
      }
      try {
        const res = await authService.me()
        if (!cancelled) {
          const u = { id: res.data.id, username: res.data.username, email: res.data.email, role: res.data.role, fullName: res.data.fullName, phone: res.data.phone, createdAt: res.data.createdAt }
          setUser(u)
          tokenStore.setUser(u)
        }
      } catch {
        tokenStore.clear()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    hydrate()
    return () => { cancelled = true }
  }, [])

  // Global 401 handler -> log out
  useEffect(() => {
    const onExpired = () => { setUser(null); tokenStore.clear() }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await authService.login(username, password)
    const { token, id, username: uname, email, role } = res.data
    tokenStore.set(token)
    const u = { id, username: uname, email, role }
    tokenStore.setUser(u)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (data) => {
    await authService.register(data)
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const res = await authService.me()
    const u = { id: res.data.id, username: res.data.username, email: res.data.email, role: res.data.role, fullName: res.data.fullName, phone: res.data.phone, createdAt: res.data.createdAt }
    setUser(u)
    tokenStore.setUser(u)
    return u
  }, [])

  const isAdmin = user?.role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
