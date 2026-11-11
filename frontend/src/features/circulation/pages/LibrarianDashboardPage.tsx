import React from 'react'
import { Button, Space } from 'antd'
import { PlusOutlined, RollbackOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { DeskTile } from '../components/desk/DeskTile'
import { DeskPanel, DeskRow, PREVIEW_ROWS } from '../components/desk/DeskPanel'
import { LOAN_POOL, startOfDay, useDeskData } from '../hooks/useDeskData'
import { useAuth } from '@/features/identity'
import { PageHeader } from '@/shared/components/PageHeader'
import { SpineTag } from '@/shared/components/SpineTag'
import { formatDate, getVnTodayKey } from '@/shared/utils/format'
import '../desk.css'

export const LibrarianDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { loading, failed, truncated, data, reload } = useDeskData()

  return (
    <div className="desk">
      <PageHeader
        title="Bàn Làm Việc"
        subtitle={`Xin chào ${user?.fullName ?? 'thủ thư'}. Đây là những việc cần xử lý hôm nay.`}
        breadcrumbs={[{ title: 'Quản trị' }, { title: 'Bàn làm việc' }]}
        extra={
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/loans/borrow')}>
              Lập phiếu mượn
            </Button>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/admin/loans/return')}>
              Nhận trả sách
            </Button>
            <Button icon={<SearchOutlined />} onClick={() => navigate('/books')}>
              Tra cứu mục lục
            </Button>
          </Space>
        }
      />

      {failed && !loading && (
        <div className="desk-notice" role="status">
          Một số dữ liệu chưa tải được, số liệu có thể chưa đầy đủ.{' '}
          <button type="button" className="desk-link" onClick={reload}>
            Thử lại
          </button>
        </div>
      )}

      <div className="desk-tiles">
        <DeskTile
          label="Yêu cầu gia hạn chờ duyệt"
          value={data.pendingRenewalsTotalCount}
          sub="yêu cầu cần phản hồi bạn đọc"
          to="/admin/renewals"
          tone="warning"
        />
        <DeskTile
          label="Đặt trước sẵn sàng giao"
          value={data.readyTotalCount}
          sub={data.waiting > 0 ? `${data.waiting} lượt khác đang chờ sách` : 'cuốn đang giữ tại quầy'}
          to="/admin/reservations"
          tone="warning"
        />
        <DeskTile label="Sách quá hạn" value={data.overdueTotalCount} sub="cuốn chưa trả, cần nhắc bạn đọc" to="/admin/loans" tone="danger" />
        <DeskTile label="Đến hạn hôm nay" value={data.dueToday} sub="cuốn dự kiến được trả" to="/admin/loans" />
      </div>

      <div className="desk-today">
        <span>
          Hôm nay đã cho mượn <strong>{data.borrowedToday}</strong> cuốn
        </span>
        <span>
          đã nhận trả <strong>{data.returnedToday}</strong> cuốn
        </span>
      </div>

      <div className="desk-panels">
        <DeskPanel
          title="Gia hạn chờ duyệt"
          to="/admin/renewals"
          total={data.pendingRenewalsTotalCount}
          loading={loading}
          emptyText="Không có yêu cầu nào đang chờ."
        >
          {data.pendingRenewals.slice(0, PREVIEW_ROWS).map((r) => (
            <DeskRow
              key={r.id}
              title={r.bookTitle}
              meta={
                <>
                  {r.readerName} · xin hạn mới {formatDate(r.requestedNewDueDate)}
                </>
              }
            />
          ))}
        </DeskPanel>

        <DeskPanel
          title="Đặt trước sẵn sàng giao"
          to="/admin/reservations"
          total={data.readyTotalCount}
          loading={loading}
          emptyText="Chưa có sách nào chờ bạn đọc đến lấy."
        >
          {data.ready.slice(0, PREVIEW_ROWS).map((r) => (
            <DeskRow
              key={r.id}
              title={r.bookTitle}
              meta={
                <>
                  {r.readerName} · giữ đến {formatDate(r.expiresAt)}
                </>
              }
            />
          ))}
        </DeskPanel>

        <DeskPanel
          title="Sách quá hạn"
          to="/admin/loans"
          total={data.overdueTotalCount}
          loading={loading}
          emptyText="Không có sách nào quá hạn."
        >
          {data.overdue.slice(0, PREVIEW_ROWS).map(({ slip, detail }) => {
            const days = Math.max(1, dayjs(getVnTodayKey()).diff(startOfDay(detail.dueDate), 'day'))
            return (
              <DeskRow
                key={detail.id}
                title={detail.bookTitle}
                meta={slip.readerName}
                trailing={<SpineTag variant="danger">{days} ngày</SpineTag>}
              />
            )
          })}
        </DeskPanel>
      </div>

      {truncated && (
        <div className="desk-notice">
          Danh sách xem trước quét tối đa {LOAN_POOL} phiếu gần nhất; các chỉ số tổng hợp lấy toàn bộ từ hệ thống.
        </div>
      )}
    </div>
  )
}
