import { useState } from 'react'
import { Search } from 'lucide-react'
import FolderTree from '../components/Folders/FolderTree'
import ImageGrid from '../components/Images/ImageGrid'
import ImagePreview from '../components/Images/ImagePreview'
import UploadDialog from '../components/Images/UploadDialog'
import { useImages } from '../hooks/useImages'
import { useFolders } from '../hooks/useFolders'
import type { ImageInfo } from '../types'

export default function DashboardPage() {
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<ImageInfo | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const { images, loading, search, setSearch, upload, remove, rename } = useImages(selectedFolder)
  const { folders, create: createFolder, remove: deleteFolder, rename: renameFolder } = useFolders()

  const handleDelete = async (id: number) => {
    setConfirmDelete(id)
  }

  const confirmDeleteAction = async () => {
    if (confirmDelete) {
      await remove(confirmDelete)
      setConfirmDelete(null)
    }
  }

  return (
    <div className="flex h-full">
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex-shrink-0">
        <FolderTree
          folders={folders}
          selectedId={selectedFolder}
          onSelect={setSelectedFolder}
          onCreate={createFolder}
          onDelete={deleteFolder}
          onRename={renameFolder}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search images..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-700 text-white pl-9 pr-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>
          <UploadDialog onUpload={upload} />
        </div>

        <div className="flex-1 overflow-auto p-6">
          <ImageGrid
            images={images}
            loading={loading}
            onDelete={handleDelete}
            onRename={rename}
            onPreview={setPreviewImage}
          />
        </div>
      </div>

      {previewImage && (
        <ImagePreview
          image={previewImage}
          onClose={() => setPreviewImage(null)}
          onDelete={(id) => { remove(id); setPreviewImage(null) }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setConfirmDelete(null)}>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">Delete image?</h3>
            <p className="text-slate-400 text-sm mb-4">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">
                Cancel
              </button>
              <button onClick={confirmDeleteAction} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
