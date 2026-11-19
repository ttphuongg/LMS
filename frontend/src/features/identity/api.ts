import { apiClient } from '@/shared/api/client'
import { normalizeDateToIso } from '@/shared/utils/format'
import type { ApiResponse, CurrentUser, UserRole } from '@/shared/api/types'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailOtpRequest,
  VerifyEmailOtpResponse,
  ResendEmailOtpRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ProfileDto,
  ForgotPasswordRequest,
  ResetPasswordRequest,
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
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    // BE RegisterRequest(Username, FullName, Email, Password, PhoneNumber)
    const payload = {
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber || data.phone || null,
      registrationToken: data.registrationToken || null,
    }
    const res = await apiClient.post<ApiResponse<RegisterResponse>>('/api/identity/register', payload)
    return res.data.data
  },

  // Xác thực mã OTP đăng ký email
  verifyEmailOtp: async (data: VerifyEmailOtpRequest): Promise<VerifyEmailOtpResponse> => {
    const res = await apiClient.post<ApiResponse<VerifyEmailOtpResponse>>('/api/identity/verify-email-otp', data)
    return res.data.data
  },

  // Gửi lại mã OTP đăng ký email
  resendEmailOtp: async (data: ResendEmailOtpRequest): Promise<boolean> => {
    const res = await apiClient.post<ApiResponse<boolean>>('/api/identity/resend-email-otp', data)
    return res.data.data
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
      dateOfBirth: normalizeDateToIso(data.dateOfBirth),
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

  // Quên mật khẩu: Yêu cầu gửi hướng dẫn & mã OTP
  forgotPassword: async (data: ForgotPasswordRequest): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>>('/api/identity/forgot-password', data)
    return res.data.data
  },

  // Đặt lại mật khẩu mới bằng Token hoặc OTP
  resetPassword: async (data: ResetPasswordRequest): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>>('/api/identity/reset-password', data)
    return res.data.data
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
