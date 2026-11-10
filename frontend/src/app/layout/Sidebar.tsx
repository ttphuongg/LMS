import React, { useState, useEffect } from 'react'
import { Layout, Menu, Button, Drawer } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  BookOutlined,
  UsergroupAddOutlined,
  TagsOutlined,
  SwapOutlined,
  CheckSquareOutlined,
  HistoryOutlined,
  DollarOutlined,
  UserOutlined,
  PlusCircleOutlined,
  RollbackOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/identity'

const { Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin } = useAuth()

  const deskPath = isAdmin ? '/admin/dashboard' : '/admin/desk'
  const deskLabel = isAdmin ? 'Tổng quan hệ thống' : 'Bàn làm việc'

  const handleNav = (path: string) => {
    if (isMobile) {
      setMobileDrawerOpen(false)
    }
    navigate(path)
  }

  const items: MenuItem[] = [
    {
      key: deskPath,
      icon: <DashboardOutlined />,
      label: deskLabel,
      onClick: () => handleNav(deskPath),
    },
    ...(isAdmin
      ? [
          {
            key: '/admin/users',
            icon: <UserOutlined />,
            label: 'Quản lý người dùng',
            onClick: () => handleNav('/admin/users'),
          },
        ]
      : []),
    {
      key: 'grp-catalog',
      icon: <BookOutlined />,
      label: 'Quản lý mục lục',
      children: [
        {
          key: '/admin/books',
          label: 'Danh mục sách & bản sao',
          onClick: () => handleNav('/admin/books'),
        },
        {
          key: '/admin/books/new',
          icon: <PlusCircleOutlined />,
          label: 'Nhập sách mới',
          onClick: () => handleNav('/admin/books/new'),
        },
        {
          key: '/admin/authors',
          icon: <UsergroupAddOutlined />,
          label: 'Danh mục tác giả',
          onClick: () => handleNav('/admin/authors'),
        },
        {
          key: '/admin/categories',
          icon: <TagsOutlined />,
          label: 'Thể loại phân loại',
          onClick: () => handleNav('/admin/categories'),
        },
        {
          key: '/admin/locations',
          icon: <AppstoreOutlined />,
          label: 'Vị trí kệ sách',
          onClick: () => handleNav('/admin/locations'),
        },
      ],
    },
    {
      key: 'grp-circulation',
      icon: <SwapOutlined />,
      label: 'Lưu thông & Mượn trả',
      children: [
        {
          key: '/admin/loans',
          icon: <HistoryOutlined />,
          label: 'Sổ mượn trả toàn viện',
          onClick: () => handleNav('/admin/loans'),
        },
        {
          key: '/admin/loans/borrow',
          icon: <PlusCircleOutlined />,
          label: 'Lập phiếu mượn tại quầy',
          onClick: () => handleNav('/admin/loans/borrow'),
        },
        {
          key: '/admin/loans/return',
          icon: <RollbackOutlined />,
          label: 'Thu hồi trả sách & Sự cố',
          onClick: () => handleNav('/admin/loans/return'),
        },
        {
          key: '/admin/reservations',
          icon: <ClockCircleOutlined />,
          label: 'Danh sách đặt trước',
          onClick: () => handleNav('/admin/reservations'),
        },
        {
          key: '/admin/renewals',
          icon: <CheckSquareOutlined />,
          label: 'Duyệt yêu cầu gia hạn',
          onClick: () => handleNav('/admin/renewals'),
        },
      ],
    },
    {
      key: 'grp-billing',
      icon: <DollarOutlined />,
      label: 'Quản lý tiền phạt',
      children: [
        {
          key: '/admin/fines',
          label: 'Danh sách phiếu phạt',
          onClick: () => handleNav('/admin/fines'),
        },
        {
          key: '/admin/fines/new',
          icon: <PlusCircleOutlined />,
          label: 'Lập phiếu phạt mới',
          onClick: () => handleNav('/admin/fines/new'),
        },
      ],
    },
  ]

  // Tìm submenu cha để auto-open
  const getOpenKeys = () => {
    if (
      location.pathname.startsWith('/admin/books') ||
      location.pathname.startsWith('/admin/authors') ||
      location.pathname.startsWith('/admin/categories') ||
      location.pathname.startsWith('/admin/locations')
    ) {
      return ['grp-catalog']
    }
    if (
      location.pathname.startsWith('/admin/loans') ||
      location.pathname.startsWith('/admin/reservations') ||
      location.pathname.startsWith('/admin/renewals')
    ) {
      return ['grp-circulation']
    }
    if (location.pathname.startsWith('/admin/fines')) {
      return ['grp-billing']
    }
    return []
  }

  // Khóa mục đang được chọn (đồng bộ giữa /admin/desk và /admin/dashboard theo vai trò)
  const selectedKey = (() => {
    if (location.pathname === '/admin/desk' && isAdmin) return deskPath
    if (location.pathname === '/admin/dashboard' && !isAdmin) return deskPath
    return location.pathname
  })()

  const menuContent = (
    <>
      <div
        style={{
          padding: 'var(--sp-4)',
          color: 'var(--card)',
          borderBottom: '1px solid rgba(251, 247, 236, 0.1)',
          display: !isMobile && collapsed ? 'none' : 'block',
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.06em' }}>
          KHU VỰC NGHIỆP VỤ
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-serif)' }}>
          {isAdmin ? 'Quản trị hệ thống' : 'Bàn làm việc Thủ thư'}
        </div>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={getOpenKeys()}
        items={items}
        style={{
          background: 'var(--primary)',
          borderRight: 0,
          marginTop: 'var(--sp-2)',
        }}
      />
    </>
  )

  // Trên Mobile (< 768px): Render Drawer trượt kèm FAB trigger (RESP-002)
  if (isMobile) {
    return (
      <>
        {/* Nút Floating Action Button mở menu nghiệp vụ trên mobile */}
        <Button
          type="primary"
          shape="round"
          icon={<AppstoreOutlined />}
          onClick={() => setMobileDrawerOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 20,
            zIndex: 999,
            height: 44,
            padding: '0 18px',
            background: 'var(--primary)',
            borderColor: 'var(--accent)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            fontWeight: 600,
            fontSize: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Menu nghiệp vụ
        </Button>

        {/* Drawer trượt từ bên trái chứa toàn bộ menu nghiệp vụ */}
        <Drawer
          title={
            <div style={{ color: '#FBF7EC', fontFamily: 'var(--font-serif)', fontSize: 16 }}>
              {isAdmin ? 'Menu Quản Trị Hệ Thống' : 'Bàn Làm Việc Thủ Thư'}
            </div>
          }
          placement="left"
          size={Math.min(280, typeof window !== 'undefined' ? window.innerWidth - 40 : 280)}
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          styles={{
            header: { background: '#14281f', borderBottom: '1px solid rgba(251,247,236,0.1)' },
            body: { background: 'var(--primary)', padding: 0 },
          }}
        >
          {menuContent}
        </Drawer>
      </>
    )
  }

  // Trên Desktop (>= 768px): Giữ nguyên Sider truyền thống với tính năng thu gọn
  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={250}
      style={{
        background: 'var(--primary)',
        minHeight: 'calc(100vh - 64px)',
        borderRight: '1px solid var(--border)',
      }}
      breakpoint="lg"
      theme="dark"
    >
      {menuContent}
    </Sider>
  )
}
