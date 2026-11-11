import React, { useState } from 'react'
import { Card, Button, Space, Tag, Empty } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { CheckCircleOutlined, BookOutlined } from '@ant-design/icons'
import { notificationsApi } from '../api'
import { PageHeader } from '@/shared/components/PageHeader'
import { formatDateTime } from '@/shared/utils/format'
import { LoadingState } from '@/shared/components/LoadingState'
import { outlineButtonStyle, primaryButtonStyle } from '@/shared/styles/ui'
import { useLoadOnMount } from '@/shared/hooks'

export const NotificationsPage: React.FC = () => {
  const { data: notifications, setData: setNotifications, loading } = useLoadOnMount(() => notificationsApi.getMyNotifications(), [])
  const [filterUnread, setFilterUnread] = useState(false)

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      message.success('Đã đánh dấu thông báo đã đọc')
    } catch {
      message.error('Lỗi khi đánh dấu thông báo')
    }
  }

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter((x) => !x.isRead)) {
      await notificationsApi.markAsRead(n.id)
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    message.success('Đã đánh dấu tất cả thông báo là đã đọc')
  }

  const displayedList = filterUnread
    ? notifications.filter((n) => !n.isRead)
    : notifications

  if (loading) return <LoadingState tip="Đang tải hòm thư thông báo..." />

  return (
    <div>
      <PageHeader
        title="Thông Báo Thư Viện"
        subtitle="Hòm thư nhắc nhở hạn mượn, thông báo giữ sách và các cập nhật từ hệ thống"
        breadcrumbs={[
          { title: 'Trang chủ', href: '/' },
          { title: 'Hòm thư thông báo' },
        ]}
        extra={
          <Space>
            <Button
              onClick={() => setFilterUnread(!filterUnread)}
              style={outlineButtonStyle}
            >
              {filterUnread ? 'Xem tất cả thông báo' : 'Chỉ xem chưa đọc'}
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleMarkAllRead}
              style={primaryButtonStyle}
            >
              Đọc tất cả
            </Button>
          </Space>
        }
      />

      <Card className="catalog-card" style={{ background: 'var(--card)', borderRadius: 'var(--radius)' }}>
        {displayedList.length === 0 ? (
          <Empty description="Không có thông báo nào trong danh mục." style={{ padding: 'var(--sp-8) 0' }} />
        ) : (
          <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {displayedList.map((item) => (
              <div
                key={item.id}
                role="listitem"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 'var(--sp-4)',
                  flexWrap: 'wrap',
                  padding: 'var(--sp-4) var(--sp-5)',
                  background: item.isRead ? 'transparent' : 'var(--muted)',
                  borderBottom: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-4)', flex: 1, minWidth: 220 }}>
                  <BookOutlined
                    style={{
                      fontSize: 22,
                      color: item.isRead ? 'var(--muted-foreground)' : 'var(--accent)',
                      marginTop: 4,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span
                        style={{
                          fontWeight: item.isRead ? 500 : 700,
                          color: item.isRead ? 'var(--muted-foreground)' : 'var(--foreground)',
                          fontSize: 15,
                        }}
                      >
                        {item.title}
                      </span>
                      {!item.isRead && <Tag color="var(--destructive)">Mới</Tag>}
                    </div>
                    <div style={{ color: 'var(--foreground)', fontSize: 13, lineHeight: 1.6, margin: 'var(--sp-1) 0 var(--sp-2)' }}>
                      {item.message}
                    </div>
                    <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                </div>

                {!item.isRead && (
                  <Button
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleMarkAsRead(item.id)}
                    style={{ borderColor: 'var(--border-strong)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}
                  >
                    Đã đọc
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
