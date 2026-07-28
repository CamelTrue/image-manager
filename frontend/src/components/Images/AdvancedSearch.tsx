import { useState } from 'react'
import { SlidersHorizontal, X, ArrowUpDown } from 'lucide-react'

interface Props {
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
  mimeType: string
  onSortByChange: (v: string) => void
  onSortOrderChange: (v: 'ASC' | 'DESC') => void
  onMimeTypeChange: (v: string) => void
  onReset: () => void
}

export default function AdvancedSearch({
  sortBy, sortOrder, mimeType,
  onSortByChange, onSortOrderChange, onMimeTypeChange, onReset,
}: Props) {
  const [open, setOpen] = useState(false)
  const hasFilters = sortBy !== 'created_at' || sortOrder !== 'DESC' || mimeType !== ''

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`p-1.5 rounded-lg transition-colors ${
          hasFilters
            ? 'text-accent-400 bg-accent-500/15'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-dark-700'
        }`}
        title="Filtri avanzati"
      >
        <SlidersHorizontal size={15} />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 animate-fade-in">
      <div className="flex items-center gap-1.5">
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          className="bg-dark-800/60 text-white text-[11px] px-2 py-1.5 rounded-lg border border-dark-600/30 outline-none"
        >
          <option value="created_at">Data</option>
          <option value="original">Nome</option>
          <option value="size">Dimensione</option>
        </select>

        <button
          onClick={() => onSortOrderChange(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-dark-700 rounded-lg transition-colors"
          title={sortOrder === 'ASC' ? 'Crescente' : 'Decrescente'}
        >
          <ArrowUpDown size={13} />
        </button>

        <select
          value={mimeType}
          onChange={(e) => onMimeTypeChange(e.target.value)}
          className="bg-dark-800/60 text-white text-[11px] px-2 py-1.5 rounded-lg border border-dark-600/30 outline-none"
        >
          <option value="">Tutti i tipi</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
          <option value="image/webp">WebP</option>
          <option value="image/gif">GIF</option>
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={() => { onReset(); setOpen(false) }}
          className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors"
        >
          Reset
        </button>
      )}

      <button
        onClick={() => setOpen(false)}
        className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-dark-700 rounded-lg transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  )
}
