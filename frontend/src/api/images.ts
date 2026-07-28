import api from './client'
import type { ImageInfo, ImageExif } from '../types'

export const listImages = (params: { folder_id?: number; search?: string; tags?: string; mime_type?: string; min_size?: number; max_size?: number; sort?: string; order?: string }) =>
  api.get<ImageInfo[]>('/images', { params })

export const getImage = (id: number) =>
  api.get<ImageInfo>(`/images/${id}`)

export const uploadImage = (file: File, folder_id?: number) => {
  const formData = new FormData()
  formData.append('file', file)
  const params = folder_id ? `?folder_id=${folder_id}` : ''
  return api.post<ImageInfo>(`/images/upload${params}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const deleteImage = (id: number) =>
  api.delete(`/images/${id}`)

export const updateImage = (id: number, data: { original?: string; folder_id?: number; tags?: string }) =>
  api.put<ImageInfo>(`/images/${id}`, data)

export const moveImage = (id: number, folder_id: number | null) =>
  api.put(`/images/${id}/move`, { folder_id })

export const downloadImage = (id: number) =>
  api.get(`/images/${id}/download`, { responseType: 'blob' })

export const getImageUrl = (id: number) => {
  const token = localStorage.getItem('access_token') || ''
  return `/api/images/${id}/download?token=${encodeURIComponent(token)}`
}

export const getThumbnailUrl = (id: number) => {
  const token = localStorage.getItem('access_token') || ''
  return `/api/images/${id}/thumbnail?token=${encodeURIComponent(token)}`
}

export const rotateImage = (id: number, degrees: number) =>
  api.post(`/images/${id}/rotate`, { degrees })

export const setTags = (id: number, tags: string[]) =>
  api.put(`/images/${id}/tags`, { tags })

export const listTags = () =>
  api.get<string[]>('/tags')

export const downloadZip = (ids: number[]) =>
  api.post('/images/download-zip', { ids }, { responseType: 'blob' })

export const createShare = (imageId: number, expiresInHours?: number) =>
  api.post<{ token: string; image_id: number; expires_at: string | null }>(`/images/${imageId}/share`, { expires_in_hours: expiresInHours })

export const listShares = (imageId: number) =>
  api.get(`/images/${imageId}/shares`)

export const deleteShare = (token: string) =>
  api.delete(`/share/${token}`)

export const toggleFavorite = (id: number) =>
  api.post<ImageInfo>(`/images/${id}/favorite`)

export const restoreImage = (id: number) =>
  api.post<ImageInfo>(`/images/${id}/restore`)

export const permanentDelete = (id: number) =>
  api.delete(`/images/${id}/permanent`)

export const emptyTrash = () =>
  api.delete('/trash/empty')

export const getExif = (id: number) =>
  api.get<ImageExif | null>(`/images/${id}/exif`)
