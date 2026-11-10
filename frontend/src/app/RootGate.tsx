import React, { Suspense, lazy } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/identity'
import { LoadingState } from '@/shared/components/LoadingState'

const LandingPage = lazy(() => import('@/features/landing').then((m) => ({ default: m.LandingPage })))
const HomePage = lazy(() => import('@/features/home').then((m) => ({ default: m.HomePage })))

/** Route "/": khách -> landing, bạn đọc -> trang chủ, thủ thư/admin -> khu quản trị. */
export const RootGate: React.FC = () => {
  const { isAuthenticated, isInitializing, isStaff, isAdmin } = useAuth()

  // Chờ khôi phục phiên trước khi quyết định điều hướng (ISSUE-AUTH-001)
  if (isInitializing) {
    return <LoadingState tip="Đang khôi phục phiên làm việc..." minHeight="60vh" />
  }

  // Thủ thư vào thẳng bàn làm việc, admin vào dashboard tổng quan
  if (isAuthenticated && isStaff) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/admin/desk'} replace />
  }

  return (
    <Suspense fallback={<LoadingState />}>
      {isAuthenticated ? <HomePage /> : <LandingPage />}
    </Suspense>
  )
}
