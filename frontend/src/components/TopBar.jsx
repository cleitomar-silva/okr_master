import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

function Avatar({ name, size = 'w-8 h-8' }) {
  return (
    <span
      className={`${size} rounded-full bg-surface-container-high border-2 border-on-primary overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-on-surface`}
    >
      {name ? name.charAt(0).toUpperCase() : '?'}
    </span>
  )
}

export default function TopBar({ onMenu }) {
  const { user, company, selectCompany, logout } = useAuth()
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [companyOpen, setCompanyOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    api.get('/my-companies').then((res) => setCompanies(res.data.data.companies)).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = companies.find((c) => c.id === company) || user?.companies?.find((c) => c.id === company)

  return (
    <header
      className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16 shrink-0 z-50"
      style={{ backgroundColor: current?.color || '#0f639d' }}
    >
      <button
        onClick={onMenu}
        className="text-on-primary hover:bg-black/10 transition-colors duration-200 p-2 rounded-lg flex items-center justify-center md:hidden"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <div className="flex-1 flex justify-center">
        <div className="relative">
          <button
            onClick={() => setCompanyOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-on-primary font-title-md text-title-md font-bold hover:bg-black/10 transition-colors"
          >
            {current && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: current.color || '#ffffff' }} />}
            {current?.name || 'Selecionar empresa'}
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </button>
          {companyOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-[220px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-2 z-50">
              <span className="block px-3 py-2 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Empresas
              </span>
              {companies.length === 0 && (
                <span className="block px-3 py-2 text-sm text-on-surface-variant">Nenhuma empresa vinculada.</span>
              )}
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    selectCompany(c.id)
                    setCompanyOpen(false)
                  }}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-surface-container-high transition-colors ${
                    c.id === company ? 'bg-surface-container-high font-semibold text-on-surface' : 'text-on-surface-variant'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto relative" ref={menuRef}>
        <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 group">
          <Avatar name={user?.name} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 min-w-[220px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-2 z-50">
            <div className="px-3 py-2 border-b border-outline-variant/60 mb-1">
              <span className="block text-sm font-semibold text-on-surface">{user?.name}</span>
              <span className="block text-xs text-on-surface-variant">{user?.email}</span>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false)
                navigate('/perfil')
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-base">person</span>
              Perfil
            </button>
            <button
              onClick={async () => {
                setMenuOpen(false)
                setLoggingOut(true)
                await logout()
                setLoggingOut(false)
              }}
              disabled={loggingOut}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-error hover:bg-error-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loggingOut ? (
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-base">logout</span>
              )}
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}