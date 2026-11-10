import React, { useEffect, useState } from 'react'
import { Row, Col, Input, Select, Pagination, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { catalogApi } from '../api'
import type { BookDto, CategoryDto } from '../types'
import { BookCard } from '../components/BookCard'
import { PageHeader } from '@/shared/components/PageHeader'
import { LoadingState } from '@/shared/components/LoadingState'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorState } from '@/shared/components/ErrorState'
import { useStableCallback, useRequestGuard } from '@/shared/hooks'
import { mutedTextStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

export const BookListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialKeyword = searchParams.get('keyword') || ''

  const [keyword, setKeyword] = useState(initialKeyword)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    searchParams.get('categoryId') || searchParams.get('category') || undefined,
  )
  const [reloadTick, setReloadTick] = useState(0)
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [books, setBooks] = useState<BookDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    catalogApi.getCategories().then(setCategories).catch(() => {})
  }, [])

  const guard = useRequestGuard()

  const fetchBooks = useStableCallback(async () => {
    const reqId = guard.next()
    try {
      setLoading(true)
      setError(null)
      const res = await catalogApi.getBooks({
        keyword: keyword.trim() || undefined,
        categoryId: selectedCategory,
        page,
        pageSize,
      })
      if (!guard.isLatest(reqId)) return
      setBooks(res.items)
      setTotalCount(res.totalCount)
    } catch (err: unknown) {
      if (!guard.isLatest(reqId)) return
      setError(getErrorMessage(err, 'Lỗi khi tải danh mục sách'))
    } finally {
      if (guard.isLatest(reqId)) setLoading(false)
    }
  })

  useEffect(() => {
    fetchBooks()
  }, [page, pageSize, selectedCategory, reloadTick, fetchBooks])

  // Đồng bộ khi URL đổi từ bên ngoài (ô tìm trên Header, danh mục ở trang chủ)
  const urlKeyword = searchParams.get('keyword') || ''
  const urlCategory = searchParams.get('categoryId') || searchParams.get('category') || undefined
  const syncFromUrl = useStableCallback(() => {
    if (urlKeyword === keyword.trim() && urlCategory === selectedCategory) return
    setKeyword(urlKeyword)
    setSelectedCategory(urlCategory)
    setPage(1)
    setReloadTick((t) => t + 1)
  })

  useEffect(() => {
    syncFromUrl()
  }, [urlKeyword, urlCategory, syncFromUrl])

  const writeUrl = (kw: string, cat?: string) => {
    const next: Record<string, string> = {}
    if (kw.trim()) next.keyword = kw.trim()
    if (cat) next.categoryId = cat
    setSearchParams(next)
  }

  const handleSearch = () => {
    writeUrl(keyword, selectedCategory)
    // Về trang 1 rồi để effect tự tải; nếu đã ở trang 1 thì tải ngay
    // (tránh gọi API hai lần, lần đầu với `page` cũ)
    if (page === 1) fetchBooks()
    else setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="Mục Lục Thư Viện"
        subtitle="Tra cứu tài liệu, kiểm tra vị trí lưu trữ trên giá sách và đặt mượn trực tuyến"
        breadcrumbs={[{ title: 'Trang chủ', href: '/' }, { title: 'Mục lục sách' }]}
      />

      {/* Thanh bộ lọc */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 'var(--sp-4) var(--sp-5)',
          marginBottom: 'var(--sp-6)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--sp-4)',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space wrap size={12} style={{ flex: 1 }}>
          <Input
            placeholder="Tìm theo tên sách, tác giả, ISBN, Call number..."
            prefix={<SearchOutlined style={mutedTextStyle} />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
            style={{ width: 320, borderRadius: 'var(--radius)' }}
            aria-label="Tìm kiếm sách trong mục lục"
          />

          <Select
            placeholder="Tất cả thể loại chuyên ngành"
            allowClear
            value={selectedCategory}
            onChange={(val) => {
              setSelectedCategory(val)
              setPage(1)
              writeUrl(keyword, val)
            }}
            style={{ width: 240 }}
            options={categories.map((c) => ({
              label: `${c.code ? `[${c.code}] ` : ''}${c.name}`,
              value: c.id,
            }))}
          />

          <button
            type="button"
            onClick={handleSearch}
            style={{
              background: 'var(--primary)',
              color: 'var(--card)',
              border: '1px solid var(--primary)',
              padding: '6px var(--sp-4)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Lọc mục lục
          </button>
        </Space>

        <span style={{ color: 'var(--muted-foreground)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          Tìm thấy <strong>{totalCount}</strong> tài liệu phù hợp
        </span>
      </div>

      {/* Lưới sách */}
      {loading ? (
        <LoadingState tip="Đang tra cứu thẻ mục lục..." />
      ) : error ? (
        <ErrorState title="Không thể tải mục lục" subTitle={error} onRetry={fetchBooks} />
      ) : books.length === 0 ? (
        <EmptyState
          title="Không tìm thấy tài liệu phù hợp"
          description="Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn lại thể loại khác."
          actionText="Xóa bộ lọc"
          onAction={() => {
            setKeyword('')
            setSelectedCategory(undefined)
            setSearchParams({})
            setReloadTick((t) => t + 1)
          }}
        />
      ) : (
        <>
          <Row gutter={[20, 20]}>
            {books.map((book) => (
              <Col xs={24} sm={12} lg={6} key={book.id}>
                <BookCard book={book} />
              </Col>
            ))}
          </Row>

          <div style={{ marginTop: 32, textAlign: 'right' }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={totalCount}
              showSizeChanger
              pageSizeOptions={['8', '12', '24']}
              onChange={(p, ps) => {
                setPage(p)
                setPageSize(ps)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
