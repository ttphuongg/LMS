import React from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { LoanDetailDto } from '@/features/circulation'
import { SpineTag } from '@/shared/components/SpineTag'
import { LIBRARY_RULES } from '@/shared/constants/rules'
import { formatDate } from '@/shared/utils/format'
import { daysUntil, isOverdue } from '../utils/selectors'

const MAX_ROWS = 4

interface MyLoansPanelProps {
  active: LoanDetailDto[]
  onRenew: (detail: LoanDetailDto) => void
}

const DueTag: React.FC<{ detail: LoanDetailDto }> = ({ detail }) => {
  const left = daysUntil(detail.dueDate)
  if (isOverdue(detail)) {
    return <SpineTag variant="danger">Quá hạn {Math.max(1, Math.abs(left))} ngày</SpineTag>
  }
  if (left === 0) return <SpineTag variant="warning">Hết hạn hôm nay</SpineTag>
  return <SpineTag variant={left <= 3 ? 'warning' : 'primary'}>Còn {left} ngày</SpineTag>
}

export const MyLoansPanel: React.FC<MyLoansPanelProps> = ({ active, onRenew }) => {
  const navigate = useNavigate()
  const rows = active.slice(0, MAX_ROWS)

  return (
    <section className="home-panel" aria-labelledby="home-loans-title">
      <div className="home-section-head">
        <h2 id="home-loans-title">Sách bạn đang mượn</h2>
        <button type="button" className="home-link" onClick={() => navigate('/my-loans')}>
          Xem tất cả
        </button>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: 'var(--sp-5) 0', textAlign: 'center', color: 'var(--muted-foreground)' }}>
          <p style={{ marginBottom: 'var(--sp-3)' }}>Bạn chưa mượn cuốn nào.</p>
          <Button onClick={() => navigate('/books')}>Khám phá mục lục</Button>
        </div>
      ) : (
        <ul className="home-loan-list">
          {rows.map((d) => (
            <li className="home-loan-row" key={d.id}>
              <div style={{ minWidth: 0 }}>
                <div className="home-loan-title" title={d.bookTitle}>
                  {d.bookTitle}
                </div>
                <div className="home-loan-meta">
                  #{d.callNumber} · Hạn trả {formatDate(d.dueDate)}
                </div>
              </div>
              <DueTag detail={d} />
              <Button
                size="small"
                disabled={d.renewalCount >= LIBRARY_RULES.maxRenewTimes}
                onClick={() => onRenew(d)}
                title={
                  d.renewalCount >= LIBRARY_RULES.maxRenewTimes
                    ? `Đã gia hạn tối đa ${LIBRARY_RULES.maxRenewTimes} lần`
                    : undefined
                }
              >
                Gia hạn
              </Button>
            </li>
          ))}
        </ul>
      )}

      {active.length > MAX_ROWS && (
        <div style={{ textAlign: 'right', marginTop: 'var(--sp-2)' }}>
          <button type="button" className="home-link" onClick={() => navigate('/my-loans')}>
            Còn {active.length - MAX_ROWS} cuốn khác
          </button>
        </div>
      )}
    </section>
  )
}
