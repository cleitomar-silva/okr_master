import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api'

const AuthContext = createContext(null)

const PERSISTED = 'selected_company_id'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'))
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')))
  const [company, setCompany] = useState(() => {
    const id = localStorage.getItem(PERSISTED)
    return id ? Number(id) : null
  })

  const isAdmin = user?.permission === 'admin'

  const selectCompany = useCallback((id) => {
    setCompany(id)
    localStorage.setItem(PERSISTED, String(id))
  }, [])

  const selectInitialCompany = useCallback((u) => {
    if (!u) return
    const saved = Number(localStorage.getItem(PERSISTED))
    const hasSaved = u.companies?.some((c) => c.id === saved)
    if (hasSaved) {
      setCompany(saved)
      return
    }
    const saude = u.companies?.find((c) => c.name === 'Cafaz Saúde')
    const first = saude || u.companies?.[0]
    if (first) {
      setCompany(first.id)
      localStorage.setItem(PERSISTED, String(first.id))
    }
  }, [])

  useEffect(() => {
    if (localStorage.getItem('token')) {
      api
        .get('/me')
        .then((res) => {
          const u = res.data.data.user
          setUser(u)
          localStorage.setItem('user', JSON.stringify(u))
          selectInitialCompany(u)
        })
        .finally(() => setLoading(false))
    }
  }, [selectInitialCompany])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/login', { email, password })
    localStorage.setItem('token', data.data.token)
    localStorage.setItem('user', JSON.stringify(data.data.user))
    setUser(data.data.user)
    selectInitialCompany(data.data.user)
    return data.data.user
  }, [selectInitialCompany])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } catch {
      /* ignore */
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem(PERSISTED)
    setUser(null)
    setCompany(null)
  }, [])

  const refreshUser = useCallback(
    async (updated) => {
      if (updated) {
        setUser(updated)
        localStorage.setItem('user', JSON.stringify(updated))
      } else {
        const { data } = await api.get('/me')
        setUser(data.data.user)
        localStorage.setItem('user', JSON.stringify(data.data.user))
      }
    },
    [],
  )

  const value = useMemo(
    () => ({ user, company, loading, isAdmin, login, logout, selectCompany, refreshUser }),
    [user, company, loading, isAdmin, login, logout, selectCompany, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}