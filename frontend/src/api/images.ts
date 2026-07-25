import api from './client'
import type { ImageInfo } from '../types'

export const listImages = (params: { folder_id?: number; search?: string; tags?: string }) =>
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

export const getImageUrl = (id: number) => `/api/images/${id}/download`
