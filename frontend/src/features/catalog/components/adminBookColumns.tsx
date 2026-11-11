import React from 'react'
import { Button, Popconfirm, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, CopyOutlined, EyeOutlined, AppstoreOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { BookDto } from '../types'
import { SpineTag } from '@/shared/components/SpineTag'
import { mutedText12Style, outlineButtonStyle, primaryTagStyle, radiusStyle, strongTextStyle } from '@/shared/styles/ui'

interface AdminBookColumnActions {
  onView?: (book: BookDto) => void
  onEdit: (book: BookDto) => void
  onManageCopies: (book: BookDto) => void
  onAddCopies: (book: BookDto) => void
  onToggleStatus: (book: BookDto) => void
  togglingBookId?: string | null
}

/** Cột bảng danh mục sách trong trang quản trị. */
export const buildAdminBookColumns = ({
  onView,
  onEdit,
  onManageCopies,
  onAddCopies,
  onToggleStatus,
  togglingBookId,
}: AdminBookColumnActions): ColumnsType<BookDto> => [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 75,
    render: (id: string) => <span className="tabular-numbers">#{id}</span>,
  },
  {
    title: 'Tên sách & ISBN',
    key: 'title',
    render: (_, record) => (
      <div>
        <div style={strongTextStyle}>{record.title}</div>
        <div style={mutedText12Style}>ISBN: {record.isbn || 'Chưa cập nhật'}</div>
      </div>
    ),
  },
  {
    title: 'Tác giả',
    dataIndex: 'authorName',
    key: 'authorName',
    width: 170,
  },
  {
    title: 'Thể loại',
    dataIndex: 'categoryName',
    key: 'categoryName',
    width: 165,
    render: (cat: string) => <Tag style={primaryTagStyle}>{cat}</Tag>,
  },
  {
    title: 'Lưu hành',
    dataIndex: 'status',
    key: 'status',
    width: 135,
    render: (status?: string) =>
      status === 'Inactive' ? (
        <SpineTag variant="danger">Ngừng lưu hành</SpineTag>
      ) : (
        <SpineTag variant="primary">Đang lưu hành</SpineTag>
      ),
  },
  {
    title: 'Tình trạng bản sao',
    key: 'copies',
    width: 165,
    render: (_, record) => (
      <SpineTag variant={record.availableCopies > 0 ? 'primary' : 'warning'}>
        {record.availableCopies} khả dụng / {record.totalCopies} tổng
      </SpineTag>
    ),
  },
  {
    title: 'Hành động',
    key: 'actions',
    width: 380,
    fixed: 'right',
    render: (_, record) => {
      const isInactive = record.status === 'Inactive'
      const isToggling = togglingBookId === record.id
      return (
        <Space size={6} wrap>
          {onView && (
            <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record)} style={radiusStyle}>
              Xem
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} style={radiusStyle}>
            Sửa
          </Button>
          <Button size="small" icon={<AppstoreOutlined />} onClick={() => onManageCopies(record)} style={radiusStyle}>
            Bản sao
          </Button>
          <Button size="small" icon={<CopyOutlined />} onClick={() => onAddCopies(record)} style={outlineButtonStyle}>
            + Bản sao
          </Button>
          <Popconfirm
            title={isInactive ? 'Mở khóa lưu hành đầu sách này?' : 'Ngừng lưu hành đầu sách này?'}
            description={
              isInactive
                ? 'Tài liệu sẽ hiển thị lại trên mục lục bạn đọc.'
                : 'Tài liệu sẽ bị ẩn khỏi bạn đọc và không thể đặt trước mới.'
            }
            onConfirm={() => onToggleStatus(record)}
            okText={isInactive ? 'Mở khóa' : 'Ngừng lưu hành'}
            cancelText="Hủy"
            okButtonProps={{ danger: !isInactive }}
          >
            <Button
              size="small"
              danger={!isInactive}
              loading={isToggling}
              icon={isInactive ? <CheckCircleOutlined /> : <StopOutlined />}
              style={radiusStyle}
            >
              {isInactive ? 'Mở' : 'Khóa'}
            </Button>
          </Popconfirm>
        </Space>
      )
    },
  },
]
