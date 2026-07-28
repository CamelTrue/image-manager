import { useState, useEffect } from 'react'
import { Users, Images, FolderTree, HardDrive, Trash2, Shield, UserPlus, X, Loader2 } from 'lucide-react'
import api from '../api/client'
import type { User, Stats } from '../types'

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchUsers = async () => {
    const res = await api.get<User[]>('/admin/users')
    setUsers(res.data)
  }

  const fetchStats = async () => {
    const res = await api.get<Stats>('/admin/stats')
    setStats(res.data)
  }

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      await api.post('/admin/users', { username: newUsername, email: newEmail, password: newPassword })
      setShowCreate(false)
      setNewUsername('')
      setNewEmail('')
      setNewPassword('')
      fetchUsers()
      fetchStats()
    } catch (e: any) {
      setError(e.response?.data?.error || 'Impossibile creare utente')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Eliminare questo utente?')) {
      await api.delete(`/admin/users/${id}`)
      fetchUsers()
      fetchStats()
    }
  }

  const handleRoleToggle = async (id: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    await api.put(`/admin/users/${id}`, { role: newRole })
    fetchUsers()
  }

  const statCards = stats ? [
    { icon: Users, label: 'Utenti', value: stats.users, iconColor: 'text-blue-400' },
    { icon: Images, label: 'Immagini', value: stats.images, iconColor: 'text-accent-400' },
    { icon: FolderTree, label: 'Cartelle', value: stats.folders, iconColor: 'text-amber-400' },
    { icon: HardDrive, label: 'Spazio', value: formatSize(stats.total_size), iconColor: 'text-emerald-400' },
  ] : []

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-bold gradient-text">Pannello Amministrazione</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">Gestisci utenti e statistiche</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
          {statCards.map(({ icon: Icon, label, value, iconColor }) => (
            <div key={label} className="glass rounded-xl p-3.5 border border-dark-600/20">
              <div className="w-7 h-7 rounded-lg bg-dark-800/60 flex items-center justify-center mb-2">
                <Icon size={14} className={iconColor} />
              </div>
              <p className="text-base font-bold text-white">{value}</p>
              <p className="text-[11px] text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass rounded-xl overflow-hidden border border-dark-600/20">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-600/30">
          <h3 className="text-xs font-semibold text-white">Utenti</h3>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors shadow-md shadow-accent-500/15"
          >
            <UserPlus size={12} />
            Nuovo
          </button>
        </div>

        <div className="divide-y divide-dark-600/20">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-dark-700/15 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                  u.role === 'admin'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'bg-dark-700 text-zinc-400 border border-dark-600/50'
                }`}>
                  {u.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-white font-medium">{u.username}</p>
                  <p className="text-[10px] text-zinc-500 hidden sm:block">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRoleToggle(u.id, u.role)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                    u.role === 'admin'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      : 'bg-dark-700 text-zinc-400 border border-dark-600/50'
                  }`}
                >
                  <Shield size={10} />
                  {u.role}
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="glass-strong rounded-xl p-5 w-full max-w-sm animate-scale-in border border-dark-600/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Nuovo Utente</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-dark-600 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
                <X size={15} />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg mb-3 text-[11px] animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-2.5">
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-dark-800/60 text-white px-3 py-2 rounded-lg border border-dark-600/40 focus:border-accent-500/50 outline-none transition-colors text-xs placeholder-zinc-600"
                required
              />
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full bg-dark-800/60 text-white px-3 py-2 rounded-lg border border-dark-600/40 focus:border-accent-500/50 outline-none transition-colors text-xs placeholder-zinc-600"
                required
              />
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password"
                type="password"
                className="w-full bg-dark-800/60 text-white px-3 py-2 rounded-lg border border-dark-600/40 focus:border-accent-500/50 outline-none transition-colors text-xs placeholder-zinc-600"
                required
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs rounded-lg hover:bg-dark-700 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-white rounded-lg text-xs font-medium transition-colors shadow-md shadow-accent-500/15 disabled:opacity-50"
                >
                  {creating && <Loader2 size={12} className="animate-spin" />}
                  Crea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
