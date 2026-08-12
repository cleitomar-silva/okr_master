import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className="bg-background text-on-background font-body-md text-body-md antialiased h-screen flex flex-row overflow-hidden">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto px-margin-mobile md:px-margin-desktop py-gutter mx-auto w-full max-w-container-max custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  )
}