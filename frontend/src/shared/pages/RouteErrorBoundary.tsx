import React, { useEffect } from 'react'
import { Result, Button } from 'antd'
import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError()

  const errorMessage =
    error instanceof Error
      ? error.message
      : isRouteErrorResponse(error)
        ? `${error.status} ${error.statusText}`
        : String(error)

  // Kiểm tra lỗi stale chunk do deploy phiên bản mới (Vite / React.lazy dynamic import failure)
  const isChunkLoadError =
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('dynamically imported module') ||
    errorMessage.includes('Importing a module script failed')

  useEffect(() => {
    if (isChunkLoadError) {
      const reloadKey = 'route_chunk_error_reload'
      const hasReloaded = sessionStorage.getItem(reloadKey)
      if (!hasReloaded) {
        sessionStorage.setItem(reloadKey, 'true')
        window.location.reload()
      }
    }
  }, [isChunkLoadError])

  const handleHardReload = () => {
    sessionStorage.removeItem('route_chunk_error_reload')
    sessionStorage.removeItem('vite_preload_error_reload')
    window.location.reload()
  }

  const handleGoHome = () => {
    sessionStorage.removeItem('route_chunk_error_reload')
    sessionStorage.removeItem('vite_preload_error_reload')
    window.location.href = '/'
  }

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
          maxWidth: 540,
          textAlign: 'center',
        }}
      >
        <Result
          icon={
            isChunkLoadError ? (
              <ReloadOutlined style={{ color: 'var(--primary)', fontSize: 56 }} />
            ) : (
              <ExclamationCircleOutlined style={{ color: 'var(--destructive)', fontSize: 56 }} />
            )
          }
          title={
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 26,
                color: 'var(--foreground)',
                fontWeight: 600,
              }}
            >
              {isChunkLoadError ? 'Đã có bản cập nhật mới' : 'Đã có lỗi xảy ra'}
            </span>
          }
          subTitle={
            <span style={{ color: 'var(--muted-foreground)', fontSize: 15, lineHeight: 1.6 }}>
              {isChunkLoadError
                ? 'Hệ thống vừa được cập nhật phiên bản mới. Vui lòng bấm nút bên dưới để tải lại giao diện mới nhất.'
                : 'Trang này hiện không thể hiển thị do lỗi kỹ thuật. Vui lòng thử tải lại trang hoặc quay về trang chủ.'}
            </span>
          }
          extra={[
            <Button
              type="primary"
              key="reload"
              icon={<ReloadOutlined />}
              onClick={handleHardReload}
              style={primaryButtonStyle}
            >
              Tải lại trang
            </Button>,
            <Button key="home" onClick={handleGoHome} style={radiusStyle}>
              Về trang chủ
            </Button>,
          ]}
        />
      </div>
    </div>
  )
}
