import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Item({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-full transition-colors ${
          isActive
            ? 'bg-primary-container/20 text-on-primary-fixed-variant font-bold'
            : 'text-on-surface-variant hover:bg-surface-container-high'
        }`
      }
    >
      <span className="material-symbols-outlined" data-weight="fill">
        {icon}
      </span>
      {label}
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  const { isAdmin, user, company } = useAuth()
  const currentCompany = user?.companies?.find((c) => c.id === company)

  const content = (
    <div className="flex flex-col w-[280px] h-full bg-surface-container-low flex-shrink-0 flex-col border-r border-outline-variant">
      <div className="h-16 flex items-center justify-between px-6 shrink-0 border-b border-outline-variant/50">
        <h1
          className="font-headline-lg-mobile text-headline-lg-mobile font-bold"
          style={{ color: currentCompany?.color || '#0f639d' }}
        >
          Cafaz OKRs
        </h1>
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <nav className="flex-1 flex flex-col gap-2 p-4">
        <Item to="/" icon="dashboard" label="Visão Geral" end />
        {isAdmin && (
          <>
            <Item to="/users" icon="group" label="Usuários" />
            <Item to="/companies" icon="business" label="Empresas" />
          </>
        )}
      </nav>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex w-[280px] h-full z-40">{content}</aside>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="relative z-10">{content}</div>
        </div>
      )}
    </>
  )
}