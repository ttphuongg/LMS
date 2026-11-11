import React, { useState } from 'react'
import { Layout, Button, Drawer, Space, Divider } from 'antd'
import {
  MenuOutlined,
  ReadOutlined,
  DollarOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  LockOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/identity'
import { NotificationBell } from '@/features/notifications'
import { HeaderSearch } from './HeaderSearch'
import { HeaderBrand } from './header/HeaderBrand'
import { NavMenu, useScrollToTop } from './header/NavMenu'
import { UserMenu } from './header/UserMenu'
import { GuestAuthButtons } from './header/GuestAuthButtons'
import { HEADER_HEIGHT } from './header/constants'
import { SpineTag } from '@/shared/components/SpineTag'
import './header/header.css'

const { Header: AntHeader } = Layout

export const Header: React.FC = () => {
  const { user, isAuthenticated, isStaff, isAdmin, logout } = useAuth()
  const scrollToTop = useScrollToTop()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const handleMobileNav = (path: string, action?: () => void) => {
    setMobileDrawerOpen(false)
    if (action) {
      action()
    } else {
      navigate(path)
    }
  }

  const handleScrollToAbout = () => {
    setMobileDrawerOpen(false)
    const go = () => {
      const el = document.getElementById('gioi-thieu')
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    }
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(go, 150)
    } else {
      go()
    }
  }

  const handleJumpToFooter = () => {
    setMobileDrawerOpen(false)
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' })
  }

  return (
    <>
      <AntHeader
        className="library-header"
        style={{
          background: '#1F3A2E',
          borderBottom: '1px solid #14281f',
          padding: '0 var(--sp-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          height: HEADER_HEIGHT,
          lineHeight: 'normal',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          gap: '8px',
          width: '100%',
          maxWidth: '100vw',
          overflow: 'hidden',
        }}
      >
        {/* Brand Logo */}
        <HeaderBrand onClick={scrollToTop} />

        {/* Center: Desktop Navigation Menu */}
        <div
          className="library-nav-desktop"
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
            minWidth: 0,
          }}
        >
          <NavMenu onHome={scrollToTop} />
          {isAuthenticated && <HeaderSearch />}
        </div>

        {/* Right: Notifications, User profile & Mobile Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {isAuthenticated && <NotificationBell />}
          {isAuthenticated && user ? <UserMenu /> : <GuestAuthButtons />}

          {/* Mobile Navigation Trigger Button (RESP-001) */}
          <Button
            type="text"
            className="library-header-mobile-trigger"
            icon={<MenuOutlined style={{ fontSize: 18, color: '#FBF7EC' }} />}
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Menu điều hướng di động"
            style={{
              padding: '4px 8px',
              height: 36,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(251, 247, 236, 0.2)',
            }}
          />
        </div>
      </AntHeader>

      {/* Mobile Navigation Drawer (RESP-001) */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HeaderBrand onClick={() => handleMobileNav('/', scrollToTop)} />
          </div>
        }
        placement="right"
        size={Math.min(300, typeof window !== 'undefined' ? window.innerWidth - 30 : 280)}
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        styles={{
          header: { background: '#14281f', borderBottom: '1px solid rgba(251,247,236,0.1)' },
          body: { background: '#1F3A2E', color: '#FBF7EC', padding: '16px 12px' },
        }}
      >
        {/* User Info (if authenticated) */}
        {isAuthenticated && user && (
          <div
            style={{
              padding: '12px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 'var(--radius)',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 15, color: '#FBF7EC' }}>{user.fullName}</div>
            <div style={{ fontSize: 12, color: 'rgba(251,247,236,0.65)', marginBottom: 6 }}>{user.email}</div>
            <SpineTag variant={user.role === 'Admin' ? 'danger' : user.role === 'Librarian' ? 'primary' : 'neutral'}>
              {user.role === 'Admin' ? 'Quản trị viên' : user.role === 'Librarian' ? 'Thủ thư' : 'Bạn đọc'}
            </SpineTag>
          </div>
        )}

        {/* Navigation Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Button
            type="text"
            block
            icon={<HomeOutlined />}
            onClick={() => handleMobileNav('/', scrollToTop)}
            style={{ textAlign: 'left', color: '#FBF7EC', height: 42, fontSize: 15 }}
          >
            Trang chủ
          </Button>

          {isAuthenticated ? (
            <>
              {isStaff ? (
                <Button
                  type="text"
                  block
                  icon={<DashboardOutlined />}
                  onClick={() => handleMobileNav(isAdmin ? '/admin/dashboard' : '/admin/desk')}
                  style={{ textAlign: 'left', color: '#B08D3C', height: 42, fontSize: 15 }}
                >
                  {isAdmin ? 'Tổng quan quản trị' : 'Bàn làm việc thủ thư'}
                </Button>
              ) : (
                <>
                  <Button
                    type="text"
                    block
                    icon={<ReadOutlined style={{ color: '#B08D3C' }} />}
                    onClick={() => handleMobileNav('/my-loans')}
                    style={{ textAlign: 'left', color: '#FBF7EC', height: 42, fontSize: 15 }}
                  >
                    Mượn & đặt trước
                  </Button>
                  <Button
                    type="text"
                    block
                    icon={<DollarOutlined style={{ color: '#8C2222' }} />}
                    onClick={() => handleMobileNav('/my-fines')}
                    style={{ textAlign: 'left', color: '#FBF7EC', height: 42, fontSize: 15 }}
                  >
                    Tiền phạt của tôi
                  </Button>
                  <Button
                    type="text"
                    block
                    icon={<BookOutlined />}
                    onClick={() => handleMobileNav('/books')}
                    style={{ textAlign: 'left', color: '#FBF7EC', height: 42, fontSize: 15 }}
                  >
                    Tra cứu danh mục sách
                  </Button>
                </>
              )}

              <Divider style={{ borderColor: 'rgba(251,247,236,0.1)', margin: '8px 0' }} />

              <Button
                type="text"
                block
                icon={<UserOutlined />}
                onClick={() => handleMobileNav('/profile')}
                style={{ textAlign: 'left', color: '#FBF7EC', height: 42, fontSize: 15 }}
              >
                Hồ sơ cá nhân
              </Button>
              <Button
                type="text"
                block
                icon={<LockOutlined />}
                onClick={() => handleMobileNav('/change-password')}
                style={{ textAlign: 'left', color: '#FBF7EC', height: 42, fontSize: 15 }}
              >
                Đổi mật khẩu
              </Button>
              <Button
                type="text"
                danger
                block
                icon={<LogoutOutlined />}
                onClick={() => {
                  setMobileDrawerOpen(false)
                  logout()
                  navigate('/')
                }}
                style={{ textAlign: 'left', height: 42, fontSize: 15, marginTop: 8 }}
              >
                Đăng xuất
              </Button>
            </>
          ) : (
            <>
              <Button
                type="text"
                block
                onClick={handleScrollToAbout}
                style={{ textAlign: 'left', color: '#FBF7EC', height: 42, fontSize: 15 }}
              >
                Giới thiệu thư viện
              </Button>
              <Button
                type="text"
                block
                icon={<BookOutlined />}
                onClick={() => handleMobileNav('/books')}
                style={{ textAlign: 'left', color: '#FBF7EC', height: 42, fontSize: 15 }}
              >
                Tra cứu mục lục sách
              </Button>
              <Button
                type="text"
                block
                onClick={handleJumpToFooter}
                style={{ textAlign: 'left', color: '#FBF7EC', height: 42, fontSize: 15 }}
              >
                Liên hệ & Giờ mở cửa
              </Button>

              <Divider style={{ borderColor: 'rgba(251,247,236,0.1)', margin: '12px 0' }} />

              <Space orientation="vertical" style={{ width: '100%' }} size={10}>
                <Button
                  type="primary"
                  block
                  onClick={() => handleMobileNav('/register')}
                  style={{
                    background: '#8C2222',
                    borderColor: '#751919',
                    height: 40,
                    fontWeight: 600,
                  }}
                >
                  Đăng ký thẻ bạn đọc
                </Button>
                <Button
                  block
                  onClick={() => handleMobileNav('/login')}
                  style={{
                    color: '#B08D3C',
                    borderColor: '#B08D3C',
                    background: 'transparent',
                    height: 40,
                    fontWeight: 600,
                  }}
                >
                  Đăng nhập
                </Button>
              </Space>
            </>
          )}
        </div>
      </Drawer>
    </>
  )
}
