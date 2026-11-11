import React, { useState } from 'react'
import { Table, Button, Popconfirm, Space } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import type { ColumnsType } from 'antd/es/table'
import { CheckCircleOutlined, CloseCircleOutlined, CheckOutlined } from '@ant-design/icons'
import { circulationApi } from '../api'
import type { ReservationDto } from '../types'
import { PageHeader } from '@/shared/components/PageHeader'
import { SpineTag } from '@/shared/components/SpineTag'
import { BookTitleCell } from '@/shared/components/BookTitleCell'
import { formatDate, getErrorMessage } from '@/shared/utils/format'
import { useLoadOnMount } from '@/shared/hooks'
import { primaryButtonStyle } from '@/shared/styles/ui'

export const AdminReservationsPage: React.FC = () => {
  const { data: reservations, loading, reload } = useLoadOnMount(() => circulationApi.getAllReservations(), [])
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const handleMarkReady = async (id: string) => {
    try {
      setActionLoadingId(id)
      await circulationApi.markReservationReady(id)
      message.success('Đã cập nhật trạng thái: Sách đã sẵn sàng cho bạn đọc đến nhận trong 48 giờ.')
      await reload()
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Không thể chuyển trạng thái sẵn sàng'))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleFulfill = async (id: string) => {
    try {
      setActionLoadingId(id)
      await circulationApi.fulfillReservation(id)
      message.success('Đã bàn giao sách cho bạn đọc thành công! Hệ thống đã tự động tạo phiếu mượn 14 ngày.')
      await reload()
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Không thể giao sách cho bạn đọc'))
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      setActionLoadingId(id)
      await circulationApi.cancelReservation(id)
      message.success('Đã hủy lượt đặt trước thành công.')
      await reload()
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Không thể hủy lượt đặt trước'))
    } finally {
      setActionLoadingId(null)
    }
  }

  const columns: ColumnsType<ReservationDto> = [
    {
      title: 'Tài liệu đặt trước',
      key: 'book',
      render: (_, r) => (
        <BookTitleCell
          title={r.bookTitle}
          code={r.bookCopyId ? `Bản sao #${r.bookCopyId}` : undefined}
        />
      ),
    },
    {
      title: 'Bạn đọc đăng ký',
      dataIndex: 'readerName',
      key: 'readerName',
      width: 180,
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: 'Thời điểm đăng ký',
      dataIndex: 'reservedAt',
      key: 'reservedAt',
      width: 140,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Hạn giữ chỗ',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 140,
      render: (date: string) => (date ? formatDate(date) : '—'),
    },
    {
      title: 'Trạng thái xử lý',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (status: string) => {
        if (status === 'Ready') return <SpineTag variant="warning">Sẵn sàng tại quầy</SpineTag>
        if (status === 'Waiting') return <SpineTag variant="primary">Đang chờ sách</SpineTag>
        if (status === 'Completed') return <SpineTag variant="neutral">Đã nhận sách</SpineTag>
        if (status === 'Cancelled') return <SpineTag variant="neutral">Đã hủy</SpineTag>
        if (status === 'Expired') return <SpineTag variant="danger">Quá hạn giữ chỗ</SpineTag>
        return <SpineTag variant="neutral">{status}</SpineTag>
      },
    },
    {
      title: 'Vị trí kệ bản sao',
      key: 'copyLocationLabel',
      width: 210,
      render: (_, r) => {
        if (!r.bookCopyId) return <span style={{ color: 'var(--muted-foreground)' }}>Chưa gán bản sao</span>
        return r.copyLocationLabel
          ? <SpineTag variant="neutral">{r.copyLocationLabel}</SpineTag>
          : <span style={{ color: 'var(--muted-foreground)' }}>Chưa xếp kệ</span>
      },
    },
    {
      title: 'Thao tác xử lý',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, r) => {
        const isCurrentLoading = actionLoadingId === r.id
        const isReady = r.status === 'Ready'
        const isWaiting = r.status === 'Waiting'

        if (isReady) {
          return (
            <Space size="small">
              <Popconfirm
                title="Giao sách cho bạn đọc"
                description="Xác nhận bạn đọc đã đến nhận tài liệu? Hệ thống sẽ tạo phiếu mượn thời hạn 14 ngày cho bạn đọc."
                onConfirm={() => handleFulfill(r.id)}
                okText="Xác nhận giao"
                cancelText="Hủy"
                disabled={isCurrentLoading}
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  loading={isCurrentLoading}
                  style={primaryButtonStyle}
                >
                  Giao sách
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Hủy lượt giữ chỗ"
                description="Bạn có chắc chắn muốn hủy lượt giữ chỗ này?"
                onConfirm={() => handleCancel(r.id)}
                okText="Đồng ý hủy"
                cancelText="Đóng"
                okButtonProps={{ danger: true }}
                disabled={isCurrentLoading}
              >
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  loading={isCurrentLoading}
                >
                  Hủy
                </Button>
              </Popconfirm>
            </Space>
          )
        }

        if (isWaiting) {
          return (
            <Space size="small">
              <Popconfirm
                title="Đánh dấu sẵn sàng"
                description="Xác nhận sách đã sẵn sàng tại quầy để bạn đọc đến nhận trong 48 giờ?"
                onConfirm={() => handleMarkReady(r.id)}
                okText="Xác nhận"
                cancelText="Hủy"
                disabled={isCurrentLoading}
              >
                <Button
                  size="small"
                  icon={<CheckOutlined />}
                  loading={isCurrentLoading}
                  style={primaryButtonStyle}
                >
                  Sẵn sàng
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Hủy lượt đặt trước"
                description="Bạn có chắc chắn muốn hủy lượt đặt trước này?"
                onConfirm={() => handleCancel(r.id)}
                okText="Đồng ý hủy"
                cancelText="Đóng"
                okButtonProps={{ danger: true }}
                disabled={isCurrentLoading}
              >
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  loading={isCurrentLoading}
                >
                  Hủy
                </Button>
              </Popconfirm>
            </Space>
          )
        }

        return <span style={{ color: 'var(--muted-foreground)' }}>—</span>
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Danh Sách Đặt Giữ Chỗ Toàn Viện"
        subtitle="Theo dõi các lượt đặt sách của bạn đọc và phân bổ tài liệu về quầy giữ chỗ"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Danh sách đặt trước' },
        ]}
      />

      <Table
        columns={columns}
        dataSource={reservations}
        rowKey="id"
        loading={loading}
        bordered
        scroll={{ x: 1000 }}
      />
    </div>
  )
}
