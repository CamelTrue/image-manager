import api from './client'
import type { FolderTree, Folder } from '../types'

export const listFolders = () =>
  api.get<FolderTree[]>('/folders')

export const createFolder = (name: string, parent_id: number | null) =>
  api.post<Folder>('/folders', { name, parent_id })

export const updateFolder = (id: number, name: string) =>
  api.put(`/folders/${id}`, { name })

export const deleteFolder = (id: number) =>
  api.delete(`/folders/${id}`)
