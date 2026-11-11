import type { RouteObject } from 'react-router-dom'
import { MyFinesPage } from './pages/MyFinesPage'
import { AdminFinesPage } from './pages/AdminFinesPage'
import { AdminCreateFinePage } from './pages/AdminCreateFinePage'
import { PrivateRoute } from '@/features/identity'

export const billingRoutes: RouteObject[] = [
  {
    path: '/my-fines',
    element: (
      <PrivateRoute allowedRoles={['Reader', 'Librarian', 'Admin']}>
        <MyFinesPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/fines',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <AdminFinesPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/fines/new',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <AdminCreateFinePage />
      </PrivateRoute>
    ),
  },
]
