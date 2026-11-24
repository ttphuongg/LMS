import React, { useEffect, useMemo, useState } from 'react'
import { Row, Col, Input, Select, Pagination, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { catalogApi } from '../api'
import type { BookDto, CategoryDto } from '../types'
import { BookCard } from '../components/BookCard'
import { createBookFuse, filterBooksByKeyword } from '../utils/bookSearch'
import { PageHeader } from '@/shared/components/PageHeader'
import { LoadingState } from '@/shared/components/LoadingState'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorState } from '@/shared/components/ErrorState'
import { useStableCallback } from '@/shared/hooks'
import { mutedTextStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

export const BookListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialKeyword = searchParams.get('keyword') || ''

  const [keyword, setKeyword] = useState(initialKeyword)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    searchParams.get('categoryId') || searchParams.get('category') || undefined,
  )
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [allBooks, setAllBooks] = useState<BookDto[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tải danh mục và toàn bộ sách (1 lần) để phục vụ tìm kiếm tức thì ở Client
  const fetchAllData = useStableCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [cats, booksRes] = await Promise.all([
        catalogApi.getCategories().catch(() => [] as CategoryDto[]),
        catalogApi.getBooks({ page: 1, pageSize: 1000 }),
      ])
      setCategories(cats)
      setAllBooks(booksRes.items)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Lỗi khi tải danh mục sách'))
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Cấu hình Fuse.js để tìm kiếm mờ (Fuzzy Search) siêu tốc trên RAM
  const fuse = useMemo(() => createBookFuse(allBooks), [allBooks])

  // Lọc sách: Ưu tiên khớp tuyệt đối (ISBN, Tên đầy đủ) trước khi dùng Fuse.js
  const filteredBooks = useMemo(() => {
    let result = filterBooksByKeyword(allBooks, fuse, keyword)

    // Lọc theo thể loại nếu được chọn
    if (selectedCategory) {
      const catIdNum = Number(selectedCategory)
      const selectedCatObj = categories.find((c) => c.id === selectedCategory)
      const catName = selectedCatObj?.name?.toLowerCase()

      result = result.filter((b) => {
        if (!isNaN(catIdNum) && b.categoryIds && b.categoryIds.includes(catIdNum)) {
          return true
        }
        if (
          catName &&
          (b.categoryName.toLowerCase().includes(catName) ||
            b.categories?.some((c) => c.toLowerCase().includes(catName)))
        ) {
          return true
        }
        return false
      })
    }

    return result
  }, [allBooks, keyword, selectedCategory, fuse, categories])

  // Phân trang tại Client (Client-side Pagination)
  const totalCount = filteredBooks.length
  const displayedBooks = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredBooks.slice(start, start + pageSize)
  }, [filteredBooks, page, pageSize])

  // Đồng bộ khi URL đổi từ bên ngoài (ô tìm trên Header, trang chủ)
  const urlKeyword = searchParams.get('keyword') || ''
  const urlCategory = searchParams.get('categoryId') || searchParams.get('category') || undefined
  useEffect(() => {
    if (urlKeyword !== keyword.trim()) {
      setKeyword(urlKeyword)
      setPage(1)
    }
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory)
      setPage(1)
    }
  }, [urlKeyword, urlCategory])

  const writeUrl = (kw: string, cat?: string) => {
    const next: Record<string, string> = {}
    if (kw.trim()) next.keyword = kw.trim()
    if (cat) next.categoryId = cat
    setSearchParams(next)
  }

  const handleSearch = () => {
    writeUrl(keyword, selectedCategory)
    setPage(1)
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
            placeholder="Tìm theo tên sách, tác giả, ISBN..."
            prefix={<SearchOutlined style={mutedTextStyle} />}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(1)
            }}
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
              label: c.name,
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
        <ErrorState title="Không thể tải mục lục" subTitle={error} onRetry={fetchAllData} />
      ) : displayedBooks.length === 0 ? (
        <EmptyState
          title="Không tìm thấy tài liệu phù hợp"
          description="Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn lại thể loại khác."
          actionText="Xóa bộ lọc"
          onAction={() => {
            setKeyword('')
            setSelectedCategory(undefined)
            setSearchParams({})
            setPage(1)
          }}
        />
      ) : (
        <>
          <Row gutter={[20, 20]}>
            {displayedBooks.map((book) => (
              <Col xs={12} sm={8} md={6} lg={6} key={book.id}>
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
