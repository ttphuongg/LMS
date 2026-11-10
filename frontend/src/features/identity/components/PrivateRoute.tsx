import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../authStore'
import type { UserRole } from '@/shared/api/types'
import { LoadingState } from '@/shared/components/LoadingState'

interface PrivateRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isInitializing, user } = useAuth()
  const location = useLocation()

  // Không redirect về /login khi đang trong quá trình khôi phục phiên (ISSUE-AUTH-001)
  if (isInitializing) {
    return <LoadingState tip="Đang kiểm tra phiên đăng nhập..." minHeight="60vh" />
  }

  if (!isAuthenticated || !user) {
    // Chưa đăng nhập -> về trang /login và lưu redirect path
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // Đã đăng nhập nhưng không có quyền -> 403
      return <Navigate to="/403" replace />
    }
  }

  return <>{children}</>
}
