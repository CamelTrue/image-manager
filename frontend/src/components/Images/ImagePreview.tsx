import { useState, useEffect, useCallback } from 'react'
import { X, Download, Trash2, Info, Play, Pause, RotateCw, Share2, Tag, ChevronLeft, ChevronRight, Maximize2, Heart } from 'lucide-react'
import { getImageUrl, rotateImage } from '../../api/images'
import type { ImageInfo } from '../../types'
import TagsEditor from './TagsEditor'
import ShareDialog from './ShareDialog'

interface Props {
  image: ImageInfo
  onClose: () => void
  onDelete: (id: number) => void
  onFavorite?: (id: number) => void
  onUpdated?: () => void
  allImages?: ImageInfo[]
  onNavigate?: (image: ImageInfo) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImagePreview({ image, onClose, onDelete, onFavorite, onUpdated, allImages, onNavigate }: Props) {
  const [showInfo, setShowInfo] = useState(false)
  const [slideshow, setSlideshow] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [currentImage, setCurrentImage] = useState(image)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => { setCurrentImage(image) }, [image])

  useEffect(() => {
    if (!slideshow) return
    const timer = setInterval(() => {
      if (allImages && onNavigate) {
        const idx = allImages.findIndex((i) => i.id === currentImage.id)
        const next = (idx + 1) % allImages.length
        onNavigate(allImages[next])
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [slideshow, currentImage, allImages, onNavigate])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight' && allImages && onNavigate) {
      const idx = allImages.findIndex((i) => i.id === currentImage.id)
      if (idx < allImages.length - 1) onNavigate(allImages[idx + 1])
    }
    if (e.key === 'ArrowLeft' && allImages && onNavigate) {
      const idx = allImages.findIndex((i) => i.id === currentImage.id)
      if (idx > 0) onNavigate(allImages[idx - 1])
    }
    if (e.key === ' ') { e.preventDefault(); setSlideshow((s) => !s) }
    if (e.key === 'i') setShowInfo((s) => !s)
  }, [onClose, allImages, onNavigate, currentImage])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleDownload = async () => {
    const token = localStorage.getItem('access_token') || ''
    const res = await fetch(getImageUrl(currentImage.id), {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = currentImage.original
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRotate = async (degrees: number) => {
    if (rotating) return
    setRotating(true)
    try {
      await rotateImage(currentImage.id, degrees)
      onUpdated?.()
      onClose()
    } finally {
      setRotating(false)
    }
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-dark-950/95 backdrop-blur-xl" />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 p-2 text-zinc-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
      >
        <X size={18} />
      </button>

      {/* Navigation arrows */}
      {allImages && allImages.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const idx = allImages.findIndex((i) => i.id === currentImage.id)
              if (idx > 0) onNavigate?.(allImages[idx - 1])
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 text-zinc-400 hover:text-white hover:bg-dark-700/80 rounded-lg transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const idx = allImages.findIndex((i) => i.id === currentImage.id)
              if (idx < allImages.length - 1) onNavigate?.(allImages[idx + 1])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 text-zinc-400 hover:text-white hover:bg-dark-700/80 rounded-lg transition-colors"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Top right actions */}
      <div className="absolute top-3 right-12 z-10 flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo) }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            showInfo ? 'bg-accent-500 text-white' : 'bg-dark-700/80 text-zinc-400 hover:text-white'
          }`}
          title="Info (I)"
        >
          <Info size={14} />
          <span className="hidden sm:inline">Info</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setSlideshow(!slideshow) }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            slideshow ? 'bg-accent-500 text-white' : 'bg-dark-700/80 text-zinc-400 hover:text-white'
          }`}
          title="Slideshow (Space)"
        >
          {slideshow ? <Pause size={14} /> : <Play size={14} />}
          <span className="hidden sm:inline">{slideshow ? 'Pausa' : 'Slideshow'}</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); handleRotate(90) }}
          disabled={rotating}
          className="flex items-center gap-2 bg-dark-700/80 hover:bg-dark-600 text-zinc-400 hover:text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          title="Ruota 90°"
        >
          <RotateCw size={14} className={rotating ? 'animate-spin' : ''} />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setShowShare(true) }}
          className="flex items-center gap-2 bg-dark-700/80 hover:bg-dark-600 text-zinc-400 hover:text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          title="Condividi"
        >
          <Share2 size={14} />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setShowTags(true) }}
          className="flex items-center gap-2 bg-dark-700/80 hover:bg-dark-600 text-zinc-400 hover:text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          title="Tag"
        >
          <Tag size={14} />
        </button>

        {onFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite(currentImage.id) }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentImage.is_favorite
                ? 'bg-red-500/30 text-red-400'
                : 'bg-dark-700/80 hover:bg-dark-600 text-zinc-400 hover:text-red-400'
            }`}
            title={currentImage.is_favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          >
            <Heart size={14} fill={currentImage.is_favorite ? 'currentColor' : 'none'} />
          </button>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); handleDownload() }}
          className="flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Scarica</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(currentImage.id); onClose() }}
          className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Image */}
      <img
        src={getImageUrl(currentImage.id)}
        alt={currentImage.original}
        className="relative z-10 max-w-[90vw] max-h-[85vh] object-contain rounded-lg animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onLoad={handleImageLoad}
      />

      {/* Bottom info bar */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 glass px-4 py-2 rounded-lg flex items-center gap-3 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <Maximize2 size={13} className="text-zinc-500" />
        <span className="text-xs text-zinc-300 truncate max-w-[40vw]">{currentImage.original}</span>
        <span className="text-[10px] text-zinc-600">{formatSize(currentImage.size)}</span>
        {currentImage.width > 0 && (
          <span className="text-[10px] text-zinc-600">{currentImage.width}x{currentImage.height}</span>
        )}
        {slideshow && (
          <span className="text-[10px] text-accent-400 animate-pulse">Slideshow</span>
        )}
      </div>

      {/* Info panel */}
      {showInfo && (
        <div
          className="absolute top-14 right-3 z-10 glass-strong rounded-xl p-4 w-64 animate-fade-in border border-dark-600/20"
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="text-xs font-semibold text-white mb-3">Dettagli</h4>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Nome</span>
              <span className="text-zinc-300 truncate ml-2 max-w-[150px]">{currentImage.original}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Dimensione</span>
              <span className="text-zinc-300">{formatSize(currentImage.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Tipo</span>
              <span className="text-zinc-300">{currentImage.mime_type}</span>
            </div>
            {(currentImage.width > 0 || dims) && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Risoluzione</span>
                <span className="text-zinc-300">{currentImage.width || dims?.w || 0}x{currentImage.height || dims?.h || 0}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Caricata il</span>
              <span className="text-zinc-300">{new Date(currentImage.created_at).toLocaleDateString('it-IT')}</span>
            </div>
            {currentImage.tags && currentImage.tags !== '[]' && (
              <div>
                <span className="text-zinc-500">Tag</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {JSON.parse(currentImage.tags).map((tag: string) => (
                    <span key={tag} className="bg-accent-500/15 text-accent-400 text-[10px] px-1.5 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showTags && (
        <TagsEditor
          imageId={currentImage.id}
          currentTags={currentImage.tags}
          onSaved={(tags) => { setCurrentImage({ ...currentImage, tags }); onUpdated?.() }}
          onClose={() => setShowTags(false)}
        />
      )}

      {showShare && (
        <ShareDialog imageId={currentImage.id} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}
