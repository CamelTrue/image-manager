import { useState, useEffect, useCallback } from 'react'
import type { ImageInfo } from '../types'
import * as imagesApi from '../api/images'

export function useImages(folderId: number | null) {
  const [images, setImages] = useState<ImageInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tags, setTags] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [mimeType, setMimeType] = useState('')
  const [favoriteFilter, setFavoriteFilter] = useState(false)
  const [trashedFilter, setTrashedFilter] = useState(false)

  const fetchImages = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {}
      if (folderId && !trashedFilter) params.folder_id = folderId
      if (search) params.search = search
      if (tags) params.tags = tags
      if (sortBy) params.sort = sortBy
      if (sortOrder) params.order = sortOrder
      if (mimeType) params.mime_type = mimeType
      if (favoriteFilter) params.favorite = 'true'
      if (trashedFilter) params.trashed = 'true'
      const res = await imagesApi.listImages(params as any)
      setImages(res.data)
    } catch (e) {
      console.error('Failed to fetch images', e)
    } finally {
      setLoading(false)
    }
  }, [folderId, search, tags, sortBy, sortOrder, mimeType, favoriteFilter, trashedFilter])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const upload = async (file: File) => {
    await imagesApi.uploadImage(file, folderId ?? undefined)
    fetchImages()
  }

  const remove = async (id: number) => {
    await imagesApi.deleteImage(id)
    fetchImages()
  }

  const rename = async (id: number, name: string) => {
    await imagesApi.updateImage(id, { original: name })
    fetchImages()
  }

  return {
    images, loading, search, setSearch,
    tags, setTags,
    sortBy, setSortBy, sortOrder, setSortOrder,
    mimeType, setMimeType,
    favoriteFilter, setFavoriteFilter,
    trashedFilter, setTrashedFilter,
    upload, remove, rename, refresh: fetchImages,
  }
}
