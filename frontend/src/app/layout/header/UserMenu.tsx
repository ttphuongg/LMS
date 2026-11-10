import React from 'react'
import { Avatar, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { UserOutlined, KeyOutlined, LogoutOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/identity'
import { mutedText12Style, strongTextStyle } from '@/shared/styles/ui'

/** Avatar + dropdown tài khoản của người đã đăng nhập. */
export const UserMenu: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: 'var(--sp-1) 0' }}>
          <div style={strongTextStyle}>{user?.fullName}</div>
          <div style={mutedText12Style}>{user?.email}</div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => navigate('/change-password'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Đăng xuất',
      onClick: () => {
        logout()
        navigate('/')
      },
    },
  ]

  return (
    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
      <div
        role="button"
        tabIndex={0}
        aria-label="Tài khoản của tôi"
        title="Tài khoản của tôi"
        onClick={() => navigate('/profile')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            navigate('/profile')
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-2)',
          cursor: 'pointer',
          padding: 'var(--sp-1) var(--sp-2)',
          borderRadius: 'var(--radius)',
          border: '1px solid transparent',
        }}
      >
        <Avatar
          style={{
            backgroundColor: '#B08D3C',
            color: '#1F1108',
            fontWeight: 600,
            border: '1px solid #FBF7EC',
          }}
        >
          {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
        </Avatar>
      </div>
    </Dropdown>
  )
}
