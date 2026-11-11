import React, { useEffect, useMemo, useState } from 'react'
import { Table, Button, Select, Space, Input, Empty, Row, Col, Card, Statistic } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, DollarOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { billingApi } from '../api'
import type { FineDto, FineStatus, FineSummaryStats } from '../types'
import { FinePaymentModal } from '../components/FinePaymentModal'
import { FineStatusTag } from '../components/FineStatusTag'
import { FINE_STATUS_OPTIONS, isFinePayable } from '../utils/fineStatus'
import { useAuth } from '@/features/identity'
import { PageHeader } from '@/shared/components/PageHeader'
import { SpineTag } from '@/shared/components/SpineTag'
import { ErrorState } from '@/shared/components/ErrorState'
import { formatCurrency, formatDate, getErrorMessage } from '@/shared/utils/format'
import {
  cardStyle,
  mutedText12Style,
  mutedText13Style,
  primaryButtonStyle,
  radiusStyle,
  strongTextStyle,
} from '@/shared/styles/ui'
import { useStableCallback, useRequestGuard } from '@/shared/hooks'

const SUPPORTED_PAGE_SIZES = [10, 20, 50] as const

const parseBillingQueryParams = (sp: URLSearchParams) => {
  const rawStatus = sp.get('status')
  const status = FINE_STATUS_OPTIONS.some((opt) => opt.value === rawStatus)
    ? (rawStatus as FineStatus)
    : undefined

  const keyword = (sp.get('keyword') || '').trim()

  const rawPage = sp.get('page')
  const parsedPage = rawPage ? Number(rawPage) : 1
  const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1

  const rawPageSize = sp.get('pageSize')
  const parsedPageSize = rawPageSize ? Number(rawPageSize) : 10
  const pageSize = SUPPORTED_PAGE_SIZES.includes(parsedPageSize as (typeof SUPPORTED_PAGE_SIZES)[number])
    ? parsedPageSize
    : 10

  const hasInvalidRaw =
    (rawStatus !== null && status === undefined) ||
    (rawPage !== null && (!Number.isInteger(parsedPage) || parsedPage < 1)) ||
    (rawPageSize !== null && !SUPPORTED_PAGE_SIZES.includes(parsedPageSize as (typeof SUPPORTED_PAGE_SIZES)[number]))

  return { status, keyword, page, pageSize, hasInvalidRaw }
}

const buildManagedSearchParams = (
  current: URLSearchParams,
  next: { status?: FineStatus; keyword?: string; page: number; pageSize: number }
) => {
  const sp = new URLSearchParams(current)

  if (next.status) sp.set('status', next.status)
  else sp.delete('status')

  const kw = next.keyword?.trim() || ''
  if (kw) sp.set('keyword', kw)
  else sp.delete('keyword')

  if (next.page > 1) sp.set('page', String(next.page))
  else sp.delete('page')

  if (next.pageSize !== 10) sp.set('pageSize', String(next.pageSize))
  else sp.delete('pageSize')

  return sp
}

