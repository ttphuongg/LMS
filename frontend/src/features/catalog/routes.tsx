import type { RouteObject } from 'react-router-dom'
import { BookListPage } from './pages/BookListPage'
import { BookDetailPage } from './pages/BookDetailPage'
import { AdminBookListPage } from './pages/AdminBookListPage'
import { AdminBookFormPage } from './pages/AdminBookFormPage'
import { AdminAuthorsPage } from './pages/AdminAuthorsPage'
import { AdminCategoriesPage } from './pages/AdminCategoriesPage'
import { AdminLocationsPage } from './pages/AdminLocationsPage'
import { PrivateRoute } from '@/features/identity'

export const catalogRoutes: RouteObject[] = [
  {
    path: '/books',
    element: <BookListPage />,
  },
  {
    path: '/books/:id',
    element: <BookDetailPage />,
  },
  {
    path: '/admin/books',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <AdminBookListPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/books/new',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <AdminBookFormPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/books/:id/edit',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <AdminBookFormPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/authors',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <AdminAuthorsPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/categories',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <AdminCategoriesPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin/locations',
    element: (
      <PrivateRoute allowedRoles={['Librarian', 'Admin']}>
        <AdminLocationsPage />
      </PrivateRoute>
    ),
  },
]
