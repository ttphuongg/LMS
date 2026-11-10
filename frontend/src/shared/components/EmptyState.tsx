import React from 'react'
import { Empty, Button } from 'antd'
import { BookOutlined } from '@ant-design/icons'

interface EmptyStateProps {
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Chưa có dữ liệu trong mục lục',
  description = 'Hiện tại không tìm thấy thông tin phù hợp với yêu cầu.',
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        padding: 'var(--sp-12) var(--sp-6)',
        textAlign: 'center',
        background: 'var(--card)',
        border: '1px dashed var(--border)',
        borderRadius: 'var(--radius)',
        margin: 'var(--sp-4) 0',
      }}
    >
      <Empty
        image={<BookOutlined style={{ fontSize: 48, color: 'var(--accent)' }} />}
        description={
          <div>
            <div style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: 'var(--text-lg)', marginBottom: 'var(--sp-1)' }}>
              {title}
            </div>
            <div style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)' }}>{description}</div>
          </div>
        }
      >
        {actionText && onAction && (
          <Button type="primary" onClick={onAction} style={{ marginTop: 'var(--sp-2)' }}>
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  )
}
