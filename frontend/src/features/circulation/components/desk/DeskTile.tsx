import React from 'react'
import { useNavigate } from 'react-router-dom'

interface DeskTileProps {
  label: string
  value: number
  sub: string
  to: string
  tone?: 'danger' | 'warning'
}

/** Ô thống kê trên "Bàn làm việc" của thủ thư; bấm để chuyển tới trang xử lý. */
export const DeskTile: React.FC<DeskTileProps> = ({ label, value, sub, to, tone }) => {
  const navigate = useNavigate()
  const cls = value === 0 ? 'is-done' : tone ? `is-${tone}` : ''
  return (
    <button type="button" className={`desk-tile ${cls}`} onClick={() => navigate(to)}>
      <span className="desk-tile-label">{label}</span>
      <span className="desk-tile-value">{value}</span>
      <span className="desk-tile-sub">{value === 0 ? 'Không có việc tồn đọng' : sub}</span>
    </button>
  )
}
