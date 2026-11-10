import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LIBRARY_RULES } from '@/shared/constants/rules'
import { formatCurrency } from '@/shared/utils/format'
import type { LoanSummary } from '../utils/selectors'

interface StatusStripProps {
  loans: LoanSummary
  reservations: { ready: number; pending: number; total: number }
  fines: { unpaidCount: number; unpaidAmount: number }
}

interface TileProps {
  label: string
  value: React.ReactNode
  sub: string
  to: string
  tone?: 'danger' | 'warning'
}

const Tile: React.FC<TileProps> = ({ label, value, sub, to, tone }) => {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className={`home-tile${tone ? ` is-${tone}` : ''}`}
      onClick={() => navigate(to)}
    >
      <span className="home-tile-label">{label}</span>
      <span className="home-tile-value">{value}</span>
      <span className="home-tile-sub">{sub}</span>
    </button>
  )
}

export const StatusStrip: React.FC<StatusStripProps> = ({ loans, reservations, fines }) => {
  const navigate = useNavigate()
  const hasOverdue = loans.overdue > 0

  return (
    <section aria-label="Tình hình mượn trả của bạn" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      {hasOverdue && (
        <div className="home-banner" role="alert">
          <span>
            Bạn có <strong>{loans.overdue}</strong> cuốn đã quá hạn. Tiền phạt tạm tính khoảng{' '}
            <strong>{formatCurrency(loans.estimatedFine)}</strong> ({formatCurrency(LIBRARY_RULES.finePerDayVND)}/ngày
            mỗi cuốn). Hãy trả sách sớm để tránh phạt thêm.
          </span>
          <button type="button" className="home-link" onClick={() => navigate('/my-loans')}>
            Xem sách quá hạn
          </button>
        </div>
      )}

      {!hasOverdue && fines.unpaidCount > 0 && (
        <div className="home-banner is-warning" role="status">
          <span>
            Bạn còn <strong>{fines.unpaidCount}</strong> khoản phạt chưa thanh toán, tổng{' '}
            <strong>{formatCurrency(fines.unpaidAmount)}</strong>.
          </span>
          <button type="button" className="home-link" onClick={() => navigate('/my-fines')}>
            Thanh toán
          </button>
        </div>
      )}

      <div className="home-tiles">
        <Tile
          label="Đang mượn"
          value={`${loans.active}/${LIBRARY_RULES.maxConcurrentLoans}`}
          sub="cuốn, tối đa cùng lúc"
          to="/my-loans"
        />
        {hasOverdue ? (
          <Tile label="Quá hạn" value={loans.overdue} sub="cuốn cần trả ngay" to="/my-loans" tone="danger" />
        ) : (
          <Tile
            label="Sắp đến hạn"
            value={loans.dueSoon}
            sub="cuốn trong 3 ngày tới"
            to="/my-loans"
            tone={loans.dueSoon > 0 ? 'warning' : undefined}
          />
        )}
        <Tile
          label="Đặt trước"
          value={reservations.total}
          sub={reservations.ready > 0 ? `${reservations.ready} cuốn sẵn sàng nhận` : 'cuốn đang chờ'}
          to="/my-loans"
          tone={reservations.ready > 0 ? 'warning' : undefined}
        />
        <Tile
          label="Tiền phạt chưa trả"
          value={formatCurrency(fines.unpaidAmount)}
          sub={fines.unpaidCount > 0 ? `${fines.unpaidCount} khoản` : 'Không có khoản nào'}
          to="/my-fines"
          tone={fines.unpaidCount > 0 ? 'danger' : undefined}
        />
      </div>
    </section>
  )
}
