import api from './client'
import type { FolderTree, Folder } from '../types'

export const listFolders = () =>
  api.get<FolderTree[]>('/folders')

export const createFolder = (name: string, parent_id: number | null, is_private = false) =>
  api.post<Folder>('/folders', { name, parent_id, is_private })

export const updateFolder = (id: number, data: { name?: string; is_private?: boolean }) =>
  api.put(`/folders/${id}`, data)

export const deleteFolder = (id: number) =>
  api.delete(`/folders/${id}`)
