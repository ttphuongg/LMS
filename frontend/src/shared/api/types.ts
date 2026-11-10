export type UserRole = 'Reader' | 'Librarian' | 'Admin'

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  error: string | null
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page?: number
  pageSize?: number
  totalPages?: number
}

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Record<string, string[]>
}

export interface CurrentUser {
  id: number
  username: string
  email: string
  fullName: string
  role: UserRole
  phoneNumber?: string
  phone?: string
  address?: string
  dateOfBirth?: string
  status?: string
  avatarUrl?: string
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  keyword?: string
}
