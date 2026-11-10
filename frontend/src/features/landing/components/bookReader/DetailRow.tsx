import React from 'react'

interface DetailRowProps {
  label: string
  value: React.ReactNode
  /** Hiển thị giá trị bằng font monospace (vd. ISBN) */
  mono?: boolean
}

/** Một dòng "nhãn: giá trị" trong bảng thông tin thư mục của phiếu biên mục. */
export const DetailRow: React.FC<DetailRowProps> = ({ label, value, mono }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ECE3CF', padding: '3px 0' }}>
    <span style={{ color: '#7A6B5B' }}>{label}</span>
    <span style={mono ? { fontFamily: 'monospace', fontWeight: 600 } : { fontWeight: 600 }}>{value}</span>
  </div>
)
