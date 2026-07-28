import { useState, useEffect } from 'react'
import { X, Link2, Copy, Trash2, Clock, Check } from 'lucide-react'
import * as imagesApi from '../../api/images'
import type { ShareLink } from '../../types'

interface Props {
  imageId: number
  onClose: () => void
}

export default function ShareDialog({ imageId, onClose }: Props) {
  const [shares, setShares] = useState<ShareLink[]>([])
  const [expiresHours, setExpiresHours] = useState<number>(24)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchShares = async () => {
    const res = await imagesApi.listShares(imageId)
    setShares(res.data)
  }

  useEffect(() => {
    fetchShares()
  }, [imageId])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await imagesApi.createShare(imageId, expiresHours || undefined)
      setShares((prev) => [
        { id: Date.now(), image_id: imageId, token: res.data.token, owner_id: 0, created_at: new Date().toISOString(), expires_at: res.data.expires_at },
        ...prev,
      ])
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (token: string) => {
    await imagesApi.deleteShare(token)
    setShares((prev) => prev.filter((s) => s.token !== token))
  }

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-strong rounded-xl p-5 w-full max-w-md animate-scale-in border border-dark-600/20" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-500/15 flex items-center justify-center">
              <Link2 size={14} className="text-accent-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Condividi</h3>
              <p className="text-[10px] text-zinc-500">Crea link pubblici</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-dark-600 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 flex-1">
            <Clock size={13} className="text-zinc-500" />
            <span className="text-[11px] text-zinc-400">Scadenza:</span>
          </div>
          <select
            value={expiresHours}
            onChange={(e) => setExpiresHours(Number(e.target.value))}
            className="bg-dark-800/60 text-white text-[11px] px-2 py-1.5 rounded-lg border border-dark-600/30 outline-none"
          >
            <option value={0}>Mai</option>
            <option value={1}>1 ora</option>
            <option value={6}>6 ore</option>
            <option value={24}>24 ore</option>
            <option value={72}>3 giorni</option>
            <option value={168}>7 giorni</option>
          </select>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-1.5 bg-accent-500 hover:bg-accent-400 text-white px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
          >
            <Link2 size={11} />
            Crea link
          </button>
        </div>

        {shares.length === 0 ? (
          <div className="text-center py-6">
            <Link2 size={20} className="text-zinc-600 mx-auto mb-1.5" />
            <p className="text-[11px] text-zinc-500">Nessun link attivo</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-auto">
            {shares.map((share) => (
              <div key={share.token} className="flex items-center gap-2 bg-dark-800/40 rounded-lg px-3 py-2 border border-dark-600/20">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-400 truncate font-mono">{share.token.slice(0, 8)}...</p>
                  {share.expires_at && (
                    <p className="text-[9px] text-zinc-600">Scade: {new Date(share.expires_at).toLocaleDateString('it-IT')}</p>
                  )}
                </div>
                <button
                  onClick={() => copyLink(share.token)}
                  className="p-1 text-zinc-500 hover:text-accent-400 transition-colors"
                  title="Copia link"
                >
                  {copied === share.token ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                </button>
                <button
                  onClick={() => handleDelete(share.token)}
                  className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                  title="Rimuovi"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
