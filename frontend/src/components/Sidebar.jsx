import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Item({ to, icon, label, end, collapsed }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-full transition-colors ${
          collapsed ? 'justify-center px-0' : ''
        } ${
          isActive
            ? 'bg-gray-200 text-on-surface font-bold'
            : 'text-on-surface-variant hover:bg-surface-container-high'
        }`
      }
    >
      <span className="material-symbols-outlined" data-weight="fill">
        {icon}
      </span>
      {!collapsed && label}
    </NavLink>
  )
}

function Menu({ collapsed, onToggle, onClose }) {
  const { isAdmin, user, company } = useAuth()
  const currentCompany = user?.companies?.find((c) => c.id === company)

  return (
    <div
      className={`flex flex-col h-full bg-surface-container-low flex-shrink-0 border-r border-outline-variant transition-[width] duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[280px]'
      }`}
    >
      <div
        className={`h-16 flex items-center shrink-0 border-b border-outline-variant/50 ${
          collapsed ? 'justify-center px-0' : 'justify-between px-6'
        }`}
      >
        {!collapsed && (
          <h1
            className="font-headline-lg-mobile text-headline-lg-mobile font-bold whitespace-nowrap"
            style={{ color: currentCompany?.color || '#0f639d' }}
          >
            Cafaz OKRs
          </h1>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
          title={collapsed ? 'Expandir menu' : 'Retrair menu'}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        {!collapsed && (
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>
      <nav className={`flex-1 flex flex-col gap-2 p-4 ${collapsed ? 'items-center' : ''}`}>
        <Item to="/" icon="dashboard" label="Visão Geral" end collapsed={collapsed} />
        {isAdmin && (
          <>
            <Item to="/users" icon="group" label="Usuários" collapsed={collapsed} />
            <Item to="/companies" icon="business" label="Empresas" collapsed={collapsed} />
          </>
        )}
      </nav>
    </div>
  )
}

export default function Sidebar({ open, onClose, collapsed, onToggle }) {
  return (
    <>
      <aside className="hidden md:flex h-full z-40">
        <Menu collapsed={collapsed} onToggle={onToggle} />
      </aside>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="relative z-10">
            <Menu collapsed={false} onToggle={onToggle} onClose={onClose} />
          </div>
        </div>
      )}
    </>
  )
}