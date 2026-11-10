import React from 'react'
import { CatalogCode } from './CatalogCode'
import { strongTextStyle } from '@/shared/styles/ui'

interface BookTitleCellProps {
  title: string
  callNumber: string
}

/** Ô bảng: tên tài liệu (đậm) + số hiệu phân loại bên dưới. */
export const BookTitleCell: React.FC<BookTitleCellProps> = ({ title, callNumber }) => (
  <div>
    <div style={strongTextStyle}>{title}</div>
    <CatalogCode code={callNumber} />
  </div>
)
