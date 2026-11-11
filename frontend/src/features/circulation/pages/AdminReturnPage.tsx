import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Card, Select, Button, Table, Spin, Empty, Input, Space } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import type { ColumnsType } from 'antd/es/table'
import { CheckOutlined, WarningOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { circulationApi } from '../api'
import type { LoanSlipDto, LoanDetailDto } from '../types'
import { IncidentModal } from '../components/IncidentModal'
import { useIncidentReport } from '../hooks/useIncidentReport'
import { PageHeader } from '@/shared/components/PageHeader'
import { SpineTag } from '@/shared/components/SpineTag'
import { BookTitleCell } from '@/shared/components/BookTitleCell'
import { formatDate, getErrorMessage } from '@/shared/utils/format'
import { cardStyle, mutedText13Style, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'

export const AdminReturnPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialLoanId = searchParams.get('loanId')?.trim() || undefined

  const [loans, setLoans] = useState<LoanSlipDto[]>([])
  const [loansLoading, setLoansLoading] = useState(false)
  const [selectedLoanId, setSelectedLoanId] = useState<string | undefined>(initialLoanId)
  const [selectedLoan, setSelectedLoan] = useState<LoanSlipDto | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedDetailIds, setSelectedDetailIds] = useState<React.Key[]>([])
  const [submittingReturn, setSubmittingReturn] = useState(false)
  const [lookupLoanIdInput, setLookupLoanIdInput] = useState('')

  // Request counter để chống race condition khi đổi phiếu nhanh
  const detailReqCounter = useRef(0)
  const searchReqCounter = useRef(0)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Modal báo cáo sự cố
  const incident = useIncidentReport()

  const fetchLoanDetail = useCallback(async (loanId: string) => {
    const currentReq = ++detailReqCounter.current
    try {
      setDetailLoading(true)
      setSelectedDetailIds([])

      const detailed = await circulationApi.getLoanById(loanId)
      if (currentReq !== detailReqCounter.current) return

      setSelectedLoan(detailed)
      setLoans((prev) => (prev.some((l) => l.id === detailed.id) ? prev : [detailed, ...prev]))
    } catch (err: unknown) {
      if (currentReq !== detailReqCounter.current) return
      setSelectedLoan(null)
      message.error(getErrorMessage(err, 'Không thể tải chi tiết phiếu mượn'))
    } finally {
      if (currentReq === detailReqCounter.current) {
        setDetailLoading(false)
      }
    }
  }, [])

  const loadLoans = useCallback(async (preferredId?: string, keyword?: string) => {
    const reqId = ++searchReqCounter.current
    try {
      setLoansLoading(true)
      const res = await circulationApi.getAllLoans({ openOnly: true, keyword, page: 1, pageSize: 50 })
      if (reqId !== searchReqCounter.current) return
      const openLoans = res.items || []
      setLoans(openLoans)

      if (!keyword) {
        const targetId = preferredId || (openLoans.length > 0 ? openLoans[0].id : undefined)
        if (targetId) {
          setSelectedLoanId(targetId)
          fetchLoanDetail(targetId)
        } else {
          setSelectedLoanId(undefined)
          setSelectedLoan(null)
        }
      }
    } catch (err: unknown) {
      if (reqId !== searchReqCounter.current) return
      message.error(getErrorMessage(err, 'Không thể tải danh sách phiếu mượn'))
    } finally {
      if (reqId === searchReqCounter.current) setLoansLoading(false)
    }
  }, [fetchLoanDetail])

  useEffect(() => {
    loadLoans(initialLoanId)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [initialLoanId, loadLoans])

  const handleSelectLoan = (id: string) => {
    setSelectedLoanId(id)
    fetchLoanDetail(id)
  }

  const handleSearchLoans = (kw: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      loadLoans(selectedLoanId, kw.trim() || undefined)
    }, 300)
  }

  const handleOpenById = async () => {
    const raw = lookupLoanIdInput.trim()
    if (!raw) {
      message.warning('Vui lòng nhập số phiếu (VD: 15, LS-15), tên bạn đọc hoặc mã vạch sách')
      return
    }
    const strippedId = raw.replace(/^LS-/i, '').trim()
    if (/^\d+$/.test(strippedId)) {
      setSelectedLoanId(strippedId)
      fetchLoanDetail(strippedId)
      return
    }
    try {
      setLoansLoading(true)
      const res = await circulationApi.getAllLoans({ openOnly: true, keyword: raw, page: 1, pageSize: 20 })
      const matches = res.items || []
      if (matches.length === 0) {
        message.warning(`Không tìm thấy phiếu mượn đang mở nào khớp với "${raw}"`)
        return
      }
      setLoans(matches)
      setSelectedLoanId(matches[0].id)
      fetchLoanDetail(matches[0].id)
      if (matches.length > 1) {
        message.info(`Tìm thấy ${matches.length} phiếu khớp; đang mở ${matches[0].slipNumber}, bạn có thể chọn thêm ở danh sách phía trên.`)
      }
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Không thể tìm kiếm phiếu mượn'))
    } finally {
      setLoansLoading(false)
    }
  }

  const handleConfirmReturn = async () => {
    if (!selectedLoan || selectedDetailIds.length === 0) {
      message.warning('Vui lòng tích chọn ít nhất một cuốn sách được bạn đọc hoàn trả')
      return
    }
    try {
      setSubmittingReturn(true)
      await circulationApi.returnLoan(selectedLoan.id, {
        returnedCopies: selectedDetailIds.map((dId) => ({
          loanSlipDetailId: String(dId),
          notes: 'Đã hoàn trả tại quầy thủ thư',
        })),
      })
      message.success(`Đã xác nhận thu hồi ${selectedDetailIds.length} cuốn sách thành công!`)
      navigate('/admin/loans')
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi xác nhận hoàn trả'))
    } finally {
      setSubmittingReturn(false)
    }
  }

  const columns: ColumnsType<LoanDetailDto> = [
    {
      title: 'Mã bản sao',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 140,
      render: (code: string) => <SpineTag variant="primary">{code}</SpineTag>,
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
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        if (status === 'Returned') return <SpineTag variant="neutral">Đã trả</SpineTag>
        if (status === 'Overdue') return <SpineTag variant="danger">Quá hạn</SpineTag>
        return <SpineTag variant="primary">Đang mượn</SpineTag>
      },
    },
    {
      title: 'Sự cố tài liệu',
      key: 'incident',
      width: 140,
      render: (_, r) => (
        <Button
          size="small"
          danger
          disabled={r.status === 'Returned'}
          icon={<WarningOutlined />}
          onClick={() => incident.openFor(r)}
        >
          Báo hỏng / Mất
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Thu Hồi Trả Sách & Xử Lý Sự Cố"
        subtitle="Tiếp nhận tài liệu hoàn trả tại quầy, kiểm tra hư hại và lập biên bản bồi thường"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Sổ mượn trả', href: '/admin/loans' },
          { title: 'Nhận trả sách' },
        ]}
      />

      <div style={{ maxWidth: 920 }}>
        {/* Chọn phiếu mượn */}
        <Card className="catalog-card" style={{ ...cardStyle, marginBottom: 'var(--sp-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)', flexWrap: 'wrap', gap: 8 }}>
            <label style={{ fontWeight: 600, color: 'var(--foreground)' }}>
              Chọn phiếu mượn đang lưu hành hoặc nhập mã phiếu:
            </label>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => loadLoans(selectedLoanId)} loading={loansLoading}>
              Tải lại danh sách
            </Button>
          </div>
          <Space direction="vertical" style={{ width: '100%' }} size={10}>
            <Select
              showSearch
              filterOption={false}
              onSearch={handleSearchLoans}
              onClear={() => loadLoans(selectedLoanId)}
              allowClear
              placeholder={loansLoading ? 'Đang tải danh sách phiếu mượn...' : 'Gõ để tìm theo số phiếu, tên bạn đọc hoặc mã vạch sách'}
              value={selectedLoanId}
              onChange={handleSelectLoan}
              loading={loansLoading}
              notFoundContent={loansLoading ? <Spin size="small" /> : 'Không tìm thấy phiếu mượn đang mở phù hợp'}
              style={{ width: '100%' }}
              options={loans.map((l) => ({
                label: `${l.slipNumber} • ${l.readerName} (Ngày mượn: ${formatDate(l.borrowDate)})`,
                value: l.id,
              }))}
            />
            <Space.Compact style={{ maxWidth: 420, width: '100%' }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Mở nhanh theo số phiếu (LS-15), tên bạn đọc hoặc mã vạch"
                value={lookupLoanIdInput}
                onChange={(e) => setLookupLoanIdInput(e.target.value)}
                onPressEnter={handleOpenById}
              />
              <Button onClick={handleOpenById}>Tìm &amp; Mở</Button>
            </Space.Compact>
          </Space>
        </Card>

        {detailLoading && (
          <Card className="catalog-card" style={{ ...cardStyle, textAlign: 'center', padding: 'var(--sp-8)' }}>
            <Spin description="Đang tải chi tiết các tài liệu trong phiếu mượn..." />
          </Card>
        )}

        {!detailLoading && selectedLoan && (
          <Card className="catalog-card" style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--sp-2)',
                marginBottom: 'var(--sp-4)',
                paddingBottom: 'var(--sp-3)',
                borderBottom: '1px dashed var(--border)',
              }}
            >
              <div>
                <span style={mutedText13Style}>Bạn đọc: </span>
                <strong style={{ color: 'var(--foreground)' }}>{selectedLoan.readerName}</strong>
                {selectedLoan.readerEmail ? ` (${selectedLoan.readerEmail})` : ''}
              </div>
              <div>
                <span style={mutedText13Style}>Số phiếu: </span>
                <SpineTag variant="primary">{selectedLoan.slipNumber}</SpineTag>
              </div>
              <div>
                <span style={mutedText13Style}>Ngày mượn: </span>
                <strong>{formatDate(selectedLoan.borrowDate)}</strong>
              </div>
              <div>
                <span style={mutedText13Style}>Hạn trả: </span>
                <strong style={{ color: 'var(--accent)' }}>{formatDate(selectedLoan.dueDate)}</strong>
              </div>
            </div>

            <Table
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys: selectedDetailIds,
                onChange: (keys) => setSelectedDetailIds(keys),
                getCheckboxProps: (record) => ({
                  disabled: record.status === 'Returned',
                }),
              }}
              columns={columns}
              dataSource={selectedLoan.details}
              rowKey="id"
              pagination={false}
              bordered
              locale={{
                emptyText: <Empty description="Phiếu mượn này không có chi tiết bản sao nào." />,
              }}
            />

            <div style={{ marginTop: 'var(--sp-5)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)' }}>
              <Button onClick={() => navigate('/admin/loans')} style={radiusStyle}>Hủy bỏ</Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={submittingReturn}
                disabled={selectedDetailIds.length === 0}
                onClick={handleConfirmReturn}
                style={primaryButtonStyle}
              >
                Xác nhận hoàn trả ({selectedDetailIds.length} cuốn)
              </Button>
            </div>
          </Card>
        )}

        {!detailLoading && !selectedLoan && loans.length === 0 && !loansLoading && (
          <Card className="catalog-card" style={{ ...cardStyle, textAlign: 'center', padding: 'var(--sp-6)' }}>
            <Empty description="Hiện không có phiếu mượn nào cần trả sách trong hệ thống." />
          </Card>
        )}
      </div>

      {/* Modal Lập biên bản sự cố */}
      <IncidentModal incident={incident} />
    </div>
  )
}
