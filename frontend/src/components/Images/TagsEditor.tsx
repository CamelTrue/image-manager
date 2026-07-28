import { useState, useEffect, useRef } from 'react'
import { X, Tag, Plus } from 'lucide-react'
import * as imagesApi from '../../api/images'

interface Props {
  imageId: number
  currentTags: string
  onSaved: (tags: string) => void
  onClose: () => void
}

export default function TagsEditor({ imageId, currentTags, onSaved, onClose }: Props) {
  const [tags, setTags] = useState<string[]>(() => {
    try { return JSON.parse(currentTags || '[]') } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    imagesApi.listTags().then((res) => {
      setSuggestions(res.data.filter((t) => !tags.includes(t)))
    })
  }, [tags])

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
    setInput('')
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await imagesApi.setTags(imageId, tags)
      onSaved(JSON.stringify(tags))
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const filtered = suggestions.filter((s) =>
    s.includes(input.toLowerCase()) && input.length > 0
  )

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-strong rounded-xl p-5 w-full max-w-sm animate-scale-in border border-dark-600/20" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-500/15 flex items-center justify-center">
              <Tag size={14} className="text-accent-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Tag</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-dark-600 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-accent-500/15 text-accent-400 text-[11px] px-2 py-1 rounded-lg border border-accent-500/20"
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>

        <div className="relative mb-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { addTag(input); e.preventDefault() }
              if (e.key === 'Escape') onClose()
            }}
            placeholder="Aggiungi tag..."
            className="w-full bg-dark-800/60 text-white text-[11px] px-3 py-2 rounded-lg border border-dark-600/30 focus:border-accent-500/40 outline-none transition-colors placeholder-zinc-600"
            autoFocus
          />
          {filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-600/30 rounded-lg overflow-hidden z-10 max-h-28 overflow-auto">
              {filtered.map((s) => (
                <button
                  key={s}
                  onClick={() => addTag(s)}
                  className="w-full text-left px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-dark-700 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Plus size={10} className="text-zinc-500" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-zinc-400 hover:text-white text-[11px] rounded-lg hover:bg-dark-700 transition-colors">
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3.5 py-1.5 bg-accent-500 hover:bg-accent-400 text-white rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}
