import type { RouteObject } from 'react-router-dom'
import { NotificationsPage } from './pages/NotificationsPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { DashboardEntry } from './pages/DashboardEntry'
import { PrivateRoute } from '@/features/identity'

export const notificationRoutes: RouteObject[] = [
  {
    path: '/notifications',
    element: (
      <PrivateRoute>
        <NotificationsPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <PrivateRoute allowedRoles={['Admin']}>
        <AdminUsersPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/dashboard',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <DashboardEntry />
      </PrivateRoute>
    ),
  },
]
