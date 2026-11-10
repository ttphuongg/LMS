import { useEffect, useState } from 'react'
import axios from 'axios'
import type { CurrentUser, UserRole, ApiResponse } from '@/shared/api/types'
import { setAuthAdapter, API_BASE_URL } from '@/shared/api/client'
import type { LoginResponse } from './types'

const ACCESS_TOKEN_KEY = 'lms_access_token'
const REFRESH_TOKEN_KEY = 'lms_refresh_token'
const USER_KEY = 'lms_current_user'
const AUTH_CHANNEL_NAME = 'lms_auth_sync'

let memoryAccessToken: string | null = typeof sessionStorage !== 'undefined'
  ? sessionStorage.getItem(ACCESS_TOKEN_KEY)
  : null

type Listener = () => void
const listeners = new Set<Listener>()
const notify = () => listeners.forEach((l) => l())

// Cache kết quả parse để `user` giữ nguyên reference giữa các lần render
let cachedUserRaw: string | null = null
let cachedUser: CurrentUser | null = null

export const getAccessToken = (): string | null => {
  if (!memoryAccessToken && typeof sessionStorage !== 'undefined') {
    memoryAccessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  }
  return memoryAccessToken
}

export const getRefreshToken = (): string | null => {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

const storeTokens = (accessToken: string, refreshToken?: string) => {
  memoryAccessToken = accessToken
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }
  if (refreshToken && typeof localStorage !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

const storeUser = (user: CurrentUser | null) => {
  cachedUserRaw = user ? JSON.stringify(user) : null
  cachedUser = user
  if (typeof sessionStorage !== 'undefined') {
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      sessionStorage.removeItem(USER_KEY)
    }
  }
}

export const getCurrentUser = (): CurrentUser | null => {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(USER_KEY)
  if (raw === cachedUserRaw) return cachedUser
  cachedUserRaw = raw
  if (!raw) {
    cachedUser = null
    return null
  }
  try {
    cachedUser = JSON.parse(raw) as CurrentUser
  } catch {
    cachedUser = null
  }
  return cachedUser
}

export const setCurrentUser = (user: CurrentUser | null) => {
  storeUser(user)
  notify()
}

// ── Multi-tab Coordination qua BroadcastChannel ─────────────────────────────
let authChannel: BroadcastChannel | null = null
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME)
    authChannel.onmessage = (event) => {
      const data = event.data
      if (!data || typeof data !== 'object') return
      if (data.type === 'LOGOUT') {
        clearAuth(false)
      } else if (data.type === 'AUTH_RESTORED' && data.accessToken && data.user) {
        setSession(data.user, data.accessToken, data.refreshToken, false)
        isInitializing = false
      }
    }
  } catch {
    // Không hỗ trợ BroadcastChannel hoặc bị hạn chế
  }
}

const broadcastAuth = (message: {
  type: 'LOGOUT' | 'AUTH_RESTORED'
  accessToken?: string
  refreshToken?: string
  user?: CurrentUser
}) => {
  if (authChannel) {
    try {
      authChannel.postMessage(message)
    } catch {
      // Ignored
    }
  }
}

/** Lưu token + user cùng lúc, chỉ thông báo một lần (tránh render trung gian có token mà chưa có user) */
const setSession = (user: CurrentUser, accessToken: string, refreshToken?: string, broadcast = true) => {
  storeTokens(accessToken, refreshToken)
  storeUser(user)
  isInitializing = false
  if (broadcast) {
    broadcastAuth({ type: 'AUTH_RESTORED', accessToken, refreshToken, user })
  }
  notify()
}

export const setTokens = (accessToken: string, refreshToken?: string) => {
  storeTokens(accessToken, refreshToken)
  const user = getCurrentUser()
  if (user) {
    broadcastAuth({ type: 'AUTH_RESTORED', accessToken, refreshToken, user })
  }
  notify()
}

export const clearAuth = (broadcast = true) => {
  memoryAccessToken = null
  cachedUserRaw = null
  cachedUser = null
  isInitializing = false
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
  if (broadcast) {
    broadcastAuth({ type: 'LOGOUT' })
  }
  notify()
}

