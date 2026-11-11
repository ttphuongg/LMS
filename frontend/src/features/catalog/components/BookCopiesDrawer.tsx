import React, { useCallback, useEffect, useState } from 'react'
import { Drawer, Table, Select, Tag, Button, Space, Input, Alert } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { catalogApi } from '../api'
import type { BookCopyDto, BookDto, CopyLookupDto, CopyStatus, LocationDto } from '../types'
import { SpineTag } from '@/shared/components/SpineTag'
import { getErrorMessage } from '@/shared/utils/format'
import { modalTitleStyle, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'

interface BookCopiesDrawerProps {
  open: boolean
  book: BookDto | null
  refreshKey?: number
  onClose: () => void
  onChanged: () => void
  onOpenAddCopies: (book: BookDto) => void
}

const COPY_STATUS_OPTIONS: { label: string; value: CopyStatus }[] = [
  { label: 'Sẵn sàng (Available)', value: 'Available' },
  { label: 'Bảo trì (Maintenance)', value: 'Maintenance' },
  { label: 'Bị mất (Lost)', value: 'Lost' },
  { label: 'Ngừng lưu hành (Inactive)', value: 'Inactive' },
]

/** Drawer quản lý bản sao & gán/đổi vị trí kệ cho đầu sách (hỗ trợ cả tra cứu barcode). */
export const BookCopiesDrawer: React.FC<BookCopiesDrawerProps> = ({
  open,
  book,
  refreshKey = 0,
  onClose,
  onChanged,
  onOpenAddCopies,
}) => {
  const [copies, setCopies] = useState<BookCopyDto[]>([])
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [lookupResult, setLookupResult] = useState<CopyLookupDto | null>(null)

  const loadData = useCallback(async () => {
    if (!book) return
    try {
      setLoading(true)
      const [copyList, locList] = await Promise.all([
        catalogApi.getBookCopies(book.id),
        catalogApi.getLocations(true),
      ])
      setCopies(copyList)
      setLocations(locList)
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Không thể tải danh sách bản sao hoặc vị trí kệ'))
    } finally {
      setLoading(false)
    }
  }, [book])

  useEffect(() => {
    if (open && book) {
      setLookupResult(null)
      setBarcodeInput('')
      loadData()
    }
  }, [open, book, refreshKey, loadData])

  const handleChangeLocation = async (copyId: string, newLocationId?: number) => {
    try {
      setUpdatingId(copyId)
      await catalogApi.updateCopyLocation(copyId, newLocationId ?? null)
      message.success('Đã cập nhật vị trí kệ cho bản sao!')
      await loadData()
      onChanged()
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Không thể cập nhật vị trí bản sao'))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleChangeStatus = async (copyId: string, status: CopyStatus) => {
    try {
      setUpdatingId(copyId)
      await catalogApi.updateCopyStatus(copyId, { status })
      message.success('Đã cập nhật trạng thái bản sao!')
      await loadData()
      onChanged()
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Không thể cập nhật trạng thái bản sao'))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleBarcodeLookup = async () => {
    const code = barcodeInput.trim()
    if (!code) {
      setLookupResult(null)
      return
    }
    try {
      const found = await catalogApi.lookupCopyByBarcode(code)
      setLookupResult(found)
    } catch (err: unknown) {
      setLookupResult(null)
      message.error(getErrorMessage(err, 'Không tìm thấy mã vạch bản sao'))
    }
  }

  const locationOptions = locations.map((loc) => {
    const count = loc.currentCount ?? 0
    const isFull = loc.maxCapacity != null && count >= loc.maxCapacity
    const capText = loc.maxCapacity != null ? `${count}/${loc.maxCapacity}` : `${count}`
    return {
      value: loc.id,
      disabled: isFull,
      label: `${loc.aisle} - ${loc.shelf} - Tầng ${loc.rowLevel} (${capText}${isFull ? ' Đầy' : ''})`,
    }
  })

  const columns: ColumnsType<BookCopyDto> = [
    {
      title: 'Mã vạch',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 155,
      render: (code: string) => <SpineTag variant="primary">{code}</SpineTag>,
    },
    {
      title: 'Tình trạng',
      dataIndex: 'condition',
      key: 'condition',
      width: 115,
      render: (cond: string) => <Tag>{cond || 'Good'}</Tag>,
    },
    {
      title: 'Vị trí kệ (Xếp kệ)',
      key: 'location',
      width: 260,
      render: (_, r) => (
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Chưa xếp kệ"
          value={r.locationId ?? undefined}
          disabled={updatingId === r.id}
          loading={updatingId === r.id}
          onChange={(val) => handleChangeLocation(r.id, val)}
          style={{ width: '100%' }}
          options={locationOptions}
        />
      ),
    },
    {
      title: 'Trạng thái bản sao',
      dataIndex: 'status',
      key: 'status',
      width: 210,
      render: (status: CopyStatus, r) => {
        const isLockedByCirculation = status === 'Borrowed' || status === 'Reserved'
        if (isLockedByCirculation) {
          return (
            <SpineTag variant={status === 'Borrowed' ? 'danger' : 'warning'}>
              {status === 'Borrowed' ? 'Đang được mượn' : 'Đang giữ chỗ'}
            </SpineTag>
          )
        }
        return (
          <Select
            value={status}
            disabled={updatingId === r.id}
            loading={updatingId === r.id}
            onChange={(val) => handleChangeStatus(r.id, val)}
            style={{ width: '100%' }}
            options={COPY_STATUS_OPTIONS}
          />
        )
      },
    },
  ]

  return (
    <Drawer
      title={
        <span style={modalTitleStyle}>
          Quản Lý Bản Sao & Xếp Kệ — {book?.title}
        </span>
      }
      placement="right"
      size={Math.min(820, typeof window !== 'undefined' ? window.innerWidth - 32 : 820)}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading} style={radiusStyle}>
            Làm mới
          </Button>
          {book && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => onOpenAddCopies(book)}
              style={primaryButtonStyle}
            >
              + Bổ sung bản sao
            </Button>
          )}
        </Space>
      }
    >
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <Space.Compact style={{ width: '100%', maxWidth: 420 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tra cứu nhanh toàn kho theo mã vạch..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onPressEnter={handleBarcodeLookup}
            allowClear
          />
          <Button onClick={handleBarcodeLookup}>Tra cứu mã vạch</Button>
        </Space.Compact>

        {lookupResult && (
          <Alert
            type="info"
            showIcon
            closable
            onClose={() => setLookupResult(null)}
            style={{ marginTop: 'var(--sp-3)', borderRadius: 'var(--radius)' }}
            title={`${lookupResult.barcode} — ${lookupResult.bookTitle || `Sách #${lookupResult.bookId}`}`}
            description={`Vị trí: ${lookupResult.locationLabel || 'Chưa xếp kệ'} • Trạng thái: ${lookupResult.status} • Tình trạng: ${lookupResult.condition}`}
          />
        )}
      </div>

      <Table
        columns={columns}
        dataSource={copies}
        rowKey="id"
        loading={loading}
        bordered
        pagination={{ pageSize: 10 }}
        scroll={{ x: 740 }}
        locale={{ emptyText: 'Đầu sách này chưa có bản sao vật lý nào.' }}
      />
    </Drawer>
  )
}
