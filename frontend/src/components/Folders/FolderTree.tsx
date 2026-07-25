import { useState } from 'react'
import { FolderTree as FolderIcon, ChevronRight, ChevronDown, FolderPlus, Trash2, Edit3 } from 'lucide-react'
import type { FolderTree as FolderTreeType } from '../../types'

interface Props {
  folders: FolderTreeType[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  onCreate: (name: string, parentId: number | null) => void
  onDelete: (id: number) => void
  onRename: (id: number, name: string) => void
}

function FolderNode({ folder, selectedId, onSelect, onCreate, onDelete, onRename, depth = 0 }: {
  folder: FolderTreeType
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: (name: string, parentId: number) => void
  onDelete: (id: number) => void
  onRename: (id: number, name: string) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(false)

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

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer group hover:bg-slate-700/50 ${
          selectedId === folder.id ? 'bg-blue-600/20 text-blue-400' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button onClick={() => setExpanded(!expanded)} className="p-0.5">
          {folder.children.length > 0 ? (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="w-4" />
          )}
        </button>
        <FolderIcon size={14} className="text-yellow-500" />
        {renaming ? (
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { e.key === 'Enter' && handleRename(); e.key === 'Escape' && setRenaming(false) }}
            onBlur={handleRename}
            className="bg-slate-600 text-white text-sm px-1 rounded flex-1 outline-none"
            autoFocus
          />
        ) : (
          <span
            className="flex-1 text-sm truncate cursor-pointer"
            onClick={() => onSelect(folder.id)}
          >
            {folder.name}
          </span>
        )}
        <div className="hidden group-hover:flex items-center gap-1">
          <button onClick={() => { setCreating(true); setExpanded(true) }} className="p-0.5 hover:text-green-400">
            <FolderPlus size={12} />
          </button>
          <button onClick={() => { setRenaming(true); setNewName(folder.name) }} className="p-0.5 hover:text-yellow-400">
            <Edit3 size={12} />
          </button>
          <button onClick={() => onDelete(folder.id)} className="p-0.5 hover:text-red-400">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {creating && (
        <div className="flex items-center gap-1 py-1" style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { e.key === 'Enter' && handleCreate(); e.key === 'Escape' && setCreating(false) }}
            placeholder="Folder name..."
            className="bg-slate-600 text-white text-sm px-2 py-0.5 rounded flex-1 outline-none"
            autoFocus
          />
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
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

export default function FolderTree({ folders, selectedId, onSelect, onCreate, onDelete, onRename }: Props) {
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
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Folders</span>
        <button
          onClick={() => setCreatingRoot(true)}
          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
        >
          <FolderPlus size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-auto py-1">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-700/50 ${
            selectedId === null ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300'
          }`}
          onClick={() => onSelect(null)}
        >
          <FolderIcon size={14} className="text-blue-400" />
          <span className="text-sm">All Images</span>
        </div>
        {creatingRoot && (
          <div className="flex items-center gap-1 py-1 px-3">
            <input
              value={newRootName}
              onChange={(e) => setNewRootName(e.target.value)}
              onKeyDown={(e) => { e.key === 'Enter' && handleCreateRoot(); e.key === 'Escape' && setCreatingRoot(false) }}
              placeholder="Folder name..."
              className="bg-slate-600 text-white text-sm px-2 py-0.5 rounded flex-1 outline-none"
              autoFocus
            />
          </div>
        )}
        {folders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            selectedId={selectedId}
            onSelect={(id) => onSelect(id)}
            onCreate={onCreate}
            onDelete={onDelete}
            onRename={onRename}
          />
        ))}
      </div>
    </div>
  )
}
