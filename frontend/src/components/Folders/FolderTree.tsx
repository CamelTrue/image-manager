import { useState } from 'react'
import { Heart, Calendar, MapPin, FolderTree as FolderIcon, Trash2, FolderPlus, Check, X, Images, Lock, Unlock, Edit3, ChevronDown, ChevronRight } from 'lucide-react'
import type { FolderTree as FolderTreeType } from '../../types'

interface Props {
  folders: FolderTreeType[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  onCreate: (name: string, parentId: number | null) => void
  onDelete: (id: number) => void
  onRename: (id: number, name: string) => void
  onDropImage?: (imageId: number, folderId: number | null) => void
  onTogglePrivate?: (id: number, current: boolean) => void
  favoriteFilter?: boolean
  onFavoritesClick?: () => void
  trashedFilter?: boolean
  onTrashClick?: () => void
  timelineFilter?: boolean
  onTimelineClick?: () => void
  mapFilter?: boolean
  onMapClick?: () => void
}

function FolderNode({ folder, selectedId, onSelect, onCreate, onDelete, onRename, onDropImage, onTogglePrivate, depth = 0 }: {
  folder: FolderTreeType
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: (name: string, parentId: number) => void
  onDelete: (id: number) => void
  onRename: (id: number, name: string) => void
  onDropImage?: (imageId: number, folderId: number) => void
  onTogglePrivate?: (id: number, current: boolean) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(true)
  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim(), folder.id)
      setNewName('')
      setCreating(false)
    }
  }

  const handleRename = () => {
    if (newName.trim()) {
      onRename(folder.id, newName.trim())
      setNewName('')
      setRenaming(false)
    }
  }

  const isSelected = selectedId === folder.id

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-1.5 rounded-md cursor-pointer group transition-colors ${
          isSelected
            ? 'bg-accent-500/15 text-accent-400'
            : dragOver
              ? 'bg-accent-500/10 text-accent-400 ring-1 ring-accent-500/30'
              : 'text-zinc-400 hover:bg-dark-700/40 hover:text-zinc-200'
        }`}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const imageId = Number(e.dataTransfer.getData('text/plain'))
          if (imageId && onDropImage) onDropImage(imageId, folder.id)
        }}
      >
        <button onClick={() => setExpanded(!expanded)} className="p-0.5 shrink-0">
          {folder.children.length > 0 ? (
            expanded
              ? <ChevronDown size={12} className="text-zinc-500" />
              : <ChevronRight size={12} className="text-zinc-500" />
          ) : (
            <span className="w-3" />
          )}
        </button>
        {folder.is_private ? (
          <Lock size={12} className={isSelected ? 'text-accent-400' : 'text-zinc-500'} />
        ) : (
          <FolderIcon size={13} className={isSelected ? 'text-accent-400' : 'text-amber-500/60'} />
        )}
        {renaming ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              className="bg-dark-700 text-white text-[11px] px-1.5 py-0.5 rounded flex-1 outline-none border border-accent-500/50"
              autoFocus
            />
            <button onClick={handleRename} className="p-0.5 text-green-400"><Check size={11} /></button>
            <button onClick={() => setRenaming(false)} className="p-0.5 text-zinc-500"><X size={11} /></button>
          </div>
        ) : (
          <span
            className={`flex-1 text-[11px] truncate cursor-pointer ${folder.is_private ? 'italic' : ''}`}
            onClick={() => onSelect(folder.id)}
          >
            {folder.name}
          </span>
        )}
        {!renaming && (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setCreating(true); setExpanded(true) }}
              className="p-0.5 hover:bg-dark-600 rounded text-zinc-500 hover:text-green-400 transition-colors"
              title="Sottocartella"
            >
              <FolderPlus size={10} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setRenaming(true); setNewName(folder.name) }}
              className="p-0.5 hover:bg-dark-600 rounded text-zinc-500 hover:text-amber-400 transition-colors"
              title="Rinomina"
            >
              <Edit3 size={10} />
            </button>
            {onTogglePrivate && (
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePrivate(folder.id, folder.is_private) }}
                className="p-0.5 hover:bg-dark-600 rounded text-zinc-500 hover:text-amber-400 transition-colors"
                title={folder.is_private ? 'Rendi pubblica' : 'Rendi privata'}
              >
                {folder.is_private ? <Unlock size={10} /> : <Lock size={10} />}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(folder.id) }}
              className="p-0.5 hover:bg-dark-600 rounded text-zinc-500 hover:text-red-400 transition-colors"
              title="Elimina"
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}
      </div>

      {creating && (
        <div className="flex items-center gap-1 py-0.5 px-1.5" style={{ paddingLeft: `${(depth + 1) * 12 + 14}px` }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') setCreating(false)
            }}
            placeholder="Nome..."
            className="bg-dark-700 text-white text-[11px] px-1.5 py-0.5 rounded flex-1 outline-none border border-dark-500 focus:border-accent-500/50"
            autoFocus
          />
          <button onClick={handleCreate} className="p-0.5 text-green-400"><Check size={12} /></button>
          <button onClick={() => setCreating(false)} className="p-0.5 text-zinc-500"><X size={12} /></button>
        </div>
      )}

      {expanded && folder.children.map((child) => (
        <FolderNode
          key={child.id}
          folder={child}
          selectedId={selectedId}
          onSelect={onSelect}
          onCreate={onCreate}
          onDelete={onDelete}
          onRename={onRename}
          onDropImage={onDropImage}
          onTogglePrivate={onTogglePrivate}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

export default function FolderTree({ folders, selectedId, onSelect, onCreate, onDelete, onRename, onDropImage, onTogglePrivate, favoriteFilter, onFavoritesClick, trashedFilter, onTrashClick, timelineFilter, onTimelineClick, mapFilter, onMapClick }: Props) {
  const [newRootName, setNewRootName] = useState('')
  const [creatingRoot, setCreatingRoot] = useState(false)

  const handleCreateRoot = () => {
    if (newRootName.trim()) {
      onCreate(newRootName.trim(), null)
      setNewRootName('')
      setCreatingRoot(false)
    }
  }

  return (
    <div
      className="h-full flex flex-col"
      onDragOver={(e) => { e.preventDefault() }}
      onDrop={(e) => { e.preventDefault() }}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-dark-600/30">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Cartelle</span>
        <button
          onClick={() => setCreatingRoot(true)}
          className="p-1.5 hover:bg-dark-600 rounded text-zinc-500 hover:text-accent-400 transition-colors"
          title="Nuova cartella"
        >
          <FolderPlus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-auto py-1 px-1">
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-[11px] ${
            selectedId === null
              ? 'bg-accent-500/15 text-accent-400'
              : 'text-zinc-400 hover:bg-dark-700/40 hover:text-zinc-200'
          }`}
          onClick={() => onSelect(null)}
        >
          <Images size={12} className={selectedId === null ? 'text-accent-400' : 'text-zinc-500'} />
          <span className="font-medium">Tutte</span>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-[11px] ${
            favoriteFilter
              ? 'bg-accent-500/15 text-accent-400'
              : 'text-zinc-400 hover:bg-dark-700/40 hover:text-zinc-200'
          }`}
          onClick={() => onFavoritesClick?.()}
        >
          <Heart size={12} className={favoriteFilter ? 'text-accent-400' : 'text-zinc-500'} />
          <span className="font-medium">Preferiti</span>
        </div>

        <div className="h-px bg-dark-600/20 mx-2 my-1.5" />

        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-[11px] ${
            timelineFilter
              ? 'bg-accent-500/15 text-accent-400'
              : 'text-zinc-400 hover:bg-dark-700/40 hover:text-zinc-200'
          }`}
          onClick={() => onTimelineClick?.()}
        >
          <Calendar size={12} className={timelineFilter ? 'text-accent-400' : 'text-zinc-500'} />
          <span className="font-medium">Timeline</span>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-[11px] ${
            mapFilter
              ? 'bg-accent-500/15 text-accent-400'
              : 'text-zinc-400 hover:bg-dark-700/40 hover:text-zinc-200'
          }`}
          onClick={() => onMapClick?.()}
        >
          <MapPin size={12} className={mapFilter ? 'text-accent-400' : 'text-zinc-500'} />
          <span className="font-medium">Mappa</span>
        </div>

        <div className="h-px bg-dark-600/20 mx-2 my-1.5" />

        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-[11px] ${
            trashedFilter
              ? 'bg-accent-500/15 text-accent-400'
              : 'text-zinc-400 hover:bg-dark-700/40 hover:text-zinc-200'
          }`}
          onClick={() => onTrashClick?.()}
        >
          <Trash2 size={12} className={trashedFilter ? 'text-accent-400' : 'text-zinc-500'} />
          <span className="font-medium">Cestino</span>
        </div>

        <div className="h-px bg-dark-600/20 mx-2 my-1.5" />

        {creatingRoot && (
          <div className="flex items-center gap-1 py-1 px-2 mt-0.5">
            <input
              value={newRootName}
              onChange={(e) => setNewRootName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateRoot()
                if (e.key === 'Escape') setCreatingRoot(false)
              }}
              placeholder="Nome..."
              className="bg-dark-700 text-white text-[11px] px-1.5 py-0.5 rounded flex-1 outline-none border border-dark-500 focus:border-accent-500/50"
              autoFocus
            />
            <button onClick={handleCreateRoot} className="p-0.5 text-green-400"><Check size={12} /></button>
            <button onClick={() => setCreatingRoot(false)} className="p-0.5 text-zinc-500"><X size={12} /></button>
          </div>
        )}

        <div className="mt-0.5">
          {folders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
              onRename={onRename}
              onDropImage={onDropImage}
              onTogglePrivate={onTogglePrivate}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
