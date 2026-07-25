import { X, Download, Trash2 } from 'lucide-react'
import { getImageUrl } from '../../api/images'
import type { ImageInfo } from '../../types'

interface Props {
  image: ImageInfo
  onClose: () => void
  onDelete: (id: number) => void
}

export default function ImagePreview({ image, onClose, onDelete }: Props) {
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
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-slate-300 p-2">
        <X size={24} />
      </button>

      <div className="absolute top-4 right-16 flex gap-2">
        <button onClick={handleDownload} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">
          <Download size={16} />
          Download
        </button>
        <button
          onClick={() => { onDelete(image.id); onClose() }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      <img
        src={getImageUrl(image.id)}
        alt={image.original}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/80 px-4 py-2 rounded-lg text-sm text-slate-300">
        {image.original}
      </div>
    </div>
  )
}
