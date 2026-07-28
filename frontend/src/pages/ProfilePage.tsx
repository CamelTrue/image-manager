import { useState, useEffect } from 'react'
import { Images, FolderTree, HardDrive, Mail, Lock, Save, Loader2 } from 'lucide-react'
import * as profileApi from '../api/profile'
import { useAuthStore } from '../store/authStore'
import type { Profile } from '../types'

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    profileApi.getProfile().then((res) => {
      setProfile(res.data)
      setEmail(res.data.email)
    })
  }, [])

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailMsg('')
    setSavingEmail(true)
    try {
      await profileApi.updateEmail(email)
      setEmailMsg('Email aggiornata')
    } catch (e: any) {
      setEmailMsg(e.response?.data?.error || 'Errore')
    } finally {
      setSavingEmail(false)
    }
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg('')
    setSavingPw(true)
    try {
      await profileApi.changePassword(currentPassword, newPassword)
      setPwMsg('Password aggiornata')
      setCurrentPassword('')
      setNewPassword('')
    } catch (e: any) {
      setPwMsg(e.response?.data?.error || 'Errore')
    } finally {
      setSavingPw(false)
    }
  }

  const statCards = profile ? [
    { icon: Images, label: 'Immagini', value: profile.image_count, iconColor: 'text-accent-400' },
    { icon: FolderTree, label: 'Cartelle', value: profile.folder_count, iconColor: 'text-amber-400' },
    { icon: HardDrive, label: 'Spazio', value: formatSize(profile.total_size), iconColor: 'text-emerald-400' },
  ] : []

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-bold gradient-text">Profilo</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">Gestisci il tuo account</p>
      </div>

      <div className="glass rounded-xl p-5 border border-dark-600/20 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-lg font-bold">
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{user?.username}</h3>
            <p className="text-[11px] text-zinc-500">{user?.role === 'admin' ? 'Amministratore' : 'Utente'}</p>
          </div>
        </div>

        {profile && (
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {statCards.map(({ icon: Icon, label, value, iconColor }) => (
              <div key={label} className="bg-dark-800/40 rounded-lg p-3 border border-dark-600/20">
                <Icon size={14} className={iconColor} />
                <p className="text-sm font-bold text-white mt-1">{value}</p>
                <p className="text-[10px] text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-xl p-5 border border-dark-600/20 mb-5">
        <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
          <Mail size={13} className="text-zinc-500" />
          Email
        </h3>
        <form onSubmit={handleEmail} className="flex items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-dark-800/60 text-white px-3 py-2 rounded-lg border border-dark-600/30 focus:border-accent-500/50 outline-none text-xs"
            required
          />
          <button
            type="submit"
            disabled={savingEmail}
            className="flex items-center gap-1.5 bg-accent-500 hover:bg-accent-400 text-white px-3 py-2 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
          >
            {savingEmail ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Salva
          </button>
        </form>
        {emailMsg && (
          <p className={`text-[11px] mt-2 ${emailMsg.includes('Errore') ? 'text-red-400' : 'text-green-400'}`}>{emailMsg}</p>
        )}
      </div>

      <div className="glass rounded-xl p-5 border border-dark-600/20">
        <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
          <Lock size={13} className="text-zinc-500" />
          Password
        </h3>
        <form onSubmit={handlePassword} className="space-y-2">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Password attuale"
            className="w-full bg-dark-800/60 text-white px-3 py-2 rounded-lg border border-dark-600/30 focus:border-accent-500/50 outline-none text-xs placeholder-zinc-600"
            required
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nuova password"
            className="w-full bg-dark-800/60 text-white px-3 py-2 rounded-lg border border-dark-600/30 focus:border-accent-500/50 outline-none text-xs placeholder-zinc-600"
            required
          />
          <button
            type="submit"
            disabled={savingPw}
            className="flex items-center gap-1.5 bg-accent-500 hover:bg-accent-400 text-white px-3 py-2 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
          >
            {savingPw ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
            Aggiorna password
          </button>
        </form>
        {pwMsg && (
          <p className={`text-[11px] mt-2 ${pwMsg.includes('Errore') ? 'text-red-400' : 'text-green-400'}`}>{pwMsg}</p>
        )}
      </div>
    </div>
  )
}
