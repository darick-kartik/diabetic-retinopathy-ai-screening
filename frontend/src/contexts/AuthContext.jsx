import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { STORAGE_KEYS } from '@/config/app'
import { service } from '@/services'
import { DEMO_USER } from '@/services/demo/service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (sessionStorage.getItem(STORAGE_KEYS.demoSession) === 'true') {
      setUser(DEMO_USER)
      setLoading(false)
      return undefined
    }
    if (!sessionStorage.getItem(STORAGE_KEYS.apiToken)) {
      setLoading(false)
      return undefined
    }

    service.restoreSession()
      .then((restoredUser) => { if (active) setUser(restoredUser) })
      .catch(() => {
        sessionStorage.removeItem(STORAGE_KEYS.apiToken)
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [])

  useEffect(() => {
    const expire = () => {
      setUser(null)
      sessionStorage.removeItem(STORAGE_KEYS.apiToken)
      queryClient.clear()
    }
    window.addEventListener('retinacare:session-expired', expire)
    return () => window.removeEventListener('retinacare:session-expired', expire)
  }, [queryClient])

  const startSession = useCallback(async (result) => {
    if (result.isDemo) {
      sessionStorage.setItem(STORAGE_KEYS.demoSession, 'true')
      sessionStorage.removeItem(STORAGE_KEYS.apiToken)
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.demoSession)
    }
    setUser(result.user)
    return result.user
  }, [])

  const login = useCallback(async (credentials) => startSession(await service.login(credentials)), [startSession])
  const register = useCallback((values) => service.register(values), [])
  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem(STORAGE_KEYS.apiToken)
    sessionStorage.removeItem(STORAGE_KEYS.demoSession)
    queryClient.clear()
  }, [queryClient])

  const value = useMemo(() => ({ user, loading, login, register, logout, isAuthenticated: Boolean(user) }), [user, loading, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
