import { useState } from 'react'
import { Download, Trash2, Edit3, Check, X, Tag } from 'lucide-react'
import { getImageUrl, getThumbnailUrl } from '../../api/images'
import type { ImageInfo } from '../../types'

interface Props {
  image: ImageInfo
  onDelete: (id: number) => void
  onRename: (id: number, name: string) => void
  onPreview: (image: ImageInfo) => void
  selected?: boolean
  onToggleSelect?: (id: number) => void
  selectionMode?: boolean
  onDragStart?: (id: number) => void
  onTags?: (image: ImageInfo) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function parseTags(tags: string): string[] {
  try { return JSON.parse(tags || '[]') } catch { return [] }
}

export default function ImageCard({ image, onDelete, onRename, onPreview, selected, onToggleSelect, selectionMode, onDragStart, onTags }: Props) {
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(image.original)

  const handleRename = () => {
    if (newName.trim() && newName !== image.original) {
      onRename(image.id, newName.trim())
    }
    setRenaming(false)
  }

  const handleDownload = async () => {
    const token = localStorage.getItem('access_token') || ''
    const res = await fetch(getImageUrl(image.id), {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = image.original
    a.click()
    URL.revokeObjectURL(url)
  }

  const imageTags = parseTags(image.tags)

  return (
    <div
      className={`group relative rounded-xl overflow-hidden border transition-all duration-150 ${
        selected
          ? 'bg-accent-500/10 border-accent-500/40 ring-1 ring-accent-500/20'
          : 'bg-dark-800/40 border-dark-600/20 hover:border-dark-500/50'
      }`}
      draggable={!!onDragStart}
      onDragStart={(e) => {
        if (onDragStart) {
          e.dataTransfer.setData('text/plain', String(image.id))
          e.dataTransfer.effectAllowed = 'move'
          onDragStart(image.id)
        }
      }}
    >
      <div
        className="aspect-square cursor-pointer overflow-hidden relative bg-dark-900"
        onClick={() => selectionMode && onToggleSelect ? onToggleSelect(image.id) : onPreview(image)}
        onContextMenu={(e) => { e.preventDefault(); onToggleSelect?.(image.id) }}
      >
        <img
          src={getThumbnailUrl(image.id)}
          alt={image.original}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget
            target.src = getImageUrl(image.id)
          }}
        />

        {onToggleSelect && (
          <div
            className={`absolute top-2 left-2 z-10 transition-opacity duration-150 ${
              selectionMode || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={(e) => { e.stopPropagation(); onToggleSelect(image.id) }}
          >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 ${
              selected
                ? 'bg-accent-500 shadow-md shadow-accent-500/30'
                : 'bg-dark-900/70 backdrop-blur-sm border border-white/20'
            }`}>
              {selected && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

        {!selectionMode && (
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload() }}
              className="p-2 bg-dark-900/70 backdrop-blur-sm rounded-lg hover:bg-accent-500 text-white/80 hover:text-white transition-colors"
              title="Scarica"
            >
              <Download size={13} />
            </button>
            {onTags && (
              <button
                onClick={(e) => { e.stopPropagation(); onTags(image) }}
                className="p-2 bg-dark-900/70 backdrop-blur-sm rounded-lg hover:bg-accent-500 text-white/80 hover:text-white transition-colors"
                title="Tag"
              >
                <Tag size={13} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setNewName(image.original); setRenaming(true) }}
              className="p-2 bg-dark-900/70 backdrop-blur-sm rounded-lg hover:bg-amber-500 text-white/80 hover:text-white transition-colors"
              title="Rinomina"
            >
              <Edit3 size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(image.id) }}
              className="p-2 bg-dark-900/70 backdrop-blur-sm rounded-lg hover:bg-red-500 text-white/80 hover:text-white transition-colors"
              title="Elimina"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="px-3 py-2.5">
        {renaming ? (
          <div className="flex items-center gap-1">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              className="bg-dark-700 text-white text-[11px] px-1.5 py-0.5 rounded flex-1 outline-none border border-accent-500/50"
              autoFocus
            />
            <button onClick={handleRename} className="p-0.5 text-green-400"><Check size={12} /></button>
            <button onClick={() => setRenaming(false)} className="p-0.5 text-zinc-500"><X size={12} /></button>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-400 truncate leading-tight" title={image.original}>
            {image.original}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[10px] text-zinc-600">{formatSize(image.size)}</p>
          {imageTags.length > 0 && (
            <div className="flex gap-0.5">
              {imageTags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[9px] bg-accent-500/15 text-accent-400/80 px-1 rounded">{tag}</span>
              ))}
              {imageTags.length > 2 && (
                <span className="text-[9px] text-zinc-600">+{imageTags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
