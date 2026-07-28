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
  deleted_at: string | null
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

export interface ImageExif {
  image_id: number
  make: string | null
  model: string | null
  lens: string | null
  iso: number | null
  aperture: number | null
  shutter_speed: string | null
  focal_length: number | null
  gps_lat: number | null
  gps_lng: number | null
  date_taken: string | null
  flash: number | null
  exposure_program: number | null
  software: string | null
}
