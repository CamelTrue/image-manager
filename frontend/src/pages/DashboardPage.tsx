import { useState, useCallback, useEffect } from 'react'
import { Search, PanelLeftClose, PanelLeft, Trash2, Download, X, CheckSquare, Square, Archive, Lock, Eye, RotateCw } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'
import FolderTree from '../components/Folders/FolderTree'
import ImageGrid from '../components/Images/ImageGrid'
import ImagePreview from '../components/Images/ImagePreview'
import TimelineView from '../components/Images/TimelineView'
import MapView from '../components/Images/MapView'
import UploadDialog from '../components/Images/UploadDialog'
import AdvancedSearch from '../components/Images/AdvancedSearch'
import TagsEditor from '../components/Images/TagsEditor'
import { useImages } from '../hooks/useImages'
import { useFolders } from '../hooks/useFolders'
import { getImageUrl, downloadZip, moveImage, toggleFavorite, restoreImage, permanentDelete, emptyTrash, getGeotaggedImages } from '../api/images'
import type { GeotaggedImage } from '../api/images'
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
  const [timelineFilter, setTimelineFilter] = useState(false)
  const [mapFilter, setMapFilter] = useState(false)
  const [geotaggedImages, setGeotaggedImages] = useState<GeotaggedImage[]>([])
  const [geotaggedLoading, setGeotaggedLoading] = useState(false)

  useEffect(() => {
    setRevealedFolders(new Set())
    setRevealAllPrivate(false)
  }, [selectedFolder])

  useEffect(() => {
    if (!mapFilter) { setGeotaggedImages([]); return }
    setGeotaggedLoading(true)
    getGeotaggedImages()
      .then((res) => setGeotaggedImages(res.data))
      .finally(() => setGeotaggedLoading(false))
  }, [mapFilter])

  const {
    images, loading, search, setSearch,
    tags: tagsFilter, setTags,
    sortBy, setSortBy, sortOrder, setSortOrder,
    mimeType, setMimeType,
    favoriteFilter, setFavoriteFilter,
    trashedFilter, setTrashedFilter,
    upload, remove, rename, refresh,
  } = useImages(timelineFilter || mapFilter ? null : selectedFolder)
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

  const handleFavorite = async (id: number) => {
    await toggleFavorite(id)
    refresh()
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
          selectedId={favoriteFilter || trashedFilter || timelineFilter || mapFilter ? null : selectedFolder}
          onSelect={(id) => { setSelectedFolder(id); setFavoriteFilter(false); setTrashedFilter(false); setTimelineFilter(false); setMapFilter(false); setRevealAllPrivate(false); setRevealedFolders(new Set()) }}
          onCreate={createFolder}
          onDelete={deleteFolder}
          onRename={renameFolder}
          onDropImage={handleDropImage}
          onTogglePrivate={togglePrivate}
          favoriteFilter={favoriteFilter}
          onFavoritesClick={() => { setFavoriteFilter(true); setTrashedFilter(false); setSelectedFolder(null); setTimelineFilter(false); setMapFilter(false); setRevealAllPrivate(false); setRevealedFolders(new Set()) }}
          trashedFilter={trashedFilter}
          onTrashClick={() => { setTrashedFilter(true); setFavoriteFilter(false); setSelectedFolder(null); setTimelineFilter(false); setMapFilter(false); setRevealAllPrivate(false); setRevealedFolders(new Set()) }}
          timelineFilter={timelineFilter}
          onTimelineClick={() => { setTimelineFilter(true); setFavoriteFilter(false); setTrashedFilter(false); setSelectedFolder(null); setMapFilter(false); setRevealAllPrivate(false); setRevealedFolders(new Set()) }}
          mapFilter={mapFilter}
          onMapClick={() => { setMapFilter(true); setFavoriteFilter(false); setTrashedFilter(false); setSelectedFolder(null); setTimelineFilter(false); setRevealAllPrivate(false); setRevealedFolders(new Set()) }}
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
              selectedId={favoriteFilter || trashedFilter || timelineFilter || mapFilter ? null : selectedFolder}
              onSelect={(id) => { setSelectedFolder(id); setSidebarOpen(false); setFavoriteFilter(false); setTrashedFilter(false); setTimelineFilter(false); setMapFilter(false); setRevealAllPrivate(false); setRevealedFolders(new Set()) }}
              onCreate={createFolder}
              onDelete={deleteFolder}
              onRename={renameFolder}
              onDropImage={handleDropImage}
              onTogglePrivate={togglePrivate}
              favoriteFilter={favoriteFilter}
              onFavoritesClick={() => { setFavoriteFilter(true); setTrashedFilter(false); setSelectedFolder(null); setSidebarOpen(false); setTimelineFilter(false); setMapFilter(false); setRevealAllPrivate(false); setRevealedFolders(new Set()) }}
              trashedFilter={trashedFilter}
              onTrashClick={() => { setTrashedFilter(true); setFavoriteFilter(false); setSelectedFolder(null); setSidebarOpen(false); setTimelineFilter(false); setMapFilter(false); setRevealAllPrivate(false); setRevealedFolders(new Set()) }}
              timelineFilter={timelineFilter}
              onTimelineClick={() => { setTimelineFilter(true); setFavoriteFilter(false); setTrashedFilter(false); setSelectedFolder(null); setSidebarOpen(false); setMapFilter(false); setRevealAllPrivate(false); setRevealedFolders(new Set()) }}
              mapFilter={mapFilter}
              onMapClick={() => { setMapFilter(true); setFavoriteFilter(false); setTrashedFilter(false); setSelectedFolder(null); setSidebarOpen(false); setTimelineFilter(false); setRevealAllPrivate(false); setRevealedFolders(new Set()) }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-dark-600/30 shrink-0">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-dark-700 rounded-lg transition-colors"
              >
                {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom" sideOffset={4} className="animate-tooltip-slide-up z-50 px-2 py-1 rounded-md bg-dark-700 text-[10px] text-white shadow-lg border border-dark-500/30">
                Sidebar
                <Tooltip.Arrow className="fill-dark-700" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Cerca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-800/60 text-white pl-9 pr-3 py-1.5 rounded-lg border border-dark-600/30 focus:border-accent-500/40 outline-none transition-colors text-xs placeholder-zinc-600"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>

          <input
            type="text"
            placeholder="Tag..."
            value={tagsFilter}
            onChange={(e) => setTags(e.target.value)}
            className="hidden md:block w-28 bg-dark-800/60 text-white px-2.5 py-1.5 rounded-lg border border-dark-600/30 focus:border-accent-500/40 outline-none transition-colors text-xs placeholder-zinc-600"
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
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={toggleAll}
                  className={`p-1.5 rounded-lg transition-colors ${
                    selectedIds.size === visibleImages.length && visibleImages.length > 0
                      ? 'text-accent-400 bg-accent-500/15'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-dark-700'
                  }`}
                >
                  {selectedIds.size === visibleImages.length && visibleImages.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom" sideOffset={4} className="animate-tooltip-slide-up z-50 px-2 py-1 rounded-md bg-dark-700 text-[10px] text-white shadow-lg border border-dark-500/30">
                  {selectedIds.size === visibleImages.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
                  <Tooltip.Arrow className="fill-dark-700" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )}

          <UploadDialog onUpload={upload} />
        </div>

        {selectionMode && (
          <div className="flex items-center gap-3 px-6 py-2.5 bg-accent-500/10 border-b border-accent-500/20 shrink-0 animate-fade-in">
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

        <div className="flex-1 overflow-auto px-4 md:px-6 py-4 md:py-6">
          <div className="max-w-6xl mx-auto">
          {trashedFilter ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Trash2 size={16} className="text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Cestino</span>
                <div className="flex-1" />
                {images.length > 0 && (
                  <button
                    onClick={async () => { if (confirm('Svuotare il cestino? Le immagini verranno eliminate definitivamente.')) { await emptyTrash(); refresh() } }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-[11px] font-medium rounded-lg transition-colors"
                  >
                    <Trash2 size={12} />
                    Svuota cestino
                  </button>
                )}
              </div>
              <div className="flex justify-center">
                <div className="grid grid-cols-5 gap-3 w-full max-w-5xl">
                  {images.map((img) => (
                    <div key={img.id} className="group relative rounded-xl overflow-hidden bg-dark-800/40 border border-dark-600/30 shadow-sm hover:shadow-lg hover:shadow-black/20 transition-all duration-200 aspect-[4/3]">
                      <img src={getImageUrl(img.id)} alt={img.original} className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <button
                              onClick={async () => { await restoreImage(img.id); refresh() }}
                              className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                            >
                              <RotateCw size={14} />
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content side="top" sideOffset={4} className="animate-tooltip-slide-up z-50 px-2 py-1 rounded-md bg-dark-700 text-[10px] text-white shadow-lg border border-dark-500/30">
                              Ripristina
                              <Tooltip.Arrow className="fill-dark-700" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <button
                              onClick={async () => { if (confirm('Eliminare definitivamente questa immagine?')) { await permanentDelete(img.id); refresh() } }}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content side="top" sideOffset={4} className="animate-tooltip-slide-up z-50 px-2 py-1 rounded-md bg-dark-700 text-[10px] text-white shadow-lg border border-dark-500/30">
                              Elimina definitivamente
                              <Tooltip.Arrow className="fill-dark-700" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </div>
                      <div className="absolute bottom-1 left-1 right-1">
                        <p className="text-[10px] text-zinc-500 truncate px-1">{img.original}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {images.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                  <div className="w-14 h-14 rounded-xl bg-dark-800/60 border border-dark-600/30 flex items-center justify-center mb-3">
                    <Trash2 size={24} className="text-zinc-600" />
                  </div>
                  <p className="text-sm font-medium text-zinc-400">Cestino vuoto</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">Le immagini eliminate resteranno qui per 30 giorni</p>
                </div>
              )}
            </>
          ) : showHiddenUI ? (
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
              {timelineFilter ? (
                <>
                {isAllView && hiddenImages.length > 0 && !revealAllPrivate && (
                  <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-600/30 animate-fade-in">
                    <Lock size={14} className="text-zinc-500 shrink-0" />
                    <span className="text-xs text-zinc-500 flex-1">
                      {hiddenImages.length} {hiddenImages.length === 1 ? 'immagine nascosta' : 'immagini nascoste'} in cartelle private
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
                <TimelineView
                  images={visibleImages}
                  loading={loading}
                  onDelete={(id) => setConfirmDelete(id)}
                  onRename={rename}
                  onPreview={setPreviewImage}
                  folders={folders}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onDragStart={() => {}}
                  onTags={(img) => setTagImage(img)}
                  onFavorite={handleFavorite}
                />
              </>
              ) : mapFilter ? (
                <MapView images={geotaggedImages} loading={geotaggedLoading} />
              ) : (
                <>
              {isAllView && hiddenImages.length > 0 && !revealAllPrivate && (
                <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-600/30 animate-fade-in">
                  <Lock size={14} className="text-zinc-500 shrink-0" />
                  <span className="text-xs text-zinc-500 flex-1">
                    {hiddenImages.length} {hiddenImages.length === 1 ? 'immagine nascosta' : 'immagini nascoste'} in cartelle private
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
                onFavorite={handleFavorite}
              />
              </>
              )}
            </>
          )}
          </div>
        </div>
      </div>

      {previewImage && (
        <ImagePreview
          image={previewImage}
          onClose={() => setPreviewImage(null)}
          onDelete={(id) => { remove(id); setPreviewImage(null) }}
          onFavorite={handleFavorite}
          onUpdated={refresh}
          allImages={images}
          onNavigate={setPreviewImage}
          folders={folders}
          onMove={() => { refresh(); refreshFolders() }}
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

      <Dialog.Root open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-overlay-show data-[state=closed]:animate-overlay-hide" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm data-[state=open]:animate-content-show data-[state=closed]:animate-content-hide">
            <div className="glass-strong rounded-xl p-5 border border-dark-600/30 shadow-2xl">
              <Dialog.Title className="text-base font-semibold text-white mb-1">Elimina immagine?</Dialog.Title>
              <Dialog.Description className="text-zinc-500 text-sm mb-5">Azione irreversibile.</Dialog.Description>
              <div className="flex gap-2 justify-end">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 text-zinc-400 hover:text-white text-sm rounded-lg hover:bg-dark-700 transition-colors">
                    Annulla
                  </button>
                </Dialog.Close>
                <button
                  onClick={confirmDeleteAction}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-colors"
                >
                  Elimina
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={confirmBulkDelete} onOpenChange={(open) => { if (!open) setConfirmBulkDelete(false) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-overlay-show data-[state=closed]:animate-overlay-hide" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm data-[state=open]:animate-content-show data-[state=closed]:animate-content-hide">
            <div className="glass-strong rounded-xl p-5 border border-dark-600/30 shadow-2xl">
              <Dialog.Title className="text-base font-semibold text-white mb-1">
                Elimina {selectedIds.size} immagini?
              </Dialog.Title>
              <Dialog.Description className="text-zinc-500 text-sm mb-5">Azione irreversibile.</Dialog.Description>
              <div className="flex gap-2 justify-end">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 text-zinc-400 hover:text-white text-sm rounded-lg hover:bg-dark-700 transition-colors">
                    Annulla
                  </button>
                </Dialog.Close>
                <button
                  onClick={bulkDelete}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-colors"
                >
                  Elimina {selectedIds.size}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}