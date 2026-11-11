import React, { useEffect, useState } from 'react'
import { Tabs, Table, Card } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { ReadOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { circulationApi } from '../api'
import type { LoanSlipDto, LoanDetailDto, ReservationDto } from '../types'
import { RenewModal } from '../components/RenewModal'
import { buildActiveLoanColumns, historyLoanColumns, buildReservationColumns } from '../components/myLoansColumns'
import { PageHeader } from '@/shared/components/PageHeader'
import { LoadingState } from '@/shared/components/LoadingState'
import { cardStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

export const MyLoansPage: React.FC = () => {
  const [loans, setLoans] = useState<LoanSlipDto[]>([])
  const [reservations, setReservations] = useState<ReservationDto[]>([])
  const [loading, setLoading] = useState(true)

  // Modal gia hạn
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<LoanDetailDto | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [loanData, resData] = await Promise.all([
        circulationApi.getMyLoans(),
        circulationApi.getMyReservations(),
      ])
      setLoans(loanData)
      setReservations(resData)
    } catch {
      message.error('Không thể tải thông tin lưu thông của bạn đọc')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Phân tách sách đang mượn và lịch sử đã trả
  const activeDetails: LoanDetailDto[] = []
  const historyDetails: LoanDetailDto[] = []

  loans.forEach((slip) => {
    slip.details.forEach((dtl) => {
      if (dtl.status === 'Returned') {
        historyDetails.push(dtl)
      } else {
        activeDetails.push(dtl)
      }
    })
  })

  // Hủy đặt trước và reload để đồng bộ trạng thái Cancelled từ DB
  const handleCancelReservation = async (id: string) => {
    try {
      await circulationApi.cancelReservation(id)
      message.success('Đã hủy phiếu đặt giữ chỗ thành công')
      await fetchData()
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi hủy đặt chỗ'))
    }
  }

  const handleOpenRenew = (dtl: LoanDetailDto) => {
    setSelectedDetail(dtl)
    setRenewModalOpen(true)
  }

  const activeColumns = buildActiveLoanColumns(handleOpenRenew)
  const reservationColumns = buildReservationColumns(handleCancelReservation)

  if (loading) return <LoadingState tip="Đang tải dữ liệu mượn trả của bạn đọc..." />

  return (
    <div>
      <PageHeader
        title="Sách Mượn & Đặt Trước Của Tôi"
        subtitle="Theo dõi thời hạn các tài liệu đang giữ, yêu cầu gia hạn và hủy giữ chỗ sách"
        breadcrumbs={[
          { title: 'Trang chủ', href: '/' },
          { title: 'Sách mượn của tôi' },
        ]}
      />

      {/* Tabs Đang mượn / Lịch sử mượn trả */}
      <Card className="catalog-card" style={{ ...cardStyle, marginBottom: 'var(--sp-6)' }}>
        <Tabs
          defaultActiveKey="active"
          items={[
            {
              key: 'active',
              label: (
                <span style={{ fontWeight: 600 }}>
                  <ReadOutlined style={{ marginRight: 6 }} />
                  Đang Mượn ({activeDetails.length})
                </span>
              ),
              children: (
                <Table
                  columns={activeColumns}
                  dataSource={activeDetails}
                  rowKey="id"
                  pagination={false}
                  bordered
                  scroll={{ x: 750 }}
                  locale={{ emptyText: 'Hiện tại bạn không mượn cuốn sách nào.' }}
                />
              ),
            },
            {
              key: 'history',
              label: (
                <span style={{ fontWeight: 600 }}>
                  <CalendarOutlined style={{ marginRight: 6 }} />
                  Lịch Sử Mượn Trả ({historyDetails.length})
                </span>
              ),
              children: (
                <Table
                  columns={historyLoanColumns}
                  dataSource={historyDetails}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  bordered
                  scroll={{ x: 700 }}
                  locale={{ emptyText: 'Chưa có lịch sử mượn trả sách nào.' }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Khu vực Đặt trước của tôi */}
      <Card className="catalog-card" style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
          <ClockCircleOutlined style={{ fontSize: 20, color: 'var(--accent)' }} />
          <h3
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 20,
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            Danh Sách Đặt Giữ Chỗ Của Tôi ({reservations.length})
          </h3>
        </div>

        <Table
          columns={reservationColumns}
          dataSource={reservations}
          rowKey="id"
          pagination={false}
          bordered
          scroll={{ x: 750 }}
          locale={{ emptyText: 'Bạn không có yêu cầu đặt trước sách nào đang chờ.' }}
        />
      </Card>

      {/* Modal gia hạn */}
      <RenewModal
        open={renewModalOpen}
        loanDetail={selectedDetail}
        onClose={() => setRenewModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  )
}
