import { useState, useCallback, useEffect } from 'react'
import { Search, PanelLeftClose, PanelLeft, Trash2, Download, X, CheckSquare, Square, Archive, Lock, Eye } from 'lucide-react'
import FolderTree from '../components/Folders/FolderTree'
import ImageGrid from '../components/Images/ImageGrid'
import ImagePreview from '../components/Images/ImagePreview'
import UploadDialog from '../components/Images/UploadDialog'
import AdvancedSearch from '../components/Images/AdvancedSearch'
import TagsEditor from '../components/Images/TagsEditor'
import { useImages } from '../hooks/useImages'
import { useFolders } from '../hooks/useFolders'
import { getImageUrl, downloadZip, moveImage } from '../api/images'
import type { ImageInfo, FolderTree as FolderTreeType } from '../types'

function findFolder(tree: FolderTreeType[], id: number): FolderTreeType | null {
  for (const f of tree) {
    if (f.id === id) return f
    const found = findFolder(f.children, id)
    if (found) return found
  }
  return null
}

function collectPrivateFolderIds(tree: FolderTreeType[]): Set<number> {
  const ids = new Set<number>()
  for (const f of tree) {
    if (f.is_private) ids.add(f.id)
    for (const cid of collectPrivateFolderIds(f.children)) ids.add(cid)
  }
  return ids
}

