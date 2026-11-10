import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { NotificationItem } from '@/features/notifications'
import { LIBRARY_RULES } from '@/shared/constants/rules'
import { formatCurrency, formatDateTime } from '@/shared/utils/format'

export const NotificationsPanel: React.FC<{ items: NotificationItem[] }> = ({ items }) => {
  const navigate = useNavigate()
  const unread = items.filter((n) => !n.isRead).length
  const latest = items.slice(0, 3)

  return (
    <section className="home-panel" aria-labelledby="home-notif-title">
      <div className="home-section-head">
        <h2 id="home-notif-title" style={{ fontSize: 'var(--text-xl)' }}>
          Thông báo{unread > 0 ? ` (${unread} mới)` : ''}
        </h2>
        <button type="button" className="home-link" onClick={() => navigate('/notifications')}>
          Xem tất cả
        </button>
      </div>

      {latest.length === 0 ? (
        <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)' }}>Chưa có thông báo nào.</p>
      ) : (
        latest.map((n) => (
          <button key={n.id} type="button" className="home-notif" onClick={() => navigate('/notifications')}>
            <span className="home-notif-title">
              {!n.isRead && <span className="home-notif-dot" aria-label="Chưa đọc" />}
              {n.title}
            </span>
            <span className="home-notif-time">{formatDateTime(n.createdAt)}</span>
          </button>
        ))
      )}
    </section>
  )
}

interface LibraryInfoPanelProps {
  totalBooks: number
  /** Chỉ truyền khi đã tải đủ toàn bộ kho sách để đếm chính xác */
  availableTitles?: number
}

export const LibraryInfoPanel: React.FC<LibraryInfoPanelProps> = ({ totalBooks, availableTitles }) => (
  <section className="home-panel" aria-labelledby="home-info-title">
    <div className="home-section-head">
      <h2 id="home-info-title" style={{ fontSize: 'var(--text-xl)' }}>
        Thông tin thư viện
      </h2>
    </div>
    <dl className="home-facts">
      <dt>Giờ mở cửa</dt>
      <dd>T2 – T7, 08:00 – 21:00</dd>
      {totalBooks > 0 && (
        <>
          <dt>Đầu sách trong kho</dt>
          <dd>{totalBooks}</dd>
        </>
      )}
      {availableTitles !== undefined && (
        <>
          <dt>Có thể mượn ngay</dt>
          <dd>{availableTitles}</dd>
        </>
      )}
      <dt>Mượn tối đa</dt>
      <dd>{LIBRARY_RULES.maxConcurrentLoans} cuốn</dd>
      <dt>Thời hạn mượn</dt>
      <dd>{LIBRARY_RULES.standardBorrowDays} ngày</dd>
      <dt>Gia hạn</dt>
      <dd>
        {LIBRARY_RULES.maxRenewTimes} lần, mỗi lần +{LIBRARY_RULES.renewalExtensionDays} ngày
      </dd>
      <dt>Giữ sách đặt trước</dt>
      <dd>{LIBRARY_RULES.reservationHoldHours} giờ</dd>
      <dt>Phạt trả muộn</dt>
      <dd>{formatCurrency(LIBRARY_RULES.finePerDayVND)}/ngày</dd>
    </dl>
  </section>
)
