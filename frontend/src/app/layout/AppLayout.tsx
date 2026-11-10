import React from 'react'
import { Layout } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { useAuth } from '@/features/identity'
import { ScrollToTop } from '@/shared/components/ScrollToTop'

const { Content } = Layout

export const AppLayout: React.FC = () => {
  const location = useLocation()
  const { isStaff, isAuthenticated, isInitializing } = useAuth()

  // Kiểm tra xem có đang ở trang admin và có quyền staff không
  const isAdminPath = location.pathname.startsWith('/admin')
  const showSidebar = isAdminPath && isStaff
  // Landing chỉ dành cho khách; đã đăng nhập thì '/' là trang chủ trong layout thường (chờ hoàn tất auth hydration)
  const isLandingPage = location.pathname === '/' && !isAuthenticated && !isInitializing

  // Với Landing Page: Không bọc trong cấu trúc lồng thẻ Layout của Ant Design
  // để tránh thuộc tính flex/overflow của ant-layout vô hiệu hóa position: sticky (500vh horizontal scroll)
  if (isLandingPage) {
    return (
      <div
        className="app-landing-root"
        style={{
          minHeight: '100vh',
          background: 'var(--background)',
          overflow: 'visible',
          width: '100%',
          position: 'relative',
        }}
      >
        <ScrollToTop />
        <Header />
        <main style={{ width: '100%', overflow: 'visible', position: 'relative' }}>
          <Outlet />
        </main>
        {!isAdminPath && <Footer />}
      </div>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <ScrollToTop />
      <Header />

      <Layout style={{ background: 'var(--background)' }}>
        {showSidebar && <Sidebar />}

        <Layout
          style={{
            background: 'var(--background)',
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Content
            className="app-layout-content"
            style={{
              padding: 'var(--sp-6) var(--sp-5)',
              maxWidth: showSidebar ? '100%' : 1240,
              width: '100%',
              margin: '0 auto',
              flex: 1,
            }}
          >
            <Outlet />
          </Content>

          {!isAdminPath && <Footer />}
        </Layout>
      </Layout>
    </Layout>
  )
}
