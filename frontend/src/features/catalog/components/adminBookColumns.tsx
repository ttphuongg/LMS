import React from 'react'
import { Button, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, CopyOutlined, EyeOutlined } from '@ant-design/icons'
import type { BookDto } from '../types'
import { CatalogCode } from '@/shared/components/CatalogCode'
import { SpineTag } from '@/shared/components/SpineTag'
import { mutedText12Style, outlineButtonStyle, primaryTagStyle, radiusStyle, strongTextStyle } from '@/shared/styles/ui'

interface AdminBookColumnActions {
  onView?: (book: BookDto) => void
  onEdit: (book: BookDto) => void
  onAddCopies: (book: BookDto) => void
}

/** Cột bảng danh mục sách trong trang quản trị. */
export const buildAdminBookColumns = ({ onView, onEdit, onAddCopies }: AdminBookColumnActions): ColumnsType<BookDto> => [
  {
    title: 'Số hiệu DDC',
    dataIndex: 'callNumber',
    key: 'callNumber',
    width: 130,
    render: (code: string) => <CatalogCode code={code} />,
  },
  {
    title: 'Tên sách & ISBN',
    key: 'title',
    render: (_, record) => (
      <div>
        <div style={strongTextStyle}>{record.title}</div>
        <div style={mutedText12Style}>ISBN: {record.isbn}</div>
      </div>
    ),
  },
  {
    title: 'Tác giả',
    dataIndex: 'authorName',
    key: 'authorName',
    width: 180,
  },
  {
    title: 'Thể loại',
    dataIndex: 'categoryName',
    key: 'categoryName',
    width: 180,
    render: (cat: string) => <Tag style={primaryTagStyle}>{cat}</Tag>,
  },
  {
    title: 'Tình trạng bản sao',
    key: 'copies',
    width: 170,
    render: (_, record) => (
      <SpineTag variant={record.availableCopies > 0 ? 'primary' : 'warning'}>
        {record.availableCopies} khả dụng / {record.totalCopies} tổng
      </SpineTag>
    ),
  },
  {
    title: 'Hành động',
    key: 'actions',
    width: 250,
    render: (_, record) => (
      <Space size={8}>
        {onView && (
          <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record)} style={radiusStyle}>
            Xem
          </Button>
        )}
        <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} style={radiusStyle}>
          Sửa
        </Button>
        <Button size="small" icon={<CopyOutlined />} onClick={() => onAddCopies(record)} style={outlineButtonStyle}>
          + Bản sao
        </Button>
      </Space>
    ),
  },
]
