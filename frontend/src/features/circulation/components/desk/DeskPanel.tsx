import React from 'react'
import { Skeleton } from 'antd'
import { useNavigate } from 'react-router-dom'

/** Số dòng xem trước tối đa trong mỗi panel. */
export const PREVIEW_ROWS = 5

interface DeskPanelProps {
  title: string
  to: string
  total: number
  loading: boolean
  emptyText: string
  children: React.ReactNode
}

/** Khối danh sách xem trước (có trạng thái đang tải / trống) trên "Bàn làm việc". */
export const DeskPanel: React.FC<DeskPanelProps> = ({ title, to, total, loading, emptyText, children }) => {
  const navigate = useNavigate()
  return (
    <section className="desk-panel" aria-label={title}>
      <div className="desk-panel-head">
        <h2>{title}</h2>
        <button type="button" className="desk-link" onClick={() => navigate(to)}>
          {total > PREVIEW_ROWS ? `Xem ${total} mục` : 'Mở danh sách'}
        </button>
      </div>
      {loading ? (
        <Skeleton active paragraph={{ rows: 3 }} title={false} />
      ) : total === 0 ? (
        <div className="desk-empty">{emptyText}</div>
      ) : (
        <ul className="desk-list">{children}</ul>
      )}
    </section>
  )
}

interface DeskRowProps {
  title: string
  meta: React.ReactNode
  /** Phần phụ bên phải (vd. thẻ "x ngày") */
  trailing?: React.ReactNode
}

/** Một dòng trong DeskPanel: tên sách + dòng mô tả nhỏ. */
export const DeskRow: React.FC<DeskRowProps> = ({ title, meta, trailing }) => (
  <li className="desk-row">
    <div style={{ minWidth: 0 }}>
      <div className="desk-row-title" title={title}>
        {title}
      </div>
      <div className="desk-row-meta">{meta}</div>
    </div>
    {trailing}
  </li>
)
