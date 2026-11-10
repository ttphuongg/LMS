import React from 'react'
import { Spin } from 'antd'

interface LoadingStateProps {
  tip?: string
  minHeight?: number | string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  tip = 'Đang tra cứu dữ liệu thư viện...',
  minHeight = 240,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        padding: 'var(--sp-8)',
      }}
    >
      <Spin size="large" />
      <span style={{ marginTop: 'var(--sp-4)', color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
        {tip}
      </span>
    </div>
  )
}
