import { useState } from 'react'
import { ChevronDown, ChevronRight, FolderOpen, Images, Upload } from 'lucide-react'
import ImageCard from './ImageCard'
import type { ImageInfo, FolderTree } from '../../types'

interface Props {
  images: ImageInfo[]
  loading: boolean
  onDelete: (id: number) => void
  onRename: (id: number, name: string) => void
  onPreview: (image: ImageInfo) => void
  onFavorite?: (id: number) => void
  folders?: FolderTree[]
  showGrouping?: boolean
  selectedIds?: Set<number>
  onToggleSelect?: (id: number) => void
  onDragStart?: (id: number) => void
  onTags?: (image: ImageInfo) => void
}

function flattenFolders(folders: FolderTree[]): { id: number; name: string; parentId: number | null }[] {
  const result: { id: number; name: string; parentId: number | null }[] = []
  const walk = (list: FolderTree[], parentPath: string) => {
    for (const f of list) {
      const path = parentPath ? `${parentPath} / ${f.name}` : f.name
      result.push({ id: f.id, name: path, parentId: f.parent_id })
      if (f.children.length) walk(f.children, path)
    }
  }
  walk(folders, '')
  return result
}

function FolderSection({ title, images, onDelete, onRename, onPreview, onFavorite, selectedIds, onToggleSelect, onDragStart, onTags }: {
  title: string
  images: ImageInfo[]
  onDelete: (id: number) => void
  onRename: (id: number, name: string) => void
  onPreview: (image: ImageInfo) => void
  onFavorite?: (id: number) => void
  selectedIds?: Set<number>
  onToggleSelect?: (id: number) => void
  onDragStart?: (id: number) => void
  onTags?: (image: ImageInfo) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const selectionMode = !!onToggleSelect

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full text-left mb-2 group/header px-1"
      >
        {collapsed ? <ChevronRight size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
        <FolderOpen size={14} className="text-amber-500/70" />
        <span className="text-xs font-medium text-zinc-300 group-hover/header:text-white transition-colors">{title}</span>
        <span className="text-[10px] text-zinc-600 ml-0.5">{images.length}</span>
        <div className="flex-1 h-px bg-dark-600/30 ml-2" />
      </button>
      {!collapsed && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onDelete={onDelete}
              onRename={onRename}
              onPreview={onPreview}
              onFavorite={onFavorite}
              selected={selectedIds?.has(image.id)}
              onToggleSelect={onToggleSelect}
              selectionMode={selectionMode}
              onDragStart={onDragStart}
              onTags={onTags}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ImageGrid({ images, loading, onDelete, onRename, onPreview, onFavorite, folders, showGrouping, selectedIds, onToggleSelect, onDragStart, onTags }: Props) {
  const selectionMode = !!onToggleSelect

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-shimmer rounded-xl aspect-square" />
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-14 h-14 rounded-xl bg-dark-800/60 border border-dark-600/30 flex items-center justify-center mb-3">
          <Images size={24} className="text-zinc-600" />
        </div>
        <p className="text-sm font-medium text-zinc-400">Nessuna immagine</p>
        <p className="text-[11px] text-zinc-600 mt-0.5">Carica immagini per iniziare</p>
        <div className="flex items-center gap-1.5 text-accent-400/40 text-[11px] mt-3">
          <Upload size={12} />
          <span>Trascina i file qui oppure usa Upload</span>
        </div>
      </div>
    )
  }

  if (showGrouping && folders && folders.length > 0) {
    const flatFolders = flattenFolders(folders)
    const folderMap = new Map<number, ImageInfo[]>()
    const ungrouped: ImageInfo[] = []

    for (const img of images) {
      if (img.folder_id) {
        const arr = folderMap.get(img.folder_id) || []
        arr.push(img)
        folderMap.set(img.folder_id, arr)
      } else {
        ungrouped.push(img)
      }
    }

    const sections: { title: string; images: ImageInfo[] }[] = []
    for (const f of flatFolders) {
      const imgs = folderMap.get(f.id)
      if (imgs && imgs.length > 0) {
        sections.push({ title: f.name, images: imgs })
      }
    }
    if (ungrouped.length > 0) {
      sections.push({ title: 'Senza cartella', images: ungrouped })
    }

    return (
      <div>
        {sections.map((section) => (
          <FolderSection
            key={section.title}
            title={section.title}
            images={section.images}
            onDelete={onDelete}
            onRename={onRename}
            onPreview={onPreview}
            onFavorite={onFavorite}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onDragStart={onDragStart}
            onTags={onTags}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          onDelete={onDelete}
          onRename={onRename}
          onPreview={onPreview}
          onFavorite={onFavorite}
          selected={selectedIds?.has(image.id)}
          onToggleSelect={onToggleSelect}
          selectionMode={selectionMode}
          onDragStart={onDragStart}
          onTags={onTags}
        />
      ))}
    </div>
  )
}
