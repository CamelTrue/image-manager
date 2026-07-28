import { useState, useRef, useEffect } from 'react'
import { Upload, CloudUpload } from 'lucide-react'

interface Props {
  onUpload: (file: File) => Promise<void>
}

export default function UploadDialog({ onUpload }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setFileName(files.length > 1 ? `${files.length} file` : files[0].name)
    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round(((i + 1) / files.length) * 100))
      await onUpload(files[i])
    }
    setUploading(false)
    setProgress(0)
    setFileName('')
  }

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      setDragOver(true)
    }
    const handleDragLeave = (e: DragEvent) => {
      if (e.clientX === 0 && e.clientY === 0) setDragOver(false)
    }
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files)
    }

    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)
    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [])

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-xs shadow-md shadow-accent-500/15"
      >
        <Upload size={13} />
        <span className="hidden sm:inline">Carica</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {dragOver && (
        <div className="fixed inset-0 bg-accent-500/10 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="glass-strong border-2 border-dashed border-accent-500/40 rounded-2xl p-16 text-center animate-scale-in">
            <CloudUpload size={44} className="mx-auto text-accent-400 mb-3" />
            <p className="text-lg text-white font-semibold">Rilascia qui i file</p>
            <p className="text-xs text-zinc-400 mt-1">Le immagini verranno caricate automaticamente</p>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed bottom-4 right-4 glass-strong rounded-xl p-3 shadow-xl z-50 min-w-[220px] animate-slide-up border border-dark-600/30">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-6 h-6 rounded-md bg-accent-500/20 flex items-center justify-center">
              <Upload size={12} className="text-accent-400 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white font-medium truncate">{fileName}</p>
              <p className="text-[10px] text-zinc-500">Caricamento...</p>
            </div>
            <span className="text-[11px] text-accent-400 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-0.5">
            <div
              className="bg-gradient-to-r from-accent-500 to-accent-400 h-0.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </>
  )
}
