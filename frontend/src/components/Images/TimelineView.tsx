import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react'
import ImageGrid from './ImageGrid'
import type { ImageInfo, FolderTree } from '../../types'

interface Props {
  images: ImageInfo[]
  loading: boolean
  onDelete: (id: number) => void
  onRename: (id: number, name: string) => void
  onPreview: (image: ImageInfo) => void
  onFavorite?: (id: number) => void
  folders?: FolderTree[]
  selectedIds?: Set<number>
  onToggleSelect?: (id: number) => void
  onDragStart?: (id: number) => void
  onTags?: (image: ImageInfo) => void
}

type GroupKey = string

function getGroupKey(date: string): GroupKey {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getGroupLabel(key: GroupKey): string {
  const [y, m] = key.split('-').map(Number)
  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
  return `${months[m - 1]} ${y}`
}

export default function TimelineView({ images, loading, onDelete, onRename, onPreview, onFavorite, folders, selectedIds, onToggleSelect, onDragStart, onTags }: Props) {
  const [collapsed, setCollapsed] = useState<Set<GroupKey>>(new Set())

  const groups = useMemo(() => {
    const map = new Map<GroupKey, ImageInfo[]>()
    for (const img of images) {
      const key = getGroupKey(img.created_at)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(img)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
  }, [images])

  const toggle = (key: GroupKey) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <ImageIcon size={32} className="mb-2 opacity-30" />
        <p className="text-xs">Nessuna foto nella timeline</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map(([key, groupImages]) => {
        const isCollapsed = collapsed.has(key)
        return (
          <div key={key}>
            <button
              onClick={() => toggle(key)}
              className="flex items-center gap-2 px-2 py-1.5 w-full text-left hover:bg-dark-700/30 rounded-lg transition-colors group"
            >
              {isCollapsed ? <ChevronRight size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
              <h3 className="text-xs font-semibold text-zinc-300">{getGroupLabel(key)}</h3>
              <span className="text-[10px] text-zinc-600">{groupImages.length} foto</span>
            </button>
            {!isCollapsed && (
              <div className="mt-2">
                <ImageGrid
                  images={groupImages}
                  loading={false}
                  onDelete={onDelete}
                  onRename={onRename}
                  onPreview={onPreview}
                  onFavorite={onFavorite}
                  folders={folders}
                  selectedIds={selectedIds}
                  onToggleSelect={onToggleSelect}
                  onDragStart={onDragStart}
                  onTags={onTags}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
