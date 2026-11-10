import type { CurrentUser, UserRole } from '@/shared/api/types'

export type AccountRole = 'Reader' | 'Librarian' | 'Admin'
export type AccountStatus = 'Active' | 'Locked' | 'Inactive'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accountId: number
  username: string
  fullName: string
  email: string
  role: string | UserRole
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt?: string
  user?: CurrentUser
}

export interface RegisterRequest {
  username: string
  fullName: string
  email: string
  password: string
  phoneNumber?: string
  phone?: string // Tương thích ngược form hiện tại
}

export interface ProfileDto {
  id: number
  username: string
  fullName: string
  email: string
  phoneNumber?: string
  address?: string
  dateOfBirth?: string
  role: string | UserRole
  status: AccountStatus | string
  createdAt: string
  lastLoginAt?: string
}

export interface UpdateProfileRequest {
  fullName: string
  phoneNumber?: string
  phone?: string // Tương thích ngược form hiện tại
  address?: string
  dateOfBirth?: string
  avatarUrl?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword?: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}
