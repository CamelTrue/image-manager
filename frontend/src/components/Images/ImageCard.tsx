import { useState } from 'react'
import { Download, Trash2, Edit3 } from 'lucide-react'
import { getImageUrl } from '../../api/images'
import type { ImageInfo } from '../../types'

interface Props {
  image: ImageInfo
  onDelete: (id: number) => void
  onRename: (id: number, name: string) => void
  onPreview: (image: ImageInfo) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageCard({ image, onDelete, onRename, onPreview }: Props) {
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(image.original)

  const handleRename = () => {
    if (newName.trim() && newName !== image.original) {
      onRename(image.id, newName.trim())
    }
    setRenaming(false)
  }

  const handleDownload = async () => {
    const res = await fetch(getImageUrl(image.id), {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = image.original
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="group relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all">
      <div
        className="aspect-square cursor-pointer overflow-hidden"
        onClick={() => onPreview(image)}
      >
        <img
          src={getImageUrl(image.id)}
          alt={image.original}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      <div className="p-3">
        {renaming ? (
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { e.key === 'Enter' && handleRename(); e.key === 'Escape' && setRenaming(false) }}
            className="w-full bg-slate-700 text-white text-sm px-2 py-1 rounded outline-none"
            autoFocus
          />
        ) : (
          <p className="text-sm text-slate-300 truncate" title={image.original}>{image.original}</p>
        )}
        <p className="text-xs text-slate-500 mt-1">{formatSize(image.size)}</p>
      </div>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={handleDownload} className="p-1.5 bg-slate-900/80 rounded-lg hover:bg-blue-600 text-white" title="Download">
          <Download size={14} />
        </button>
        <button onClick={() => { setNewName(image.original); setRenaming(true) }} className="p-1.5 bg-slate-900/80 rounded-lg hover:bg-yellow-600 text-white" title="Rename">
          <Edit3 size={14} />
        </button>
        <button onClick={() => onDelete(image.id)} className="p-1.5 bg-slate-900/80 rounded-lg hover:bg-red-600 text-white" title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
