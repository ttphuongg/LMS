import React from 'react'
import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { LockOutlined } from '@ant-design/icons'
import { primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-6)',
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--destructive)',
          borderRadius: 'var(--radius)',
          padding: 'var(--sp-10) var(--sp-8)',
          maxWidth: 520,
          textAlign: 'center',
        }}
      >
        <Result
          icon={<LockOutlined style={{ color: 'var(--destructive)', fontSize: 56 }} />}
          title={
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 28,
                color: 'var(--destructive)',
                fontWeight: 600,
              }}
            >
              403 - Giới hạn quyền truy cập
            </span>
          }
          subTitle={
            <span style={{ color: 'var(--muted-foreground)', fontSize: 15, lineHeight: 1.6 }}>
              Khu vực này chỉ dành cho Thủ thư (Librarian) hoặc Quản trị viên (Admin). Bạn không có quyền truy cập vào danh mục tài liệu này.
            </span>
          }
          extra={[
            <Button
              type="primary"
              key="home"
              onClick={() => navigate('/')}
              style={primaryButtonStyle}
            >
              Về trang chủ
            </Button>,
            <Button key="back" onClick={() => navigate(-1)} style={radiusStyle}>
              Quay lại trang trước
            </Button>,
          ]}
        />
      </div>
    </div>
  )
}
