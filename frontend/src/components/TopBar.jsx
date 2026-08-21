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
  const { user, company, year, selectCompany, selectYear, logout } = useAuth()
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [companyOpen, setCompanyOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [years, setYears] = useState([])
  const [yearOpen, setYearOpen] = useState(false)
  const [addingYear, setAddingYear] = useState(false)
  const [newYear, setNewYear] = useState('')
  const menuRef = useRef(null)
  const yearRef = useRef(null)

  useEffect(() => {
    api.get('/my-companies').then((res) => setCompanies(res.data.data.companies)).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (yearRef.current && !yearRef.current.contains(e.target)) {
        setYearOpen(false)
        setAddingYear(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadYears = async () => {
    try {
      const { data: res } = await api.get('/years')
      setYears(res.data?.years ?? [])
    } catch {
      /* ignore */
    }
  }

  const toggleYears = () => {
    if (!yearOpen) loadYears()
    setYearOpen((v) => !v)
    setAddingYear(false)
    setNewYear('')
  }

  const addYear = async () => {
    const y = Number(newYear)
    if (!y || y < 2000 || y > 2100) return
    try {
      const { data: res } = await api.post('/years', { year: y })
      setYears(res.data?.years ?? (Array.from(new Set([...years, y])).sort((a, b) => b - a)))
      selectYear(y)
      setNewYear('')
      setAddingYear(false)
      setYearOpen(false)
    } catch {
      /* ignore */
    }
  }

  const current = companies.find((c) => c.id === company) || user?.companies?.find((c) => c.id === company)

  return (
    <>
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

      <div className="flex-1 flex justify-center items-center">
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

        <div className="relative ml-2" ref={yearRef}>
          <button
            onClick={toggleYears}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-on-primary font-title-md text-title-md font-bold hover:bg-black/10 transition-colors"
            title="Selecionar ano"
          >
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            {year}
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </button>
          {yearOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-[180px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-2 z-50">
              <span className="block px-3 py-2 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Ano
              </span>
              {years.length === 0 && (
                <span className="block px-3 py-2 text-sm text-on-surface-variant">Nenhum ano cadastrado.</span>
              )}
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => {
                    selectYear(y)
                    setYearOpen(false)
                  }}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-surface-container-high transition-colors ${
                    y === year ? 'bg-surface-container-high font-semibold text-on-surface' : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">event</span>
                  {y}
                </button>
              ))}
              {addingYear ? (
                <div className="flex items-center gap-1 px-1 pt-2 mt-1 border-t border-outline-variant/60">
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addYear()
                      }
                    }}
                    placeholder="Ex: 2027"
                    autoFocus
                    className="flex-1 min-w-0 rounded-lg border border-outline-variant bg-surface-container-low px-2 py-1.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
                  />
                  <button
                    onClick={addYear}
                    className="p-1.5 rounded-lg bg-[#0f639d] text-on-primary hover:bg-[#0c5182] transition-colors"
                    title="Adicionar ano"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingYear(true)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#0f639d] hover:bg-surface-container-high transition-colors mt-1 border-t border-outline-variant/60"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Adicionar ano
                </button>
              )}
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
                try {
                  await logout()
                } finally {
                  setLoggingOut(false)
                  navigate('/login', { replace: true })
                }
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

    {loggingOut && (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl px-6 py-5">
          <span className="material-symbols-outlined animate-spin text-3xl text-[#0f639d]">progress_activity</span>
          <span className="text-sm font-medium text-on-surface">Saindo...</span>
        </div>
      </div>
    )}
    </>
  )
}