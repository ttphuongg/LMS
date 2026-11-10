import type { RouteObject } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { PrivateRoute } from './components/PrivateRoute'

export const identityRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/profile',
    element: (
      <PrivateRoute>
        <ProfilePage />
      </PrivateRoute>
    ),
  },
  {
    path: '/change-password',
    element: (
      <PrivateRoute>
        <ChangePasswordPage />
      </PrivateRoute>
    ),
  },
]
