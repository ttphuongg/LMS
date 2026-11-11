export type AccountRole = 'Reader' | 'Librarian' | 'Admin' | 0 | 1 | 2
export type AccountStatus = 'Active' | 'Locked' | 'Inactive'

export interface NotificationItem {
  id: string
  title: string
  content?: string // Tên trường chính xác từ Backend NotificationDto
  message: string  // Tương thích với UI component hiện tại
  createdAt: string
  isRead: boolean
  type?: string
  referenceId?: string
}

export interface UserManagementItem {
  id: string
  username?: string
  fullName: string
  email: string
  phone?: string
  phoneNumber?: string
  role: 'Reader' | 'Librarian' | 'Admin'
  roleId?: number
  status?: AccountStatus | string
  isActive: boolean
  createdAt: string
  borrowedBooksCount?: number
}

export interface DashboardStats {
  totalBooks: number
  totalBookTitles?: number
  totalActiveLoans: number
  totalOverdueLoans: number
  totalUsers: number
  pendingReservations: number
  todayLoans: number
  todayReturns: number
  unpaidFinesTotal: number
  pendingRenewals?: number
  readyReservations?: number
  waitingReservations?: number
  dueTodayLoans?: number
}
