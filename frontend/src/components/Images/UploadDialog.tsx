import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'

interface Props {
  onUpload: (file: File) => Promise<void>
}

export default function UploadDialog({ onUpload }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round(((i + 1) / files.length) * 100))
      await onUpload(files[i])
    }
    setUploading(false)
    setProgress(0)
  }

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
      >
        <Upload size={18} />
        Upload
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
        <div
          className="fixed inset-0 bg-blue-600/20 backdrop-blur-sm z-50 flex items-center justify-center"
          onDragOver={(e) => { e.preventDefault() }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
        >
          <div className="bg-slate-800 border-2 border-dashed border-blue-500 rounded-2xl p-16 text-center">
            <Upload size={48} className="mx-auto text-blue-400 mb-4" />
            <p className="text-xl text-white">Drop files here</p>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl z-50">
          <div className="flex items-center gap-3">
            <div className="w-48 bg-slate-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm text-slate-400">{progress}%</span>
          </div>
        </div>
      )}

      <div
        className="fixed inset-0 pointer-events-none z-40"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      />
    </>
  )
}
