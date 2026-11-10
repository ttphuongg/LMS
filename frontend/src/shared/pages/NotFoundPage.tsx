import React from 'react'
import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { FileUnknownOutlined } from '@ant-design/icons'
import { primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'

export const NotFoundPage: React.FC = () => {
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
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius)',
          padding: 'var(--sp-10) var(--sp-8)',
          maxWidth: 520,
          textAlign: 'center',
        }}
      >
        <Result
          icon={<FileUnknownOutlined style={{ color: 'var(--accent)', fontSize: 56 }} />}
          title={
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 28,
                color: 'var(--foreground)',
                fontWeight: 600,
              }}
            >
              404 - Không tìm thấy trang
            </span>
          }
          subTitle={
            <span style={{ color: 'var(--muted-foreground)', fontSize: 15, lineHeight: 1.6 }}>
              Cuốn sách hoặc mục lục bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang kệ khác.
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
            <Button key="books" onClick={() => navigate('/books')} style={radiusStyle}>
              Mục lục sách
            </Button>,
          ]}
        />
      </div>
    </div>
  )
}
