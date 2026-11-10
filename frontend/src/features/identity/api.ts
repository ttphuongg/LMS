import { apiClient } from '@/shared/api/client'
import type { ApiResponse, CurrentUser, UserRole } from '@/shared/api/types'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ProfileDto,
} from './types'

export const identityApi = {
  // Đăng nhập
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/api/identity/login', credentials)
    const data = res.data.data
    return {
      ...data,
      user: {
        id: data.accountId,
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        role: data.role as UserRole,
      },
    }
  },

  // Đăng ký
  register: async (data: RegisterRequest): Promise<CurrentUser> => {
    // BE RegisterRequest(Username, FullName, Email, Password, PhoneNumber)
    const payload = {
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber || data.phone || null,
    }
    const res = await apiClient.post<ApiResponse<number>>('/api/identity/register', payload)
    return {
      id: res.data.data,
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      role: 'Reader',
      phoneNumber: data.phoneNumber || data.phone,
      phone: data.phoneNumber || data.phone,
    }
  },

  // Lấy hồ sơ cá nhân
  getProfile: async (): Promise<CurrentUser> => {
    const res = await apiClient.get<ApiResponse<ProfileDto>>('/api/identity/profile')
    const d = res.data.data
    return {
      id: d.id,
      username: d.username,
      fullName: d.fullName,
      email: d.email,
      role: d.role as UserRole,
      phoneNumber: d.phoneNumber || '',
      phone: d.phoneNumber || '',
      address: d.address || '',
      dateOfBirth: d.dateOfBirth ? String(d.dateOfBirth) : undefined,
      status: d.status,
    }
  },

  // Cập nhật hồ sơ
  updateProfile: async (data: UpdateProfileRequest): Promise<CurrentUser> => {
    // BE UpdateProfileBody(FullName, PhoneNumber, Address, DateOfBirth)
    const payload = {
      fullName: data.fullName,
      phoneNumber: data.phoneNumber || data.phone || null,
      address: data.address || null,
      dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : null,
    }
    await apiClient.put<ApiResponse<boolean>>('/api/identity/profile', payload)
    // Tải lại thông tin hồ sơ mới nhất từ server
    return await identityApi.getProfile()
  },

  // Đổi mật khẩu
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    // BE ChangePasswordBody(CurrentPassword, NewPassword)
    const payload = {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    }
    await apiClient.post<ApiResponse>('/api/identity/change-password', payload)
  },

  // Làm mới token
  refreshToken: async (token: string): Promise<LoginResponse> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/api/identity/refresh', { refreshToken: token })
    const result = res.data
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Làm mới token không thành công')
    }
    return result.data
  },

  // Đăng xuất
  logout: async (): Promise<void> => {
    try {
      await apiClient.post<ApiResponse>('/api/identity/logout')
    } catch {
      // Ignored
    }
  },
}
