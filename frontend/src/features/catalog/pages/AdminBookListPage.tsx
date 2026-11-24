import React, { useEffect, useMemo, useState } from 'react'
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
import { useStableCallback } from '@/shared/hooks'
import { primaryButtonStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'
import { createBookFuse, filterBooksByKeyword } from '../utils/bookSearch'

export const AdminBookListPage: React.FC = () => {
  const navigate = useNavigate()
  const [allBooks, setAllBooks] = useState<BookDto[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [drawerBook, setDrawerBook] = useState<BookDto | null>(null)
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0)
  const [togglingBookId, setTogglingBookId] = useState<string | null>(null)

  const fetchBooks = useStableCallback(async () => {
    try {
      setLoading(true)
      // Tải toàn bộ sách (bao gồm cả Inactive) để tìm kiếm tức thì ở Client
      const res = await catalogApi.getBooks({
        includeInactive: true,
        page: 1,
        pageSize: 1000,
      })
      setAllBooks(res.items)
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi tải danh sách sách'))
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  // Cấu hình Fuse.js trên RAM
  const fuse = useMemo(() => createBookFuse(allBooks), [allBooks])

  // Lọc sách theo từ khóa (Fuse.js + Khớp chính xác) và theo Trạng thái
  const filteredBooks = useMemo(() => {
    let result = filterBooksByKeyword(allBooks, fuse, keyword)

    if (statusFilter && statusFilter !== 'ALL') {
      result = result.filter((b) => b.status === statusFilter)
    }

    return result
  }, [allBooks, fuse, keyword, statusFilter])

  const totalCount = filteredBooks.length

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val)
    setPage(1)
  }

  const handleKeywordChange = (val: string) => {
    setKeyword(val)
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
        onKeywordChange={handleKeywordChange}
        onSearch={() => setPage(1)}
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
        dataSource={filteredBooks}
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