// ── Auth Hydration & Session Restoration (ISSUE-AUTH-001) ─────────────────────
// Trạng thái khởi tạo: true nếu chưa có Access Token trong sessionStorage nhưng CÓ Refresh Token trong localStorage
let isInitializing = !getAccessToken() && Boolean(getRefreshToken())
let restorePromise: Promise<boolean> | null = null

export const isAuthInitializing = () => isInitializing

/** Khôi phục phiên đăng nhập từ Refresh Token khi mở tab mới */
export const restoreSession = async (): Promise<boolean> => {
  // Trường hợp B: Tab hiện tại đã có phiên đăng nhập hợp lệ
  const existingToken = getAccessToken()
  const existingUser = getCurrentUser()
  if (existingToken && existingUser) {
    if (isInitializing) {
      isInitializing = false
      notify()
    }
    return true
  }

  // Trường hợp A3: Không có Refresh Token trong localStorage -> Không làm gì
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    if (isInitializing) {
      isInitializing = false
      notify()
    }
    return false
  }

  // Trường hợp C: Deduplication — nếu đang có request in-flight, tái sử dụng Promise (chống race condition / StrictMode)
  if (restorePromise) {
    return restorePromise
  }

  restorePromise = (async () => {
    isInitializing = true
    try {
      // Gọi trực tiếp axios POST /api/identity/refresh để tránh vòng lặp interceptor 401
      const res = await axios.post<ApiResponse<LoginResponse>>(
        `${API_BASE_URL}/api/identity/refresh`,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      )

      const envelope = res.data
      if (envelope && envelope.success && envelope.data && envelope.data.accessToken) {
        const d = envelope.data
        const user: CurrentUser = {
          id: d.accountId,
          username: d.username,
          fullName: d.fullName,
          email: d.email,
          role: d.role as UserRole,
        }
        // Backend thực hiện Token Rotation: cập nhật Access Token mới vào sessionStorage và Refresh Token mới vào localStorage
        setSession(user, d.accessToken, d.refreshToken)
        return true
      } else {
        // Refresh token không hợp lệ hoặc đã bị thu hồi -> Dọn sạch phiên
        clearAuth()
        return false
      }
    } catch {
      // Mất kết nối mạng hoặc lỗi server -> Dọn sạch phiên để không treo Loading
      clearAuth()
      return false
    } finally {
      isInitializing = false
      restorePromise = null
      notify()
    }
  })()

  return restorePromise
}

export const initAuthAdapter = () => {
  setAuthAdapter({
    getAccessToken,
    getRefreshToken,
    onTokens: (accessToken, refreshToken) => setTokens(accessToken, refreshToken),
    onLogout: () => clearAuth(),
  })
  // Tự động kích hoạt khôi phục phiên nếu tab mới có refresh token
  if (isInitializing) {
    restoreSession()
  }
}

export const parseJwt = (token: string): Record<string, unknown> | null => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export const extractRoleFromToken = (token: string): UserRole => {
  const payload = parseJwt(token)
  if (!payload) return 'Reader'
  const role =
    payload['role'] ||
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
  if (role === 'Admin') return 'Admin'
  if (role === 'Librarian') return 'Librarian'
  return 'Reader'
}

/** Hook để component tự re-render khi Auth thay đổi */
export const useAuth = () => {
  const [, setTick] = useState(0)

  useEffect(() => {
    const listener = () => setTick((t) => t + 1)
    listeners.add(listener)

    // Khởi động restore nếu chưa có ai kích hoạt
    if (isInitializing && !restorePromise) {
      restoreSession()
    }

    return () => {
      listeners.delete(listener)
    }
  }, [])

  const token = getAccessToken()
  const user = getCurrentUser()
  const isAuthenticated = Boolean(token && user)
  const isStaff = user?.role === 'Librarian' || user?.role === 'Admin'
  const isAdmin = user?.role === 'Admin'
  const isReader = user?.role === 'Reader'

  return {
    isAuthenticated,
    isInitializing,
    user,
    token,
    isStaff,
    isAdmin,
    isReader,
    setAuth: (u: CurrentUser, access: string, refresh?: string) => {
      setSession(u, access, refresh)
    },
    logout: () => {
      clearAuth()
    },
    restoreSession,
  }
}
