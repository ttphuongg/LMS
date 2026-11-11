import React, { useState } from 'react'
import { Card, Table, Button, Alert } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DollarOutlined } from '@ant-design/icons'
import { billingApi } from '../api'
import type { FineDto } from '../types'
import { FinePaymentModal } from '../components/FinePaymentModal'
import { FineStatusTag } from '../components/FineStatusTag'
import { isFinePayable } from '../utils/fineStatus'
import { PageHeader } from '@/shared/components/PageHeader'
import { SpineTag } from '@/shared/components/SpineTag'
import { formatCurrency, formatDate } from '@/shared/utils/format'
import { LoadingState } from '@/shared/components/LoadingState'
import { mutedText12Style, strongTextStyle } from '@/shared/styles/ui'
import { useLoadOnMount } from '@/shared/hooks'

export const MyFinesPage: React.FC = () => {
  const { data: fines, loading, reload: fetchFines } = useLoadOnMount(() => billingApi.getMyFines(), [])
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedFine, setSelectedFine] = useState<FineDto | null>(null)

  const unpaidFines = fines.filter((f) => isFinePayable(f))
  const totalUnpaid = unpaidFines.reduce((sum, f) => sum + f.amount, 0)

  const handleOpenPay = (fine: FineDto) => {
    setSelectedFine(fine)
    setPaymentModalOpen(true)
  }

  const columns: ColumnsType<FineDto> = [
    {
      title: 'Mã phiếu phạt',
      dataIndex: 'fineNumber',
      key: 'fineNumber',
      width: 130,
      render: (num: string) => <SpineTag variant="neutral">{num}</SpineTag>,
    },
    {
      title: 'Lý do & Tóm tắt',
      key: 'reason',
      render: (_, r) => (
        <div>
          <div style={strongTextStyle}>{r.description}</div>
          {r.bookTitle && (
            <div style={mutedText12Style}>Tài liệu: {r.bookTitle}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Số tiền phạt',
      dataIndex: 'amount',
      key: 'amount',
      width: 170,
      render: (amt: number, r) => (
        <span
          style={{
            fontWeight: 700,
            color: isFinePayable(r) ? 'var(--destructive)' : 'var(--muted-foreground)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(amt)}
        </span>
      ),
    },
    {
      title: 'Ngày lập phiếu',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 125,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 165,
      render: (status: string) => <FineStatusTag status={status} />,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      render: (_, r) => {
        if (r.status === 'Paid') {
          return <span style={mutedText12Style}>Đã hoàn tất</span>
        }
        if (r.status === 'Cancelled') {
          return <span style={mutedText12Style}>Đã hủy</span>
        }
        if (!isFinePayable(r)) {
          return <span style={mutedText12Style}>—</span>
        }
        return (
          <Button
            size="small"
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => handleOpenPay(r)}
            style={{ background: 'var(--destructive)', borderColor: 'var(--destructive)', borderRadius: 'var(--radius-sm)' }}
          >
            Nộp phạt / QR
          </Button>
        )
      },
    },
  ]

  if (loading) return <LoadingState tip="Đang tải dữ liệu tiền phạt..." />

  return (
    <div>
      <PageHeader
        title="Tiền Phạt & Phí Bồi Thường Của Tôi"
        subtitle="Danh mục các khoản phí phạt trễ hạn hoặc bồi hoàn tài liệu theo quy chế thư viện"
        breadcrumbs={[
          { title: 'Trang chủ', href: '/' },
          { title: 'Tiền phạt của tôi' },
        ]}
      />

      {totalUnpaid > 0 && (
        <Alert
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span>
                Bạn đang có <strong>{unpaidFines.length}</strong> khoản phạt chưa thanh toán với tổng số tiền là:
              </span>
              <strong style={{ fontSize: 16, color: 'var(--destructive)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(totalUnpaid)}
              </strong>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 'var(--sp-5)', borderRadius: 'var(--radius)', background: 'var(--card)', border: '1px solid var(--border-strong)' }}
        />
      )}

      <Card className="catalog-card" style={{ background: 'var(--card)', borderRadius: 'var(--radius)' }}>
        <Table
          columns={columns}
          dataSource={fines}
          rowKey="id"
          pagination={false}
          bordered
          scroll={{ x: 780 }}
          locale={{ emptyText: 'Bạn không có khoản phạt nào trong hồ sơ.' }}
        />
      </Card>

      <FinePaymentModal
        open={paymentModalOpen}
        fine={selectedFine}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={fetchFines}
      />
    </div>
  )
}
