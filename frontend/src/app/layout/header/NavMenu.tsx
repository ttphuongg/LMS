import React from 'react'
import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { ReadOutlined, DollarOutlined, DashboardOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/identity'
import { HEADER_HEIGHT, ADMIN_HOME_PATH } from './constants'
import { useHomeScrollKey } from './useHomeScrollKey'

/** Nhãn menu: chỉ là chữ + gạch chân. Việc điều hướng do Menu onClick xử lý
 *  để cả phần padding quanh chữ cũng bấm được. */
const navLabel = (text: string) => <span className="nav-hover-underline">{text}</span>

/** Hàm chuyển về trang đầu (Logo & Trang chủ). Dùng chung cho Brand và mục "Trang chủ". */
export function useScrollToTop() {
  const navigate = useNavigate()
  const location = useLocation()

  return () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'auto' })
    } else {
      navigate('/')
    }
  }
}

/** Menu ngang. Toàn bộ điều hướng nằm ở handleNavClick (cấp item của Menu).
 *  Khách: menu giới thiệu (cuộn trong landing). Đã đăng nhập: Trang chủ và điều hướng nhanh theo vai trò. */
export const NavMenu: React.FC<{ onHome: () => void }> = ({ onHome }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isStaff, isAdmin } = useAuth()
  const staffHomePath = isAdmin ? ADMIN_HOME_PATH : '/admin/desk'

  // Hàm nhảy đến phần giới thiệu
  const scrollToAbout = () => {
    const go = () => {
      const el = document.getElementById('gioi-thieu')
      if (!el) return
      const y = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' })
    }

    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(go, 150)
    } else {
      go()
    }
  }

  // Hàm nhảy thẳng xuống footer ngay lập tức (bỏ qua hiệu ứng cuộn)
  const jumpToFooter = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' })
  }

  const navMenuItems: MenuProps['items'] = isAuthenticated
    ? isStaff
      ? [
          { key: 'home', label: navLabel('Trang chủ') },
          {
            key: staffHomePath,
            icon: <DashboardOutlined style={{ color: '#B08D3C' }} />,
            label: navLabel(isAdmin ? 'Tổng quan quản trị' : 'Bàn làm việc'),
          },
        ]
      : [
          { key: 'home', label: navLabel('Trang chủ') },
          {
            key: '/my-loans',
            icon: <ReadOutlined style={{ color: '#B08D3C' }} />,
            label: navLabel('Mượn & đặt trước'),
          },
          {
            key: '/my-fines',
            icon: <DollarOutlined style={{ color: '#8C2222' }} />,
            label: navLabel('Tiền phạt'),
          },
        ]
    : [
        { key: 'home', label: navLabel('Trang chủ') },
        { key: 'about', label: navLabel('Giới thiệu') },
        { key: '/books', label: navLabel('Tra cứu') },
        { key: 'contact', label: navLabel('Liên hệ') },
      ]

  const handleNavClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'home':
        onHome()
        break
      case 'about':
        scrollToAbout()
        break
      case 'contact':
        jumpToFooter()
        break
      default:
        navigate(key) // '/books', '/my-loans', '/my-fines', '/admin/dashboard', '/admin/desk'
    }
  }

  // Mục đang active: route thật (kể cả route con) hoặc, ở trang chủ, theo vị trí cuộn
  const path = location.pathname
  const homeKey = useHomeScrollKey(path, isAuthenticated)

  const selectedKey =
    path === '/'
      ? isAuthenticated
        ? 'home'
        : homeKey
      : path.startsWith('/books')
        ? '/books'
        : path.startsWith('/admin')
          ? staffHomePath
          : path
  const selectedKeys = selectedKey ? [selectedKey] : []

  if (navMenuItems.length === 0) return null

  return (
    <div className="library-nav-desktop" style={{ display: 'flex' }}>
      <Menu
        mode="horizontal"
        selectedKeys={selectedKeys}
        items={navMenuItems}
        onClick={handleNavClick}
        style={{
          background: 'transparent',
          borderBottom: 'none',
          fontWeight: 700,
          fontSize: 16,
        }}
        theme="dark"
        disabledOverflow
      />
    </div>
  )
}