export const AdminFinesPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isStaff } = useAuth()

  const {
    status: statusFilter,
    keyword,
    page,
    pageSize,
    hasInvalidRaw,
  } = useMemo(() => parseBillingQueryParams(searchParams), [searchParams])

  const [fines, setFines] = useState<FineDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keywordInput, setKeywordInput] = useState(keyword)
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState<FineSummaryStats | null>(null)

  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedFine, setSelectedFine] = useState<FineDto | null>(null)

  const guard = useRequestGuard()

  // Chuẩn hóa các query params không hợp lệ trên URL (không tạo history entry thừa)
  useEffect(() => {
    if (!hasInvalidRaw) return
    const normalized = buildManagedSearchParams(searchParams, {
      status: statusFilter,
      keyword,
      page,
      pageSize,
    })
    if (normalized.toString() !== searchParams.toString()) {
      setSearchParams(normalized, { replace: true })
    }
  }, [hasInvalidRaw, searchParams, statusFilter, keyword, page, pageSize, setSearchParams])

  // Đồng bộ ô input tìm kiếm khi URL đổi (Back/Forward/F5/Reset)
  useEffect(() => {
    setKeywordInput(keyword)
  }, [keyword])

  const updateUrl = (patch: { status?: FineStatus; keyword?: string; page: number; pageSize: number }) => {
    const next = buildManagedSearchParams(searchParams, patch)
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next)
    }
  }

  const fetchFines = useStableCallback(async () => {
    const reqId = guard.next()
    try {
      setLoading(true)
      setError(null)
      const res = await billingApi.getAllFines({
        status: statusFilter,
        keyword: keyword || undefined,
        page,
        pageSize,
      })
      if (!guard.isLatest(reqId)) return
      setFines(res.items)
      setTotalCount(res.totalCount)
      setSummary(res.summary)
    } catch (err: unknown) {
      if (!guard.isLatest(reqId)) return
      setSummary(null)
      setError(getErrorMessage(err, 'Không thể tải danh sách phiếu phạt'))
    } finally {
      if (guard.isLatest(reqId)) setLoading(false)
    }
  })

  useEffect(() => {
    fetchFines()
  }, [page, pageSize, statusFilter, keyword, fetchFines])

  const handleOpenPay = (fine: FineDto) => {
    setSelectedFine(fine)
    setPaymentModalOpen(true)
  }

  const handleSearch = (val: string) => {
    const trimmed = val.trim()
    setKeywordInput(trimmed)
    updateUrl({
      status: statusFilter,
      keyword: trimmed,
      page: 1,
      pageSize,
    })
  }

  const handleStatusChange = (val: FineStatus | undefined) => {
    updateUrl({
      status: val,
      keyword,
      page: 1,
      pageSize,
    })
  }

  const handleResetFilters = () => {
    setKeywordInput('')
    updateUrl({
      status: undefined,
      keyword: '',
      page: 1,
      pageSize,
    })
  }

  const columns: ColumnsType<FineDto> = [
    {
      title: 'Mã phiếu',
      dataIndex: 'fineNumber',
      key: 'fineNumber',
      width: 120,
      render: (num: string) => <SpineTag variant="neutral">{num}</SpineTag>,
    },
    {
      title: 'Bạn đọc',
      key: 'reader',
      width: 200,
      render: (_, r) => (
        <div>
          <div style={strongTextStyle}>{r.readerName}</div>
          {r.accountId !== undefined && <div style={mutedText12Style}>#{r.accountId}</div>}
          {r.readerEmail && <div style={mutedText12Style}>{r.readerEmail}</div>}
        </div>
      ),
    },
    {
      title: 'Lý do xử phạt',
      dataIndex: 'description',
      key: 'description',
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
            color: isFinePayable(r) ? 'var(--destructive)' : 'var(--primary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(amt)}
        </span>
      ),
    },
    {
      title: 'Ngày lập',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (status: string) => <FineStatusTag status={status} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      render: (_, r) => {
        if (isStaff && isFinePayable(r)) {
          return (
            <Button
              size="small"
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => handleOpenPay(r)}
              style={primaryButtonStyle}
            >
              Thu tiền
            </Button>
          )
        }
        if (r.status === 'Paid') {
          return <span style={mutedText12Style}>Đã hoàn tất</span>
        }
        if (r.status === 'Cancelled') {
          return <span style={mutedText12Style}>Đã hủy</span>
        }
        return <span style={mutedText12Style}>—</span>
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Quản Lý Phiếu Phạt Toàn Viện"
        subtitle="Theo dõi công nợ, thu tiền phạt trễ hạn và bồi hoàn sách của độc giả"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Phiếu phạt' },
        ]}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/fines/new')}
            style={primaryButtonStyle}
          >
            Lập phiếu phạt mới
          </Button>
        }
      />

      {!error && (loading || summary !== null) && (
        <div style={{ marginBottom: 'var(--sp-4)' }} data-testid="admin-fines-summary">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card size="small" style={cardStyle}>
                <Statistic
                  title="Tổng tiền phạt"
                  loading={loading}
                  value={summary ? formatCurrency(summary.totalFineAmount) : '—'}
                  styles={{ content: { color: 'var(--foreground)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" style={cardStyle}>
                <Statistic
                  title="Đã thu"
                  loading={loading}
                  value={summary ? formatCurrency(summary.totalPaidAmount) : '—'}
                  styles={{ content: { color: 'var(--primary)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" style={cardStyle}>
                <Statistic
                  title="Còn phải thu"
                  loading={loading}
                  value={summary ? formatCurrency(summary.totalRemainingAmount) : '—'}
                  styles={{ content: { color: 'var(--destructive)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' } }}
                />
              </Card>
            </Col>
          </Row>
          <div style={{ ...mutedText12Style, marginTop: 6 }}>
            {statusFilter || keyword
              ? 'Thống kê tính trên toàn bộ phiếu khớp bộ lọc hiện tại (không bao gồm dư nợ/tổng phạt của phiếu đã hủy).'
              : 'Thống kê tính trên toàn bộ phiếu phạt khớp danh sách hiện hành (tổng tiền phạt & còn phải thu không tính phiếu đã hủy).'}
          </div>
        </div>
      )}

      <div
        style={{
          background: 'var(--card)',
          padding: 'var(--sp-4)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          marginBottom: 'var(--sp-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--sp-3)',
        }}
      >
        <Space wrap>
          <Input.Search
            placeholder="Tìm theo mã phiếu, tên bạn đọc, email..."
            allowClear
            value={keywordInput}
            onChange={(e) => {
              const nextVal = e.target.value
              setKeywordInput(nextVal)
              if (nextVal === '' && keyword !== '') {
                updateUrl({
                  status: statusFilter,
                  keyword: '',
                  page: 1,
                  pageSize,
                })
              }
            }}
            onSearch={handleSearch}
            enterButton="Tìm"
            style={{ width: 320, maxWidth: '100%' }}
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>
            Lọc trạng thái:
          </span>
          <Select<FineStatus>
            placeholder="Tất cả trạng thái"
            allowClear
            value={statusFilter}
            onChange={handleStatusChange}
            style={{ width: 210 }}
            options={FINE_STATUS_OPTIONS}
          />
          {(statusFilter || keyword) && (
            <Button onClick={handleResetFilters} style={radiusStyle}>
              Xóa bộ lọc
            </Button>
          )}
        </Space>

        <span style={mutedText13Style}>
          Tổng số: <strong>{totalCount}</strong> phiếu phạt
        </span>
      </div>

      {error ? (
        <ErrorState title="Lỗi tải danh sách phiếu phạt" subTitle={error} onRetry={fetchFines} />
      ) : (
        <Table
          columns={columns}
          dataSource={fines}
          rowKey="id"
          loading={loading}
          bordered
          scroll={{ x: 920 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  keyword || statusFilter
                    ? 'Không tìm thấy phiếu phạt nào phù hợp với điều kiện lọc.'
                    : 'Chưa có phiếu phạt nào trong hệ thống.'
                }
              />
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            pageSizeOptions: SUPPORTED_PAGE_SIZES.map(String),
            showTotal: (total) => `Tổng ${total} phiếu phạt`,
            onChange: (p, ps) => {
              const validPs = SUPPORTED_PAGE_SIZES.includes(ps as (typeof SUPPORTED_PAGE_SIZES)[number]) ? ps : 10
              updateUrl({
                status: statusFilter,
                keyword,
                page: validPs !== pageSize ? 1 : p,
                pageSize: validPs,
              })
            },
          }}
        />
      )}

      <FinePaymentModal
        open={paymentModalOpen}
        fine={selectedFine}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={fetchFines}
      />
    </div>
  )
}
