import React, { Suspense, lazy } from 'react'
import { useAuth } from '@/features/identity'
import { LoadingState } from '@/shared/components/LoadingState'

const LandingPage = lazy(() => import('@/features/landing').then((m) => ({ default: m.LandingPage })))
const HomePage = lazy(() => import('@/features/home').then((m) => ({ default: m.HomePage })))

/** Route "/": khách -> landing, đã đăng nhập (mọi vai trò) -> trang chủ. */
export const RootGate: React.FC = () => {
  const { isAuthenticated, isInitializing } = useAuth()

  // Chờ khôi phục phiên trước khi quyết định điều hướng (ISSUE-AUTH-001)
  if (isInitializing) {
    return <LoadingState tip="Đang khôi phục phiên làm việc..." minHeight="60vh" />
  }

  return (
    <Suspense fallback={<LoadingState />}>
      {isAuthenticated ? <HomePage /> : <LandingPage />}
    </Suspense>
  )
}
