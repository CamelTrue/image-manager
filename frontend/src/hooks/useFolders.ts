import { useState, useEffect, useCallback } from 'react'
import type { FolderTree } from '../types'
import * as foldersApi from '../api/folders'

export function useFolders() {
  const [folders, setFolders] = useState<FolderTree[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFolders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await foldersApi.listFolders()
      setFolders(res.data)
    } catch (e) {
      console.error('Failed to fetch folders', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  const create = async (name: string, parentId: number | null) => {
    await foldersApi.createFolder(name, parentId)
    fetchFolders()
  }

  const rename = async (id: number, name: string) => {
    await foldersApi.updateFolder(id, name)
    fetchFolders()
  }

  const remove = async (id: number) => {
    await foldersApi.deleteFolder(id)
    fetchFolders()
  }

  return { folders, loading, create, rename, remove, refresh: fetchFolders }
}
