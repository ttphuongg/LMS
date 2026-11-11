import React, { useEffect, useState } from 'react'
import { Table, Button } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { catalogApi } from '../api'
import type { BookDto, BookStatus } from '../types'
import { AddCopiesModal } from '../components/AddCopiesModal'
import { BookCopiesDrawer } from '../components/BookCopiesDrawer'
import { BookSearchBar } from '../components/BookSearchBar'
import { buildAdminBookColumns } from '../components/adminBookColumns'
import { useAddCopies } from '../hooks/useAddCopies'
import { PageHeader } from '@/shared/components/PageHeader'
import { useStableCallback, useRequestGuard } from '@/shared/hooks'
import { primaryButtonStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

export const AdminBookListPage: React.FC = () => {
  const navigate = useNavigate()
  const [books, setBooks] = useState<BookDto[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [drawerBook, setDrawerBook] = useState<BookDto | null>(null)
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0)
  const [togglingBookId, setTogglingBookId] = useState<string | null>(null)

  const guard = useRequestGuard()

  const fetchBooks = useStableCallback(async () => {
    const reqId = guard.next()
    try {
      setLoading(true)
      const res = await catalogApi.getBooks({
        keyword: keyword.trim() || undefined,
        status: statusFilter,
        includeInactive: true,
        page,
        pageSize,
      })
      if (!guard.isLatest(reqId)) return
      setBooks(res.items)
      setTotalCount(res.totalCount)
    } catch (err: unknown) {
      if (guard.isLatest(reqId)) message.error(getErrorMessage(err, 'Lỗi khi tải danh sách sách'))
    } finally {
      if (guard.isLatest(reqId)) setLoading(false)
    }
  })

  useEffect(() => {
    fetchBooks()
  }, [page, pageSize, statusFilter, fetchBooks])

  const applyFilter = () => {
    if (page === 1) fetchBooks()
    else setPage(1)
  }

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val)
    setPage(1)
  }

  const handleToggleStatus = async (book: BookDto) => {
    const nextStatus: BookStatus = book.status === 'Inactive' ? 'Active' : 'Inactive'
    try {
      setTogglingBookId(book.id)
      await catalogApi.updateBookStatus(book.id, nextStatus)
      message.success(
        nextStatus === 'Inactive'
          ? `Đã chuyển "${book.title}" sang Ngừng lưu hành.`
          : `Đã kích hoạt lại lưu hành "${book.title}".`
      )
      await fetchBooks()
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Không thể cập nhật trạng thái đầu sách'))
    } finally {
      setTogglingBookId(null)
    }
  }

  const addCopies = useAddCopies(() => {
    fetchBooks()
    setDrawerRefreshKey((k) => k + 1)
  })

  const columns = buildAdminBookColumns({
    onView: (book) => navigate(`/books/${book.id}`),
    onEdit: (book) => navigate(`/admin/books/${book.id}/edit`),
    onManageCopies: (book) => setDrawerBook(book),
    onAddCopies: addCopies.openFor,
    onToggleStatus: handleToggleStatus,
    togglingBookId,
  })

  return (
    <div>
      <PageHeader
        title="Quản Lý Mục Lục Sách"
        subtitle="Quản lý danh mục đầu sách, trạng thái lưu hành, bản sao vật lý và xếp kệ"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Danh mục sách' },
        ]}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/books/new')}
            style={primaryButtonStyle}
          >
            Nhập sách mới
          </Button>
        }
      />

      <BookSearchBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        onSearch={applyFilter}
        totalCount={totalCount}
        selectedCount={selectedRowKeys.length}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onViewSelected={() => {
          if (selectedRowKeys.length === 1) {
            navigate(`/books/${selectedRowKeys[0]}`)
          }
        }}
      />

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        columns={columns}
        dataSource={books}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1050 }}
        pagination={{
          current: page,
          pageSize,
          total: totalCount,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setSelectedRowKeys([])
            setPage(p)
            setPageSize(ps)
          },
        }}
        bordered
      />

      {/* Drawer Quản lý bản sao & Xếp kệ */}
      <BookCopiesDrawer
        open={drawerBook !== null}
        book={drawerBook}
        refreshKey={drawerRefreshKey}
        onClose={() => setDrawerBook(null)}
        onChanged={fetchBooks}
        onOpenAddCopies={(b) => addCopies.openFor(b)}
      />

      {/* Modal Thêm bản sao */}
      <AddCopiesModal addCopies={addCopies} />
    </div>
  )
}
