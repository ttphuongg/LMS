import React from 'react'
import { CatalogCode } from './CatalogCode'
import { strongTextStyle } from '@/shared/styles/ui'

interface BookTitleCellProps {
  title: string
  code?: string | null
  codeLabel?: string
}

/** Ô bảng: tên tài liệu (đậm) + mã định danh thực tế bên dưới (ISBN / mã bản sao nếu có). */
export const BookTitleCell: React.FC<BookTitleCellProps> = ({ title, code, codeLabel }) => (
  <div>
    <div style={strongTextStyle}>{title}</div>
    {code ? <CatalogCode code={code} label={codeLabel} /> : null}
  </div>
)
