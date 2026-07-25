import api from './client'
import type { AuthResponse } from '../types'

export const login = (username: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { username, password })

export const register = (username: string, email: string, password: string) =>
  api.post('/auth/register', { username, email, password })

export const refresh = (refresh_token: string) =>
  api.post<AuthResponse>('/auth/refresh', { refresh_token })
