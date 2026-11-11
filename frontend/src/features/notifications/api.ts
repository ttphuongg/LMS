/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '@/shared/api/client'
import type { ApiResponse, PagedResult } from '@/shared/api/types'
import type { NotificationItem, UserManagementItem, DashboardStats } from './types'

export const notificationsApi = {
  // Lấy thông báo của người dùng hiện tại
  getMyNotifications: async (): Promise<NotificationItem[]> => {
    // BE GetMyNotificationsRequest returns ApiResponse<List<NotificationDto>>
    // NotificationDto(long Id, string Title, string Content, string Type, bool IsRead, DateTime CreatedAt)
    const res = await apiClient.get<ApiResponse<any[]>>('/api/notifications/my-notifications')
    const list = res.data.data || []
    return list.map((n: any) => ({
      id: String(n.id),
      title: n.title,
      content: n.content,
      message: n.content || n.title, // Map content sang message cho giao diện
      createdAt: n.createdAt,
      isRead: Boolean(n.isRead),
      type: n.type?.toLowerCase() || 'system',
    }))
  },

  // Đánh dấu đã đọc
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch<ApiResponse>(`/api/notifications/${id}/read`)
  },

  // Lấy danh sách người dùng (Admin)
  getUsers: async (params: { keyword?: string; role?: string | number; page?: number; pageSize?: number }): Promise<PagedResult<UserManagementItem>> => {
    const roleMap: Record<string, number> = { Reader: 0, Librarian: 1, Admin: 2 }
    const queryParams: Record<string, unknown> = {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    }
    if (params.keyword && params.keyword.trim()) queryParams.keyword = params.keyword.trim()
    if (params.role !== undefined && params.role !== null && params.role !== '' && params.role !== 'ALL') {
      const roleNum = typeof params.role === 'number'
        ? params.role
        : (roleMap[params.role] ?? (isNaN(Number(params.role)) ? undefined : Number(params.role)))
      if (roleNum !== undefined && [0, 1, 2].includes(roleNum)) {
        queryParams.role = roleNum
      }
    }

    // BE GetUsersRequest returns ApiResponse<GetUsersResult> { Items: List<UserSummary>, TotalCount: int }
    const res = await apiClient.get<ApiResponse<{ items: any[]; totalCount: number }>>('/api/identity/users', { params: queryParams })
    const data = res.data.data
    const items: UserManagementItem[] = (data?.items || []).map((u: any) => ({
      id: String(u.id),
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      phone: u.phoneNumber || '',
      phoneNumber: u.phoneNumber || undefined,
      role: u.role,
      roleId: roleMap[u.role],
      status: u.status,
      isActive: u.status === 'Active', // Map status enum sang boolean cho công tắc Switch trên UI
      createdAt: u.createdAt || '',
    }))

    return {
      items,
      totalCount: data?.totalCount || 0,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      totalPages: Math.ceil((data?.totalCount || 0) / (params.pageSize || 10)) || 1,
    }
  },

  // Đổi vai trò người dùng (Admin)
  updateUserRole: async (id: string, role: 'Reader' | 'Librarian' | 'Admin'): Promise<void> => {
    // BE ChangeRoleBody(AccountRole? Role, AccountRole? NewRole)
    await apiClient.patch<ApiResponse>(`/api/identity/users/${id}/role`, {
      role,
      newRole: role,
    })
  },

  // Đổi trạng thái khóa/mở người dùng (Admin)
  updateUserStatus: async (id: string, isActive: boolean): Promise<void> => {
    // BE ChangeStatusBody(AccountStatus? Status, AccountStatus? NewStatus)
    const statusStr = isActive ? 'Active' : 'Locked'
    await apiClient.patch<ApiResponse>(`/api/identity/users/${id}/status`, {
      status: statusStr,
      newStatus: statusStr,
    })
  },

  // Thống kê Dashboard tổng hợp từ Backend (GET /api/dashboard/stats - StaffOnly)
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<ApiResponse<Partial<DashboardStats>>>('/api/dashboard/stats')
    const data = res.data.data
    if (!data) {
      throw new Error('Dữ liệu thống kê Dashboard không hợp lệ')
    }

    return {
      totalBooks: Number(data.totalBooks ?? 0),
      totalBookTitles: Number(data.totalBookTitles ?? 0),
      totalActiveLoans: Number(data.totalActiveLoans ?? 0),
      totalOverdueLoans: Number(data.totalOverdueLoans ?? 0),
      totalUsers: Number(data.totalUsers ?? 0),
      pendingReservations: Number(data.pendingReservations ?? 0),
      todayLoans: Number(data.todayLoans ?? 0),
      todayReturns: Number(data.todayReturns ?? 0),
      unpaidFinesTotal: Number(data.unpaidFinesTotal ?? 0),
      pendingRenewals: Number(data.pendingRenewals ?? 0),
      readyReservations: Number(data.readyReservations ?? 0),
      waitingReservations: Number(data.waitingReservations ?? 0),
      dueTodayLoans: Number(data.dueTodayLoans ?? 0),
    }
  },
}
