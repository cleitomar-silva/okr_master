export const SESSION_DURATION = 8 * 60 * 60 * 1000
export const SESSION_KEY = 'okr_login_at'
export const TOKEN_KEY = 'okr_token'
export const USER_KEY = 'okr_user'
export const COMPANY_KEY = 'okr_selected_company_id'

export function getLoginAt() {
  return Number(localStorage.getItem(SESSION_KEY) || 0)
}

export function isSessionExpired() {
  const loginAt = getLoginAt()
  return loginAt <= 0 || Date.now() - loginAt >= SESSION_DURATION
}

export function setSessionStart() {
  localStorage.setItem(SESSION_KEY, String(Date.now()))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(COMPANY_KEY)
  localStorage.removeItem(SESSION_KEY)
}
