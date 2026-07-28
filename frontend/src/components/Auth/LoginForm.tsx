import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Image, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/')
    } catch (e: any) {
      setError(e.response?.data?.error || 'Credenziali non valide')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-dark-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.1),_transparent_50%)]" />
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-[360px] mx-4 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-500/25">
            <Image size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Image Manager</h1>
          <p className="text-xs text-zinc-500 mt-1.5">Gestisci le tue immagini</p>
        </div>

        <div className="glass-strong rounded-2xl p-6 border border-dark-600/30">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg mb-4 text-xs animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-dark-800/60 text-white px-3.5 py-2.5 rounded-lg border border-dark-600/40 focus:border-accent-500/50 outline-none transition-colors text-sm placeholder-zinc-600"
                placeholder="Username"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-800/60 text-white px-3.5 py-2.5 pr-10 rounded-lg border border-dark-600/40 focus:border-accent-500/50 outline-none transition-colors text-sm placeholder-zinc-600"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-white py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-500/20 mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Accesso...
                </>
              ) : (
                <>
                  Accedi
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-zinc-700 mt-5">Image Manager v1.0</p>
      </div>
    </div>
  )
}
