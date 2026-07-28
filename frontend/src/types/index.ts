export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface ImageInfo {
  id: number
  original: string
  mime_type: string
  size: number
  folder_id: number | null
  owner_id: number
  tags: string
  width: number
  height: number
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface Folder {
  id: number
  name: string
  parent_id: number | null
  owner_id: number
  is_private: boolean
  created_at: string
}

export interface FolderTree extends Folder {
  children: FolderTree[]
}

export interface Stats {
  users: number
  images: number
  folders: number
  total_size: number
}

export interface ShareLink {
  id: number
  image_id: number
  token: string
  owner_id: number
  created_at: string
  expires_at: string | null
}

export interface Profile {
  id: number
  username: string
  email: string
  role: string
  image_count: number
  total_size: number
  folder_count: number
}
