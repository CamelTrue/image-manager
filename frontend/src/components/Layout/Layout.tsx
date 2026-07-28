import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LogOut, Shield, Image, LayoutGrid, Menu, X, User, Sun, Moon } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored ? stored === 'dark' : true
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light-mode')
    } else {
      document.documentElement.classList.add('light-mode')
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const navItems = [
    { path: '/', icon: LayoutGrid, label: 'Galleria' },
    { path: '/profile', icon: User, label: 'Profilo' },
    ...(user?.role === 'admin' ? [{ path: '/admin', icon: Shield, label: 'Admin' }] : []),
  ]

  const NavButton = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => (
      <button
          onClick={() => { navigate(path); setMobileMenuOpen(false) }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm transition-colors ${
            location.pathname === path
              ? 'bg-accent-500/15 text-accent-400 font-medium'
              : 'text-zinc-400 hover:text-white hover:bg-dark-700'
          }`}
    >
      <Icon size={15} />
      {label}
    </button>
  )

  return (
    <Tooltip.Provider delayDuration={400} skipDelayDuration={200}>
    <div className="h-screen flex flex-col bg-dark-950">
      <header className="flex items-center justify-between px-4 h-13 glass border-b border-dark-600/40 shrink-0 relative z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-md shadow-accent-500/20">
            <Image size={14} className="text-white" />
          </div>
          <h1 className="text-sm font-bold gradient-text cursor-pointer hidden sm:block" onClick={() => navigate('/')}>
            Image Manager
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => <NavButton key={item.path} {...item} />)}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 text-zinc-500 hover:text-yellow-400 rounded-lg transition-colors"
            title={darkMode ? 'Tema chiaro' : 'Tema scuro'}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="hidden md:flex items-center gap-2 mr-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-[10px] font-bold">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-xs text-zinc-400">{user?.username}</span>
          </div>

          <button
            onClick={() => { logout(); navigate('/login') }}
            className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
            title="Esci"
          >
            <LogOut size={16} />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 glass-strong border-b border-dark-600/40 md:hidden z-50 animate-fade-in">
            <div className="p-2 space-y-0.5">
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {user?.username?.[0]?.toUpperCase() || '?'}
                </div>
                {user?.username}
              </div>
              {navItems.map((item) => <NavButton key={item.path} {...item} />)}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-dark-700 transition-colors w-full"
              >
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                {darkMode ? 'Tema chiaro' : 'Tema scuro'}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 overflow-auto">
          <div className="min-h-full flex flex-col">
            <div className="flex-1">
              <Outlet />
            </div>
            <footer className="min-h-[25vh] glass border-t border-dark-600/30 flex items-center justify-center shrink-0">
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                    <Image size={10} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold gradient-text">Image Manager</span>
                </div>
                <p className="text-[10px] text-zinc-600">&copy; {new Date().getFullYear()} — Tutti i diritti riservati</p>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
    </Tooltip.Provider>
  )
}
