import React from 'react'
import { Button, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SyncOutlined, CloseCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { LoanDetailDto, ReservationDto } from '../types'
import { LIBRARY_RULES } from '@/shared/constants/rules'
import { SpineTag } from '@/shared/components/SpineTag'
import { BookTitleCell } from '@/shared/components/BookTitleCell'
import { formatDate, getVnTodayKey, toVnDateKey } from '@/shared/utils/format'
import { outlineButtonStyle } from '@/shared/styles/ui'

/** Cột bảng "Đang mượn". */
export const buildActiveLoanColumns = (onRenew: (detail: LoanDetailDto) => void): ColumnsType<LoanDetailDto> => [
  {
    title: 'Mã bản sao',
    dataIndex: 'barcode',
    key: 'barcode',
    width: 130,
    render: (barcode: string) => <SpineTag variant="primary">{barcode}</SpineTag>,
  },
  {
    title: 'Tên tài liệu',
    dataIndex: 'bookTitle',
    key: 'bookTitle',
    render: (title: string) => <BookTitleCell title={title} />,
  },
  {
    title: 'Hạn trả sách',
    dataIndex: 'dueDate',
    key: 'dueDate',
    width: 140,
    render: (date: string) => {
      const isOverdue = dayjs(getVnTodayKey()).isAfter(dayjs(toVnDateKey(date)))
      return (
        <span
          style={{
            color: isOverdue ? 'var(--destructive)' : 'var(--primary)',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatDate(date)} {isOverdue && '(Quá hạn)'}
        </span>
      )
    },
  },
  {
    title: 'Trạng thái',
    key: 'status',
    width: 140,
    render: (_, record) => {
      const isOverdue = dayjs(getVnTodayKey()).isAfter(dayjs(toVnDateKey(record.dueDate)))
      if (isOverdue) {
        return <SpineTag variant="danger">Quá hạn trả</SpineTag>
      }
      return <SpineTag variant="primary">Đang mượn</SpineTag>
    },
  },
  {
    title: 'Số lần đã gia hạn',
    dataIndex: 'renewalCount',
    key: 'renewalCount',
    width: 135,
    render: (count: number) => `${count} / ${LIBRARY_RULES.maxRenewTimes} lần`,
  },
  {
    title: 'Hành động',
    key: 'actions',
    width: 130,
    render: (_, record) => (
      <Button
        size="small"
        icon={<SyncOutlined />}
        onClick={() => onRenew(record)}
        disabled={record.renewalCount >= LIBRARY_RULES.maxRenewTimes}
        style={outlineButtonStyle}
      >
        Gia hạn
      </Button>
    ),
  },
]

/** Cột bảng "Lịch sử mượn trả". */
export const historyLoanColumns: ColumnsType<LoanDetailDto> = [
  {
    title: 'Mã bản sao',
    dataIndex: 'barcode',
    key: 'barcode',
    width: 130,
    render: (barcode: string) => <SpineTag variant="neutral">{barcode}</SpineTag>,
  },
  {
    title: 'Tên tài liệu',
    dataIndex: 'bookTitle',
    key: 'bookTitle',
    render: (title: string) => <BookTitleCell title={title} />,
  },
  {
    title: 'Hạn quy định',
    dataIndex: 'dueDate',
    key: 'dueDate',
    width: 130,
    render: (date: string) => formatDate(date),
  },
  {
    title: 'Ngày thực trả',
    dataIndex: 'returnDate',
    key: 'returnDate',
    width: 130,
    render: (date?: string) => formatDate(date) || '—',
  },
  {
    title: 'Trạng thái',
    key: 'status',
    width: 120,
    render: () => <SpineTag variant="neutral">Đã trả</SpineTag>,
  },
]

/** Cột bảng "Đặt giữ chỗ của tôi". */
export const buildReservationColumns = (onCancel: (id: string) => void): ColumnsType<ReservationDto> => [
  {
    title: 'Tài liệu đặt trước',
    dataIndex: 'bookTitle',
    key: 'bookTitle',
    render: (title: string, record) => (
      <BookTitleCell title={title} code={record.barcode} codeLabel="Mã bản sao giữ" />
    ),
  },
  {
    title: 'Ngày đăng ký',
    dataIndex: 'reservedAt',
    key: 'reservedAt',
    width: 130,
    render: (date: string) => formatDate(date),
  },
  {
    title: 'Hạn giữ chỗ (48h)',
    dataIndex: 'expiresAt',
    key: 'expiresAt',
    width: 130,
    render: (date?: string) => (date ? formatDate(date) : '—'),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    width: 170,
    render: (status: string) => {
      if (status === 'Ready') return <SpineTag variant="warning">Sẵn sàng nhận tại quầy</SpineTag>
      if (status === 'Waiting') return <SpineTag variant="primary">Đang chờ sách về</SpineTag>
      if (status === 'Completed') return <SpineTag variant="neutral">Đã nhận sách</SpineTag>
      if (status === 'Cancelled') return <SpineTag variant="neutral">Đã hủy</SpineTag>
      if (status === 'Expired') return <SpineTag variant="danger">Hết hạn giữ chỗ</SpineTag>
      return <SpineTag variant="neutral">{status}</SpineTag>
    },
  },
  {
    title: 'Ghi chú nhận sách',
    key: 'pickupNote',
    render: (_, record) => {
      if (record.status === 'Ready') return 'Đến quầy thủ thư làm thủ tục mượn'
      if (record.status === 'Waiting') return 'Đang xếp hàng chờ bản sao trống'
      return '—'
    },
  },
  {
    title: 'Hủy giữ chỗ',
    key: 'cancel',
    width: 110,
    render: (_, record) => {
      const canCancel = record.status === 'Waiting' || record.status === 'Ready'
      if (!canCancel) {
        return <span style={{ color: 'var(--muted-foreground)' }}>—</span>
      }
      return (
        <Popconfirm
          title="Hủy đặt trước cuốn sách này?"
          description="Bạn sẽ mất vị trí xếp hàng nhận tài liệu."
          onConfirm={() => onCancel(record.id)}
          okText="Đồng ý hủy"
          cancelText="Không"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger icon={<CloseCircleOutlined />}>
            Hủy
          </Button>
        </Popconfirm>
      )
    },
  },
]
