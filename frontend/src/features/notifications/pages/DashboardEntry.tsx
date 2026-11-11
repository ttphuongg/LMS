import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/identity'
import { AdminDashboardPage } from './AdminDashboardPage'

/** /admin/dashboard: Admin thấy tổng quan hệ thống, Thủ thư được chuyển hướng về Bàn làm việc (/admin/desk). */
export const DashboardEntry: React.FC = () => {
  const { isAdmin } = useAuth()
  return isAdmin ? <AdminDashboardPage /> : <Navigate to="/admin/desk" replace />
}
