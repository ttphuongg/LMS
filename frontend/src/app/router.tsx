import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { ForbiddenPage } from '@/shared/pages/ForbiddenPage'
import { NotFoundPage } from '@/shared/pages/NotFoundPage'
import { RootGate } from './RootGate'

// Gộp các routes từ từng feature module độc lập  index.ts
import { identityRoutes } from '@/features/identity'
import { catalogRoutes } from '@/features/catalog'
import { circulationRoutes } from '@/features/circulation'
import { billingRoutes } from '@/features/billing'
import { notificationRoutes } from '@/features/notifications'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // '/' : khách -> Landing, đã đăng nhập -> Trang chủ (xem RootGate)
      { path: '/', element: <RootGate /> },
      ...identityRoutes,
      ...catalogRoutes,
      ...circulationRoutes,
      ...billingRoutes,
      ...notificationRoutes,
      {
        path: '/403',
        element: <ForbiddenPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
