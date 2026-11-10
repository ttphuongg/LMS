import React from 'react'
import { Result, Button } from 'antd'
import { mutedTextStyle } from '@/shared/styles/ui'

interface ErrorStateProps {
  title?: string
  subTitle?: string
  onRetry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Không thể tải dữ liệu',
  subTitle = 'Đã xảy ra sự cố khi kết nối tới máy chủ lưu trữ thư viện.',
  onRetry,
}) => {
  return (
    <div
      style={{
        padding: 'var(--sp-8) var(--sp-4)',
        background: 'var(--card)',
        border: '1px solid var(--destructive)',
        borderRadius: 'var(--radius)',
        margin: 'var(--sp-4) 0',
      }}
    >
      <Result
        status="warning"
        title={<span style={{ fontFamily: 'var(--font-serif)', color: 'var(--destructive)' }}>{title}</span>}
        subTitle={<span style={mutedTextStyle}>{subTitle}</span>}
        extra={
          onRetry && (
            <Button type="primary" onClick={onRetry}>
              Thử tải lại
            </Button>
          )
        }
      />
    </div>
  )
}
