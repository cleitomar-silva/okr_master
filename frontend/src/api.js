import axios from 'axios'
import { clearSession, isSessionExpired } from './session'

const apiUrl = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${apiUrl}/api/v1`,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('okr_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (token && isSessionExpired()) {
    clearSession()
    if (!location.pathname.startsWith('/login')) {
      location.href = '/login'
    }
    return Promise.reject(new Error('Sessão expirada.'))
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearSession()
      if (!location.pathname.startsWith('/login')) {
        location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api