export default function DashboardPage() {
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<ImageInfo | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [tagImage, setTagImage] = useState<ImageInfo | null>(null)
  const [revealedFolders, setRevealedFolders] = useState<Set<number>>(new Set())
  const [revealAllPrivate, setRevealAllPrivate] = useState(false)

  useEffect(() => {
    setRevealedFolders(new Set())
    setRevealAllPrivate(false)
  }, [selectedFolder])

  const {
    images, loading, search, setSearch,
    tags: tagsFilter, setTags,
    sortBy, setSortBy, sortOrder, setSortOrder,
    mimeType, setMimeType,
    upload, remove, rename, refresh,
  } = useImages(selectedFolder)
  const { folders, create: createFolder, remove: deleteFolder, rename: renameFolder, refresh: refreshFolders, togglePrivate } = useFolders()

  const isAllView = selectedFolder === null
  const selectionMode = selectedIds.size > 0

  const selectedFolderData = selectedFolder !== null ? findFolder(folders, selectedFolder) : null
  const isPrivateFolder = selectedFolderData?.is_private === true
  const isFolderRevealed = selectedFolder !== null && revealedFolders.has(selectedFolder)
  const showHiddenUI = isPrivateFolder && !isFolderRevealed

  const privateFolderIds = collectPrivateFolderIds(folders)
  const hiddenImages = isAllView
    ? images.filter((img) => img.folder_id !== null && privateFolderIds.has(img.folder_id))
    : []
  const visibleImages = isAllView && !revealAllPrivate
    ? images.filter((img) => img.folder_id === null || !privateFolderIds.has(img.folder_id))
    : images

  const revealFolder = () => {
    if (selectedFolder !== null) {
      setRevealedFolders((prev) => new Set(prev).add(selectedFolder))
    }
  }

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (selectedIds.size === visibleImages.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleImages.map((i) => i.id)))
    }
  }, [selectedIds.size, visibleImages])

  const clearSelection = () => setSelectedIds(new Set())

  const bulkDelete = async () => {
    for (const id of selectedIds) {
      await remove(id)
    }
    setSelectedIds(new Set())
    setConfirmBulkDelete(false)
  }

  const bulkDownload = async () => {
    if (selectedIds.size > 1) {
      const ids = Array.from(selectedIds)
      try {
        const res = await downloadZip(ids)
        const blob = new Blob([res.data], { type: 'application/zip' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `images-${ids.length}.zip`
        a.click()
        URL.revokeObjectURL(url)
      } catch {
        for (const id of ids) {
          const img = images.find((i) => i.id === id)
          const token = localStorage.getItem('access_token') || ''
          const res = await fetch(getImageUrl(id), { headers: { Authorization: `Bearer ${token}` } })
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = img?.original || `image-${id}`
          a.click()
          URL.revokeObjectURL(url)
          await new Promise((r) => setTimeout(r, 200))
        }
      }
    } else {
      for (const id of selectedIds) {
        const img = images.find((i) => i.id === id)
        const token = localStorage.getItem('access_token') || ''
        const res = await fetch(getImageUrl(id), { headers: { Authorization: `Bearer ${token}` } })
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = img?.original || `image-${id}`
        a.click()
        URL.revokeObjectURL(url)
        await new Promise((r) => setTimeout(r, 200))
      }
    }
    clearSelection()
  }

  const handleDropImage = async (imageId: number, folderId: number | null) => {
    await moveImage(imageId, folderId)
    refresh()
    refreshFolders()
  }

  const confirmDeleteAction = async () => {
    if (confirmDelete) {
      await remove(confirmDelete)
      setConfirmDelete(null)
    }
  }

  const resetFilters = () => {
    setSortBy('created_at')
    setSortOrder('DESC')
    setMimeType('')
  }

  return (
    <div className="flex h-full">
      <div
        className={`hidden md:block flex-shrink-0 border-r border-dark-600/30 transition-all duration-200 ${
          sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'
        }`}
      >
        <FolderTree
          folders={folders}
          selectedId={selectedFolder}
          onSelect={setSelectedFolder}
          onCreate={createFolder}
          onDelete={deleteFolder}
          onRename={renameFolder}
          onDropImage={handleDropImage}
          onTogglePrivate={togglePrivate}
        />
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 h-full bg-dark-900 border-r border-dark-600/30 animate-fade-in">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-dark-600/30">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Cartelle</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-zinc-500 hover:text-white">
                <PanelLeftClose size={16} />
              </button>
            </div>
            <FolderTree
              folders={folders}
              selectedId={selectedFolder}
              onSelect={(id) => { setSelectedFolder(id); setSidebarOpen(false) }}
              onCreate={createFolder}
              onDelete={deleteFolder}
              onRename={renameFolder}
              onDropImage={handleDropImage}
              onTogglePrivate={togglePrivate}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-3 md:px-4 py-2.5 border-b border-dark-600/30 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-dark-700 rounded-lg transition-colors"
            title="Sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>

          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Cerca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-800/60 text-white pl-3 pr-8 py-1.5 rounded-lg border border-dark-600/30 focus:border-accent-500/40 outline-none transition-colors text-xs placeholder-zinc-600"
            />
            <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>

          <input
            type="text"
            placeholder="Tag..."
            value={tagsFilter}
            onChange={(e) => setTags(e.target.value)}
            className="hidden md:block w-24 bg-dark-800/60 text-white px-2.5 py-1.5 rounded-lg border border-dark-600/30 focus:border-accent-500/40 outline-none transition-colors text-xs placeholder-zinc-600"
          />

          <AdvancedSearch
            sortBy={sortBy}
            sortOrder={sortOrder}
            mimeType={mimeType}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
            onMimeTypeChange={setMimeType}
            onReset={resetFilters}
          />

          {isAllView && visibleImages.length > 0 && (
            <button
              onClick={toggleAll}
              className={`p-1.5 rounded-lg transition-colors ${
                selectedIds.size === visibleImages.length && visibleImages.length > 0
                  ? 'text-accent-400 bg-accent-500/15'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-dark-700'
              }`}
              title={selectedIds.size === visibleImages.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
            >
              {selectedIds.size === visibleImages.length && visibleImages.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
          )}

          <UploadDialog onUpload={upload} />
        </div>

        {selectionMode && (
          <div className="flex items-center gap-3 px-4 py-2 bg-accent-500/10 border-b border-accent-500/20 shrink-0 animate-fade-in">
            <span className="text-xs text-accent-400 font-medium">{selectedIds.size} selezionate</span>
            <div className="flex-1" />
              <button
              onClick={bulkDownload}
              className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-400 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {selectedIds.size > 1 ? <Archive size={14} /> : <Download size={14} />}
              {selectedIds.size > 1 ? 'Scarica ZIP' : 'Scarica'}
            </button>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-medium rounded-lg transition-colors"
            >
              <Trash2 size={14} />
              Elimina
            </button>
            <button
              onClick={clearSelection}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-3 md:p-4">
          {showHiddenUI ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="p-4 rounded-2xl bg-dark-800/40 border border-dark-600/30 mb-4">
                <Lock size={32} className="text-zinc-600 mx-auto" />
              </div>
              <h3 className="text-sm font-medium text-zinc-300 mb-1">
                I contenuti presenti nella cartella "{selectedFolderData?.name}" sono nascosti
              </h3>
              <p className="text-xs text-zinc-600 mb-4">
                Questa cartella è privata. Clicca il pulsante per visualizzarne il contenuto.
              </p>
              <button
                onClick={revealFolder}
                className="flex items-center gap-2 px-4 py-2 bg-accent-500/15 hover:bg-accent-500/25 text-accent-400 border border-accent-500/30 text-xs font-medium rounded-lg transition-colors"
              >
                <Eye size={14} />
                Mostra contenuti
              </button>
            </div>
          ) : (
            <>
              {isAllView && hiddenImages.length > 0 && !revealAllPrivate && (
                <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-600/30 animate-fade-in">
                  <Lock size={14} className="text-zinc-500 shrink-0" />
                  <span className="text-xs text-zinc-500 flex-1">
                    {hiddenImages.length} immagine{hiddenImages.length !== 1 ? 'i' : ''} nascosta{hiddenImages.length !== 1 ? 'i' : ''} in cartelle private
                  </span>
                  <button
                    onClick={() => setRevealAllPrivate(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-500/15 hover:bg-accent-500/25 text-accent-400 border border-accent-500/30 text-[11px] font-medium rounded-lg transition-colors"
                  >
                    <Eye size={12} />
                    Mostra
                  </button>
                </div>
              )}
              <ImageGrid
                images={visibleImages}
                loading={loading}
                onDelete={(id) => setConfirmDelete(id)}
                onRename={rename}
                onPreview={setPreviewImage}
                folders={folders}
                showGrouping={isAllView}
                selectedIds={selectedIds}
                onToggleSelect={isAllView ? toggleSelect : undefined}
                onDragStart={() => {}}
                onTags={(img) => setTagImage(img)}
              />
            </>
          )}
        </div>
      </div>

      {previewImage && (
        <ImagePreview
          image={previewImage}
          onClose={() => setPreviewImage(null)}
          onDelete={(id) => { remove(id); setPreviewImage(null) }}
          onUpdated={refresh}
          allImages={images}
          onNavigate={setPreviewImage}
        />
      )}

      {tagImage && (
        <TagsEditor
          imageId={tagImage.id}
          currentTags={tagImage.tags}
          onSaved={() => { setTagImage(null); refresh() }}
          onClose={() => setTagImage(null)}
        />
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="glass-strong rounded-xl p-5 max-w-sm w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-white mb-1">Elimina immagine?</h3>
            <p className="text-zinc-500 text-sm mb-5">Azione irreversibile.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-zinc-400 hover:text-white text-sm rounded-lg hover:bg-dark-700 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-colors"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmBulkDelete && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setConfirmBulkDelete(false)}
        >
          <div
            className="glass-strong rounded-xl p-5 max-w-sm w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-white mb-1">
              Elimina {selectedIds.size} immagini?
            </h3>
            <p className="text-zinc-500 text-sm mb-5">Azione irreversibile.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white text-sm rounded-lg hover:bg-dark-700 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={bulkDelete}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-colors"
              >
                Elimina {selectedIds.size}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
