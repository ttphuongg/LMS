import React, { useEffect, useState } from 'react'
import { Table, Button, Select, Space, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, RollbackOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { circulationApi } from '../api'
import type { LoanSlipDto } from '../types'
import { PageHeader } from '@/shared/components/PageHeader'
import { SpineTag } from '@/shared/components/SpineTag'
import { ErrorState } from '@/shared/components/ErrorState'
import { formatDate, getErrorMessage } from '@/shared/utils/format'
import { useStableCallback, useRequestGuard } from '@/shared/hooks'
import {
  mutedText12Style,
  mutedText13Style,
  outlineButtonStyle,
  primaryButtonStyle,
  radiusStyle,
  strongTextStyle,
} from '@/shared/styles/ui'

export const AdminLoansPage: React.FC = () => {
  const navigate = useNavigate()
  const [loans, setLoans] = useState<LoanSlipDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const guard = useRequestGuard()

  const fetchLoans = useStableCallback(async () => {
    const reqId = guard.next()
    try {
      setLoading(true)
      setError(null)
      const res = await circulationApi.getAllLoans({
        status: statusFilter,
        keyword,
        page,
        pageSize,
      })
      if (!guard.isLatest(reqId)) return
      setLoans(res.items)
      setTotalCount(res.totalCount)
    } catch (err: unknown) {
      if (!guard.isLatest(reqId)) return
      setError(getErrorMessage(err, 'Không thể tải danh sách phiếu mượn'))
    } finally {
      if (guard.isLatest(reqId)) setLoading(false)
    }
  })

  useEffect(() => {
    fetchLoans()
  }, [page, pageSize, statusFilter, keyword, fetchLoans])

  const handleStatusChange = (val: string | undefined) => {
    setStatusFilter(val)
    setPage(1)
  }

  const handleSearchSubmit = (val: string) => {
    setKeyword(val.trim())
    setPage(1)
  }

  const columns: ColumnsType<LoanSlipDto> = [
    {
      title: 'Số phiếu mượn',
      dataIndex: 'slipNumber',
      key: 'slipNumber',
      width: 140,
      render: (num: string) => <SpineTag variant="primary">{num}</SpineTag>,
    },
    {
      title: 'Bạn đọc',
      key: 'reader',
      render: (_, r) => (
        <div>
          <div style={strongTextStyle}>{r.readerName}</div>
          <div style={mutedText12Style}>{r.readerEmail}</div>
        </div>
      ),
    },
    {
      title: 'Tài liệu mượn',
      key: 'details',
      render: (_, r) => {
        if (r.details && r.details.length > 0) {
          return (
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
              {r.details.map((d) => (
                <li key={d.id}>
                  {d.bookTitle} (<span className="tabular-numbers">{d.barcode}</span>)
                </li>
              ))}
            </ul>
          )
        }
        return <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{r.detailCount ? `${r.detailCount} tài liệu` : '—'}</span>
      },
    },
    {
      title: 'Ngày mượn',
      dataIndex: 'borrowDate',
      key: 'borrowDate',
      width: 120,
      render: (date: string) => (date ? formatDate(date) : '—'),
    },
    {
      title: 'Hạn trả',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: string) => (date ? formatDate(date) : '—'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => {
        const s = (status || '').trim()
        if (s === 'Active' || s === 'Borrowing') {
          return <SpineTag variant="primary">Đang lưu hành</SpineTag>
        }
        if (s === 'Overdue') {
          return <SpineTag variant="danger">Quá hạn</SpineTag>
        }
        if (s === 'Returned') {
          return <SpineTag variant="neutral">Đã trả đủ</SpineTag>
        }
        if (s === 'Pending') {
          return <SpineTag variant="warning">Chờ xử lý</SpineTag>
        }
        if (s === 'Cancelled') {
          return <SpineTag variant="neutral">Đã hủy</SpineTag>
        }
        return <SpineTag variant="warning">{s || 'Chưa xác định'}</SpineTag>
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      render: (_, r) => (
        <Button
          size="small"
          icon={<RollbackOutlined />}
          onClick={() => navigate(`/admin/loans/return?loanId=${r.id}`)}
          style={outlineButtonStyle}
        >
          Xử lý trả
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Sổ Lưu Thông Mượn Trả"
        subtitle="Quản lý toàn bộ các phiếu mượn tài liệu đang lưu hành trong toàn thư viện"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Sổ mượn trả' },
        ]}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/loans/borrow')}
              style={primaryButtonStyle}
            >
              Lập phiếu mượn tại quầy
            </Button>
            <Button
              icon={<RollbackOutlined />}
              onClick={() => navigate('/admin/loans/return')}
              style={outlineButtonStyle}
            >
              Thu hồi trả sách & Sự cố
            </Button>
          </Space>
        }
      />

      <div
        style={{
          background: 'var(--card)',
          padding: 'var(--sp-3) var(--sp-4)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          marginBottom: 'var(--sp-4)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 'var(--sp-3)',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Số phiếu (LS-...), bạn đọc hoặc mã vạch..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              if (!e.target.value) handleSearchSubmit('')
            }}
            onSearch={handleSearchSubmit}
            enterButton={<SearchOutlined />}
            style={{ width: 290 }}
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>Trạng thái:</span>
          <Select
            placeholder="Tất cả trạng thái"
            allowClear
            value={statusFilter}
            onChange={handleStatusChange}
            style={{ width: 220 }}
            options={[
              { label: 'Đang lưu hành (Borrowing)', value: 'Borrowing' },
              { label: 'Quá hạn (Overdue)', value: 'Overdue' },
              { label: 'Đã hoàn trả (Returned)', value: 'Returned' },
              { label: 'Chờ xử lý (Pending)', value: 'Pending' },
              { label: 'Đã hủy (Cancelled)', value: 'Cancelled' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchLoans} style={radiusStyle}>
            Làm mới
          </Button>
        </Space>

        <span style={mutedText13Style}>
          Tổng số: <strong>{totalCount}</strong> phiếu mượn
        </span>
      </div>

      {error ? (
        <ErrorState title="Lỗi tải danh sách phiếu mượn" subTitle={error} onRetry={fetchLoans} />
      ) : (
        <Table
          columns={columns}
          dataSource={loans}
          rowKey="id"
          loading={loading}
          bordered
          scroll={{ x: 800 }}
          pagination={{
            current: page,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Tổng ${total} phiếu mượn`,
            onChange: (p, ps) => {
              setPage(ps !== pageSize ? 1 : p)
              setPageSize(ps)
            },
          }}
        />
      )}
    </div>
  )
}
