import { useState } from 'react'
import { Download, Trash2, Edit3, Check, X, Tag, Heart } from 'lucide-react'
import { getImageUrl, getThumbnailUrl } from '../../api/images'
import type { ImageInfo } from '../../types'
import * as Tooltip from '@radix-ui/react-tooltip'

interface Props {
  image: ImageInfo
  onDelete: (id: number) => void
  onRename: (id: number, name: string) => void
  onPreview: (image: ImageInfo) => void
  onFavorite?: (id: number) => void
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

export default function ImageCard({ image, onDelete, onRename, onPreview, onFavorite, selected, onToggleSelect, selectionMode, onDragStart, onTags }: Props) {
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
      className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
        selected
          ? 'bg-accent-500/10 border-accent-400/50 ring-2 ring-accent-400/30 shadow-xl shadow-accent-500/20'
          : 'bg-dark-800/60 border-dark-600/20 hover:border-accent-500/30 hover:shadow-2xl hover:shadow-black/30'
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
        className="aspect-[3/2] cursor-pointer overflow-hidden relative bg-dark-900"
        onClick={() => selectionMode && onToggleSelect ? onToggleSelect(image.id) : onPreview(image)}
        onContextMenu={(e) => { e.preventDefault(); onToggleSelect?.(image.id) }}
      >
        <img
          src={getThumbnailUrl(image.id)}
          alt={image.original}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-75"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget
            target.src = getImageUrl(image.id)
          }}
        />

        {onToggleSelect && (
          <div
            className={`absolute top-3 left-3 z-10 transition-opacity duration-150 ${
              selectionMode || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={(e) => { e.stopPropagation(); onToggleSelect(image.id) }}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 ${
              selected
                ? 'bg-accent-500 shadow-lg shadow-accent-500/40'
                : 'bg-black/60 backdrop-blur-sm border-2 border-white/30'
            }`}>
              {selected && <Check size={14} className="text-white" strokeWidth={3} />}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {!selectionMode && (
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
            {onFavorite && (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); onFavorite(image.id) }}
                    className={`p-2.5 backdrop-blur-md rounded-xl transition-all shadow-lg ${
                      image.is_favorite
                        ? 'bg-red-500/40 text-red-300 shadow-red-500/20'
                        : 'bg-black/50 text-white/80 hover:text-red-400 hover:bg-red-500/30 hover:shadow-red-500/10'
                    }`}
                  >
                    <Heart size={15} fill={image.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="top" sideOffset={6} className="animate-tooltip-slide-up z-50 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-[11px] text-white shadow-xl border border-zinc-700/50">
                    {image.is_favorite ? 'Rimuovi preferito' : 'Preferito'}
                    <Tooltip.Arrow className="fill-zinc-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            )}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload() }}
                  className="p-2.5 backdrop-blur-md rounded-xl bg-black/50 text-white/80 hover:bg-accent-500/40 hover:text-white transition-all shadow-lg"
                >
                  <Download size={15} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="top" sideOffset={6} className="animate-tooltip-slide-up z-50 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-[11px] text-white shadow-xl border border-zinc-700/50">
                  Scarica
                  <Tooltip.Arrow className="fill-zinc-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            {onTags && (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); onTags(image) }}
                    className="p-2.5 backdrop-blur-md rounded-xl bg-black/50 text-white/80 hover:bg-accent-500/40 hover:text-white transition-all shadow-lg"
                  >
                    <Tag size={15} />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="top" sideOffset={6} className="animate-tooltip-slide-up z-50 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-[11px] text-white shadow-xl border border-zinc-700/50">
                    Tag
                    <Tooltip.Arrow className="fill-zinc-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            )}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); setNewName(image.original); setRenaming(true) }}
                  className="p-2.5 backdrop-blur-md rounded-xl bg-black/50 text-white/80 hover:bg-amber-500/40 hover:text-white transition-all shadow-lg"
                >
                  <Edit3 size={15} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="top" sideOffset={6} className="animate-tooltip-slide-up z-50 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-[11px] text-white shadow-xl border border-zinc-700/50">
                  Rinomina
                  <Tooltip.Arrow className="fill-zinc-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(image.id) }}
                  className="p-2.5 backdrop-blur-md rounded-xl bg-black/50 text-white/80 hover:bg-red-500/40 hover:text-white transition-all shadow-lg"
                >
                  <Trash2 size={15} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="top" sideOffset={6} className="animate-tooltip-slide-up z-50 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-[11px] text-white shadow-xl border border-zinc-700/50">
                  Elimina
                  <Tooltip.Arrow className="fill-zinc-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>
        )}
      </div>

      <div className="px-3 py-2.5 md:px-4 md:py-3.5">
        {renaming ? (
          <div className="flex items-center gap-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              className="bg-dark-700 text-white text-xs px-2 py-1 rounded-lg flex-1 outline-none border border-accent-500/50"
              autoFocus
            />
            <button onClick={handleRename} className="p-1 text-green-400 hover:bg-dark-600 rounded-lg transition-colors"><Check size={14} /></button>
            <button onClick={() => setRenaming(false)} className="p-1 text-zinc-500 hover:bg-dark-600 rounded-lg transition-colors"><X size={14} /></button>
          </div>
        ) : (
          <p className="text-xs font-medium text-zinc-300 truncate leading-tight" title={image.original}>
            {image.original}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-[11px] text-zinc-500">{formatSize(image.size)}</p>
          {imageTags.length > 0 && (
            <div className="flex gap-1">
              {imageTags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] bg-accent-500/15 text-accent-400/80 px-1.5 py-0.5 rounded-md">{tag}</span>
              ))}
              {imageTags.length > 2 && (
                <span className="text-[10px] text-zinc-600">+{imageTags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}