import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api'
import { clearSession, getLoginAt, isSessionExpired, SESSION_DURATION, setSessionStart, YEAR_KEY } from '../session'

const AuthContext = createContext(null)

const PERSISTED = 'okr_selected_company_id'
const CURRENT_YEAR = new Date().getFullYear()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('okr_user'))
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('okr_token')))
  const [company, setCompany] = useState(() => {
    const id = localStorage.getItem(PERSISTED)
    return id ? Number(id) : null
  })
  const [year, setYear] = useState(() => {
    const y = Number(localStorage.getItem(YEAR_KEY))
    return y || CURRENT_YEAR
  })

  const isAdmin = user?.permission === 'admin'

  const selectCompany = useCallback((id) => {
    setCompany(id)
    localStorage.setItem(PERSISTED, String(id))
  }, [])

  const selectYear = useCallback((y) => {
    const value = Number(y)
    if (!value) return
    setYear(value)
    localStorage.setItem(YEAR_KEY, String(value))
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

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/login', { email, password })
    localStorage.setItem('okr_token', data.data.token)
    localStorage.setItem('okr_user', JSON.stringify(data.data.user))
    setSessionStart()
    setUser(data.data.user)
    selectInitialCompany(data.data.user)
    setYear(CURRENT_YEAR)
    localStorage.setItem(YEAR_KEY, String(CURRENT_YEAR))
    return data.data.user
  }, [selectInitialCompany])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } catch {
      /* ignore */
    }
    clearSession()
    setUser(null)
    setCompany(null)
    setYear(CURRENT_YEAR)
  }, [])

  const refreshUser = useCallback(
    async (updated) => {
      if (updated) {
        setUser(updated)
        localStorage.setItem('okr_user', JSON.stringify(updated))
      } else {
        const { data } = await api.get('/me')
        setUser(data.data.user)
        localStorage.setItem('okr_user', JSON.stringify(data.data.user))
      }
    },
    [],
  )

  useEffect(() => {
    if (!localStorage.getItem('okr_token')) return

    if (isSessionExpired()) {
      clearSession()
      setUser(null)
      setCompany(null)
      setYear(CURRENT_YEAR)
      setLoading(false)
      return
    }

    api
      .get('/me')
      .then((res) => {
        const u = res.data.data.user
        setUser(u)
        localStorage.setItem('okr_user', JSON.stringify(u))
        selectInitialCompany(u)
      })
      .finally(() => setLoading(false))

    const remaining = Math.max(0, SESSION_DURATION - (Date.now() - getLoginAt()))
    const timer = setTimeout(() => {
      logout()
    }, remaining)

    return () => clearTimeout(timer)
  }, [selectInitialCompany, logout])

  const value = useMemo(
    () => ({ user, company, year, loading, isAdmin, login, logout, selectCompany, selectYear, refreshUser }),
    [user, company, year, loading, isAdmin, login, logout, selectCompany, selectYear, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}