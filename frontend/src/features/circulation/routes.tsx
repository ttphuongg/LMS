import type { RouteObject } from 'react-router-dom'
import { MyLoansPage } from './pages/MyLoansPage'
import { AdminLoansPage } from './pages/AdminLoansPage'
import { AdminBorrowPage } from './pages/AdminBorrowPage'
import { AdminReturnPage } from './pages/AdminReturnPage'
import { AdminReservationsPage } from './pages/AdminReservationsPage'
import { AdminRenewalsPage } from './pages/AdminRenewalsPage'
import { LibrarianDashboardPage } from './pages/LibrarianDashboardPage'
import { PrivateRoute } from '@/features/identity'

export const circulationRoutes: RouteObject[] = [
  {
    path: '/admin/desk',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <LibrarianDashboardPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/my-loans',
    element: (
      <PrivateRoute allowedRoles={['Reader', 'Librarian', 'Admin']}>
        <MyLoansPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/loans',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <AdminLoansPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/loans/borrow',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <AdminBorrowPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/loans/return',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <AdminReturnPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/reservations',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <AdminReservationsPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/renewals',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <AdminRenewalsPage />
      </PrivateRoute>
    ),
  },
]
