import { useState, useEffect, useCallback } from 'react'
import type { ImageInfo } from '../types'
import * as imagesApi from '../api/images'

export function useImages(folderId: number | null) {
  const [images, setImages] = useState<ImageInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchImages = useCallback(async () => {
    setLoading(true)
    try {
      const params: { folder_id?: number; search?: string } = {}
      if (folderId) params.folder_id = folderId
      if (search) params.search = search
      const res = await imagesApi.listImages(params)
      setImages(res.data)
    } catch (e) {
      console.error('Failed to fetch images', e)
    } finally {
      setLoading(false)
    }
  }, [folderId, search])

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

  return { images, loading, search, setSearch, upload, remove, rename, refresh: fetchImages }
}
