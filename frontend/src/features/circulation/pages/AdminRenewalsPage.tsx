import React, { useState } from 'react'
import { Table, Button, Modal, Form, Input, Space } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import type { ColumnsType } from 'antd/es/table'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { circulationApi } from '../api'
import type { RenewalRequestDto } from '../types'
import { PageHeader } from '@/shared/components/PageHeader'
import { SpineTag } from '@/shared/components/SpineTag'
import { formatDate, getErrorMessage } from '@/shared/utils/format'
import { mutedText13Style, primaryButtonStyle, radiusStyle, strongTextStyle } from '@/shared/styles/ui'
import { useLoadOnMount } from '@/shared/hooks'

export const AdminRenewalsPage: React.FC = () => {
  const { data: renewals, loading, reload: fetchRenewals } = useLoadOnMount(() => circulationApi.getAllRenewals(), [])

  // Modal từ chối
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejectForm] = Form.useForm()
  const [processing, setProcessing] = useState(false)

  const handleApprove = async (id: string) => {
    try {
      await circulationApi.reviewRenewal(id, {
        status: 'Approved',
        reason: 'Đủ điều kiện gia hạn thêm 7 ngày.',
      })
      message.success('Đã phê duyệt gia hạn mượn sách thành công!')
      fetchRenewals()
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi phê duyệt'))
    }
  }

  const handleOpenReject = (id: string) => {
    setSelectedId(id)
    rejectForm.setFieldsValue({ reason: 'Sách đã có bạn đọc khác đăng ký đặt giữ chỗ trước.' })
    setRejectModalOpen(true)
  }

  const handleConfirmReject = async () => {
    if (!selectedId) return
    try {
      setProcessing(true)
      const values = await rejectForm.validateFields()
      await circulationApi.reviewRenewal(selectedId, {
        status: 'Rejected',
        reason: values.reason,
      })
      message.info('Đã từ chối yêu cầu gia hạn')
      setRejectModalOpen(false)
      fetchRenewals()
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi xử lý'))
    } finally {
      setProcessing(false)
    }
  }

  const columns: ColumnsType<RenewalRequestDto> = [
    {
      title: 'Tài liệu xin gia hạn',
      key: 'book',
      render: (_, r) => (
        <div>
          <div style={strongTextStyle}>{r.bookTitle}</div>
          <SpineTag variant="neutral">{r.barcode}</SpineTag>
        </div>
      ),
    },
    {
      title: 'Bạn đọc',
      dataIndex: 'readerName',
      key: 'readerName',
      width: 160,
    },
    {
      title: 'Hạn hiện tại',
      dataIndex: 'currentDueDate',
      key: 'currentDueDate',
      width: 120,
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Hạn đề xuất mới',
      dataIndex: 'requestedNewDueDate',
      key: 'requestedNewDueDate',
      width: 140,
      render: (d: string) => (
        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{formatDate(d)}</span>
      ),
    },
    {
      title: 'Lý do xin gia hạn',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => <span style={mutedText13Style}>{reason}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        if (status === 'Approved') return <SpineTag variant="primary">Đã duyệt</SpineTag>
        if (status === 'Rejected') return <SpineTag variant="danger">Đã từ chối</SpineTag>
        return <SpineTag variant="warning">Chờ xem xét</SpineTag>
      },
    },
    {
      title: 'Quyết định',
      key: 'actions',
      width: 180,
      render: (_, r) => {
        if (r.status !== 'Pending') {
          return <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>Đã kết luận</span>
        }
        return (
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleApprove(r.id)}
              style={primaryButtonStyle}
            >
              Duyệt
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => handleOpenReject(r.id)}
              style={radiusStyle}
            >
              Từ chối
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Duyệt Yêu Cầu Gia Hạn Mượn Sách"
        subtitle="Xem xét các đơn xin gia hạn thời gian mượn tài liệu của độc giả"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Duyệt gia hạn' },
        ]}
      />

      <Table
        columns={columns}
        dataSource={renewals}
        rowKey="id"
        loading={loading}
        bordered
        scroll={{ x: 800 }}
      />

      <Modal
        title={
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: 'var(--destructive)' }}>
            Từ Chối Đề Nghị Gia Hạn
          </span>
        }
        open={rejectModalOpen}
        onOk={handleConfirmReject}
        confirmLoading={processing}
        onCancel={() => setRejectModalOpen(false)}
        okText="Gửi từ chối"
        cancelText="Đóng"
        okButtonProps={{ danger: true, style: { borderRadius: 'var(--radius)' } }}
        cancelButtonProps={{ style: radiusStyle }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            label="Lý do từ chối gia hạn (sẽ gửi thông báo tới bạn đọc)"
            name="reason"
            rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
          >
            <Input.TextArea rows={4} style={radiusStyle} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
