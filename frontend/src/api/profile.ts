import api from './client'
import type { Profile } from '../types'

export const getProfile = () =>
  api.get<Profile>('/profile')

export const updateEmail = (email: string) =>
  api.put('/profile', { email })

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.put('/profile/password', { current_password: currentPassword, new_password: newPassword })
