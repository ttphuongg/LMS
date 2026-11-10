import React, { useState } from 'react'
import { Button, Space } from 'antd'
import { useNavigate } from 'react-router-dom'

/** Nút Đăng nhập / Đăng ký thẻ (có hiệu ứng hover) cho khách. */
export const GuestAuthButtons: React.FC = () => {
  const navigate = useNavigate()
  // State tạo hiệu ứng hover mượt mà cho các nút bấm góc phải
  const [isLoginHovered, setIsLoginHovered] = useState(false)
  const [isRegisterHovered, setIsRegisterHovered] = useState(false)

  return (
    <Space size={8}>
      <Button
        type="text"
        onClick={() => navigate('/login')}
        onMouseEnter={() => setIsLoginHovered(true)}
        onMouseLeave={() => setIsLoginHovered(false)}
        style={{
          color: isLoginHovered ? '#FBF7EC' : '#B08D3C',
          backgroundColor: isLoginHovered ? 'rgba(176, 141, 60, 0.1)' : 'transparent',
          fontWeight: 600,
          borderRadius: 'var(--radius)',
          transition: 'all 0.3s ease',
          padding: '4px 10px',
        }}
      >
        Đăng nhập
      </Button>
      <Button
        type="primary"
        className="guest-auth-register-btn"
        onClick={() => navigate('/register')}
        onMouseEnter={() => setIsRegisterHovered(true)}
        onMouseLeave={() => setIsRegisterHovered(false)}
        style={{
          background: isRegisterHovered ? '#A62929' : '#8C2222',
          borderColor: isRegisterHovered ? '#8C2222' : '#751919',
          color: '#FBF7EC',
          fontWeight: 600,
          borderRadius: 'var(--radius)',
          boxShadow: isRegisterHovered
            ? '0 4px 8px rgba(140, 34, 34, 0.6)'
            : '0 2px 4px rgba(140, 34, 34, 0.4)',
          transform: isRegisterHovered ? 'translateY(-1px)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        Đăng ký thẻ
      </Button>
    </Space>
  )
}
