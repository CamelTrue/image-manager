import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LogOut, Shield } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <header className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
        <h1
          className="text-lg font-bold text-white cursor-pointer hover:text-blue-400 transition"
          onClick={() => navigate('/')}
        >
          Image Manager
        </h1>
        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition"
            >
              <Shield size={16} />
              Admin
            </button>
          )}
          <span className="text-sm text-slate-400">{user?.username}</span>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="text-slate-400 hover:text-red-400 transition"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
