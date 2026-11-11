import React, { useEffect, useState } from 'react'
import { Badge } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { notificationsApi } from '../api'

/**
 * Chuông thông báo: bấm vào là chuyển thẳng tới trang /notifications.
 * Số thông báo chưa đọc được tải lại mỗi khi đổi trang, nên sau khi
 * đọc xong ở /notifications quay lại thì số trên chuông tự cập nhật.
 */
export const NotificationBell: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    notificationsApi
      .getMyNotifications()
      .then((data) => {
        if (!cancelled) setUnreadCount(data.filter((n) => !n.isRead).length)
      })
      .catch(() => {
        // Bỏ qua lỗi ngầm, chuông vẫn bấm được
      })
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  return (
    <button
      type="button"
      aria-label={
        unreadCount > 0
          ? `Thông báo thư viện, ${unreadCount} chưa đọc`
          : 'Thông báo thư viện'
      }
      title="Thông báo"
      onClick={() => navigate('/notifications')}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 'var(--sp-2)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <Badge count={unreadCount} overflowCount={99} size="small" color="var(--destructive)">
        <BellOutlined style={{ fontSize: 20, color: '#B08D3C' }} />
      </Badge>
    </button>
  )
}
