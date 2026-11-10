import React, { useEffect, useState } from 'react'
import { Table, Button } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { catalogApi } from '../api'
import type { BookDto } from '../types'
import { AddCopiesModal } from '../components/AddCopiesModal'
import { BookSearchBar } from '../components/BookSearchBar'
import { buildAdminBookColumns } from '../components/adminBookColumns'
import { useAddCopies } from '../hooks/useAddCopies'
import { PageHeader } from '@/shared/components/PageHeader'
import { useStableCallback, useRequestGuard } from '@/shared/hooks'
import { primaryButtonStyle } from '@/shared/styles/ui'

export const AdminBookListPage: React.FC = () => {
  const navigate = useNavigate()
  const [books, setBooks] = useState<BookDto[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const guard = useRequestGuard()

  const fetchBooks = useStableCallback(async () => {
    const reqId = guard.next()
    try {
      setLoading(true)
      const res = await catalogApi.getBooks({
        keyword: keyword.trim() || undefined,
        page,
        pageSize,
      })
      if (!guard.isLatest(reqId)) return
      setBooks(res.items)
      setTotalCount(res.totalCount)
    } catch {
      if (guard.isLatest(reqId)) message.error('Lỗi khi tải danh sách sách')
    } finally {
      if (guard.isLatest(reqId)) setLoading(false)
    }
  })

  useEffect(() => {
    fetchBooks()
  }, [page, pageSize, fetchBooks])

  // Về trang 1 rồi để effect tự tải; nếu đã ở trang 1 thì tải ngay (tránh gọi API hai lần với `page` cũ)
  const applyFilter = () => {
    if (page === 1) fetchBooks()
    else setPage(1)
  }

  const addCopies = useAddCopies(fetchBooks)

  const columns = buildAdminBookColumns({
    onView: (book) => navigate(`/books/${book.id}`),
    onEdit: (book) => navigate(`/admin/books/${book.id}/edit`),
    onAddCopies: addCopies.openFor,
  })

  return (
    <div>
      <PageHeader
        title="Quản Lý Mục Lục Sách"
        subtitle="Quản lý toàn bộ danh mục tài liệu, số hiệu phân loại và các bản sao lưu thông"
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
        scroll={{ x: 800 }}
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

      {/* Modal Thêm bản sao */}
      <AddCopiesModal addCopies={addCopies} />
    </div>
  )
}
