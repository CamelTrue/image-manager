import { useState, useEffect } from 'react'
import { Users, Images, FolderTree, HardDrive, Trash2, Shield, UserPlus } from 'lucide-react'
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
    try {
      await api.post('/admin/users', { username: newUsername, email: newEmail, password: newPassword })
      setShowCreate(false)
      setNewUsername('')
      setNewEmail('')
      setNewPassword('')
      fetchUsers()
      fetchStats()
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to create user')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this user?')) {
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Admin Panel</h2>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: 'Users', value: stats.users },
            { icon: Images, label: 'Images', value: stats.images },
            { icon: FolderTree, label: 'Folders', value: stats.folders },
            { icon: HardDrive, label: 'Storage', value: formatSize(stats.total_size) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <Icon size={20} className="text-blue-400 mb-2" />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-medium text-white">Users</h3>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm"
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>

        <div className="divide-y divide-slate-700">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">{u.username[0].toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{u.username}</p>
                  <p className="text-sm text-slate-400">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRoleToggle(u.id, u.role)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
                    u.role === 'admin'
                      ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  <Shield size={14} />
                  {u.role}
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Create User</h3>
            {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none text-sm"
                required
              />
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none text-sm"
                required
              />
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password"
                type="password"
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 outline-none text-sm"
                required
              />
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
