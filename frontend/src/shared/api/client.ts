import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, ProblemDetails } from './types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export interface AuthAdapter {
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  onTokens: (accessToken: string, refreshToken?: string) => void
  onLogout: () => void
}

let authAdapter: AuthAdapter | null = null

export const setAuthAdapter = (adapter: AuthAdapter) => {
  authAdapter = adapter
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Request Interceptor: đính kèm Bearer token qua AuthAdapter
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authAdapter ? authAdapter.getAccessToken() : null
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false

interface RefreshSubscriber {
  onSuccess: (token: string) => void
  onFailure: (error: unknown) => void
}
let refreshSubscribers: RefreshSubscriber[] = []

const subscribeTokenRefresh = (subscriber: RefreshSubscriber) => {
  refreshSubscribers.push(subscriber)
}

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((s) => s.onSuccess(token))
  refreshSubscribers = []
}

// Refresh thất bại: báo lỗi cho mọi request đang xếp hàng để chúng không bị treo
const onRefreshFailed = (error: unknown) => {
  refreshSubscribers.forEach((s) => s.onFailure(error))
  refreshSubscribers = []
}

// Xoá phiên đăng nhập và đưa người dùng về trang đăng nhập
const forceLogout = () => {
  if (authAdapter) {
    authAdapter.onLogout()
  }
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// Response Interceptor: xử lý ApiResponse<T> envelope và 401 refresh
apiClient.interceptors.response.use(
  (response) => {
    // Nếu response có dạng ApiResponse envelope
    const data = response.data as ApiResponse<unknown>
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success === false) {
        // Nghiệp vụ trả về HTTP 200 nhưng success = false
        const errorMessage = data.error || 'Yêu cầu không thành công'
        const customError = new Error(errorMessage)
        return Promise.reject(customError)
      }
    }
    return response
  },
  async (error: AxiosError<ProblemDetails | ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Xử lý 401 Unauthorized -> Refresh token qua AuthAdapter
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = authAdapter ? authAdapter.getRefreshToken() : null
      if (!refreshToken) {
        forceLogout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        originalRequest._retry = true
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh({
            onSuccess: (newToken: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`
              }
              resolve(apiClient(originalRequest))
            },
            onFailure: reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken?: string }>>(
          `${API_BASE_URL}/api/identity/refresh`,
          { refreshToken }
        )

        const result = response.data
        if (result.success && result.data?.accessToken) {
          const newAccess = result.data.accessToken
          const newRefresh = result.data.refreshToken || refreshToken
          if (authAdapter) {
            authAdapter.onTokens(newAccess, newRefresh)
          }
          onRefreshed(newAccess)
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccess}`
          }
          return apiClient(originalRequest)
        } else {
          throw new Error('Refresh token không hợp lệ')
        }
      } catch (refreshErr) {
        onRefreshFailed(refreshErr)
        forceLogout()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    // Xử lý ProblemDetails (HTTP 400 validation error)
    if (error.response?.status === 400 && error.response.data) {
      const problem = error.response.data as ProblemDetails
      if (problem.errors && Object.keys(problem.errors).length > 0) {
        const messages = Object.entries(problem.errors)
          .map(([field, errList]) => `${field}: ${errList.join(', ')}`)
          .join('\n')
        return Promise.reject(new Error(messages || problem.title || 'Dữ liệu không hợp lệ'))
      }
      if (problem.title || problem.detail) {
        return Promise.reject(new Error(problem.detail || problem.title || 'Lỗi kiểm tra dữ liệu'))
      }
    }

    // Lỗi từ envelope error nếu có
    const errData = error.response?.data as ApiResponse<unknown> | undefined
    if (errData?.error) {
      return Promise.reject(new Error(errData.error))
    }

    const message = error.message || 'Lỗi kết nối máy chủ'
    return Promise.reject(new Error(message))
  }
)
