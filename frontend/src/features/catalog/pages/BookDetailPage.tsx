import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Row, Col, Table, Tag, Descriptions, Alert } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { catalogApi } from '../api'
import type { BookDto, BookCopyDto } from '../types'
import { BookDescription } from '../components/BookDescription'
import { API_BASE_URL } from '@/shared/api/client'
import { ReserveButton } from '@/features/circulation'
import { CatalogCode } from '@/shared/components/CatalogCode'
import { SpineTag } from '@/shared/components/SpineTag'
import { PageHeader } from '@/shared/components/PageHeader'
import { LoadingState } from '@/shared/components/LoadingState'
import { ErrorState } from '@/shared/components/ErrorState'
import { useStableCallback, useRequestGuard } from '@/shared/hooks'
import { monoStyle, primaryTagStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

export const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<BookDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const guard = useRequestGuard()

  const fetchBookDetail = useStableCallback(async () => {
    if (!id) return
    const reqId = guard.next()
    try {
      setLoading(true)
      setError(null)
      const data = await catalogApi.getBookById(id)
      if (!guard.isLatest(reqId)) return
      setBook(data)
    } catch (err: unknown) {
      if (!guard.isLatest(reqId)) return
      setError(getErrorMessage(err, 'Không thể tìm thấy sách'))
    } finally {
      if (guard.isLatest(reqId)) setLoading(false)
    }
  })

  useEffect(() => {
    fetchBookDetail()
  }, [id, fetchBookDetail])

  if (loading) return <LoadingState tip="Đang truy xuất thẻ mục lục sách..." />
  if (error || !book) {
    return <ErrorState title="Không tìm thấy sách" subTitle={error || ''} onRetry={fetchBookDetail} />
  }

  const rawCover = book?.coverImageUrl || book?.coverImage
  const coverSrc = rawCover
    ? rawCover.startsWith('http')
      ? rawCover
      : `${API_BASE_URL}${rawCover.startsWith('/') ? '' : '/'}${rawCover}`
    : null

  const copyColumns: ColumnsType<BookCopyDto> = [
    {
      title: 'Mã vạch (Barcode)',
      dataIndex: 'barcode',
      key: 'barcode',
      render: (barcode: string) => <SpineTag variant="primary">{barcode}</SpineTag>,
    },
    {
      title: 'Vị trí kệ sách',
      dataIndex: 'location',
      key: 'location',
      render: (loc: string | null | undefined) =>
        loc ? <SpineTag variant="neutral">{loc}</SpineTag> : <Tag color="default">Chưa xếp kệ</Tag>,
    },
    {
      title: 'Trạng thái bản sao',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'Available') return <SpineTag variant="primary">Sẵn sàng phục vụ</SpineTag>
        if (status === 'Borrowed') return <SpineTag variant="danger">Đang được mượn</SpineTag>
        if (status === 'Reserved') return <SpineTag variant="warning">Đã được giữ chỗ</SpineTag>
        if (status === 'Maintenance') return <SpineTag variant="neutral">Bảo quản / Phục chế</SpineTag>
        if (status === 'Inactive') return <SpineTag variant="neutral">Ngừng lưu hành</SpineTag>
        return <SpineTag variant="neutral">{status}</SpineTag>
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title={book.title}
        subtitle={`${book.isbn ? `ISBN: ${book.isbn} • ` : ''}Tác giả: ${book.authorName}`}
        breadcrumbs={[
          { title: 'Trang chủ', href: '/' },
          { title: 'Mục lục sách', href: '/books' },
          { title: book.title },
        ]}
        extra={
          <button
            type="button"
            onClick={() => navigate('/books')}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border-strong)',
              color: 'var(--foreground)',
              padding: '6px var(--sp-4)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Quay lại mục lục
          </button>
        }
      />

      <Row gutter={[24, 24]}>
        {/* Cột trái: Thẻ mục lục chi tiết */}
        <Col xs={24} lg={15}>
          <Card
            className="catalog-card"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              marginBottom: 'var(--sp-6)',
            }}
          >
            <div className="catalog-card-header">
              <CatalogCode
                code={book.isbn || `#${book.id}`}
                label={book.isbn ? 'ISBN' : 'Mã tài liệu'}
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {book.status === 'Inactive' && <Tag color="red">Ngừng lưu hành</Tag>}
                <Tag style={primaryTagStyle}>
                  {book.categoryName}
                </Tag>
              </div>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 24,
                color: 'var(--foreground)',
                margin: 'var(--sp-3) 0 var(--sp-4)',
              }}
            >
              {book.title}
            </h2>

            <Descriptions
              bordered
              size="small"
              column={{ xs: 1, sm: 2 }}
              style={{ marginBottom: 'var(--sp-5)' }}
            >
              <Descriptions.Item label="Tác giả">
                <strong>{book.authorName}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Thể loại">
                {book.categoryName}
              </Descriptions.Item>
              <Descriptions.Item label="Nhà xuất bản">
                {book.publisher || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Năm xuất bản">
                {book.publishedYear || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Mã chuẩn ISBN">
                <span className="tabular-numbers" style={monoStyle}>{book.isbn || 'Chưa cập nhật'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng số bản sao">
                <span className="tabular-numbers" style={monoStyle}>
                  {book.availableCopies} khả dụng / {book.totalCopies} bản
                </span>
              </Descriptions.Item>
              {book.language && (
                <Descriptions.Item label="Ngôn ngữ">
                  {book.language === 'vi' ? 'Tiếng Việt' : book.language}
                </Descriptions.Item>
              )}
              {book.pageCount && (
                <Descriptions.Item label="Số trang">
                  {book.pageCount} trang
                </Descriptions.Item>
              )}
              {book.bookValue && (
                <Descriptions.Item label="Định giá">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.bookValue)}
                </Descriptions.Item>
              )}
            </Descriptions>

            <h4
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 16,
                color: 'var(--foreground)',
                marginBottom: 'var(--sp-2)',
              }}
            >
              Tóm tắt nội dung tài liệu
            </h4>
            <BookDescription description={book.description} />
          </Card>
        </Col>

        {/* Cột phải: Bìa sách, Khối đặt trước & Tình trạng lưu thông */}
        <Col xs={24} lg={9}>
          {coverSrc && (
            <Card
              className="catalog-card"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                marginBottom: 'var(--sp-4)',
                textAlign: 'center',
                padding: 'var(--sp-2)',
              }}
            >
              <img
                src={coverSrc}
                alt={book.title}
                style={{
                  maxHeight: 260,
                  maxWidth: '100%',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 4px 12px rgba(42, 33, 24, 0.12)',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  (e.target as HTMLElement).parentElement!.style.display = 'none'
                }}
              />
            </Card>
          )}

          <Card
            className="catalog-card"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              marginBottom: 'var(--sp-6)',
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 18,
                color: 'var(--primary)',
                margin: '0 0 var(--sp-3)',
              }}
            >
              Dịch Vụ Mượn & Giữ Chỗ
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: 'var(--sp-4)' }}>
              {book.status === 'Inactive'
                ? 'Tài liệu này hiện đang ngừng lưu hành tại thư viện nên tạm thời không nhận đặt trước.'
                : book.totalCopies === 0
                  ? 'Tài liệu hiện chưa có bản sao vật lý trong kho.'
                  : book.availableCopies > 0
                    ? `Hiện có ${book.availableCopies} cuốn sách sẵn sàng phục vụ tại quầy. Bạn có thể đến nhận trực tiếp hoặc bấm nút đặt trước bên dưới.`
                    : 'Hiện tất cả các bản sao đang được lưu thông. Bạn có thể đặt trước để thư viện giữ sách ngay khi được độc giả khác hoàn trả.'}
            </p>

            <div style={{ textAlign: 'center', padding: 'var(--sp-2) 0' }}>
              <ReserveButton
                bookId={book.id}
                bookTitle={book.title}
                disabled={book.status === 'Inactive'}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Danh sách các bản sao sách */}
      <div style={{ marginTop: 'var(--sp-2)' }}>
        <h3
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 20,
            color: 'var(--foreground)',
            marginBottom: 'var(--sp-3)',
          }}
        >
          Danh Sách Các Bản Sao Trên Kệ ({book.copies?.length || 0})
        </h3>
        {book.copiesError && (
          <Alert
            type="warning"
            showIcon
            title="Không thể tải danh sách bản sao vật lý lúc này. Vui lòng tải lại trang."
            style={{ marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius)' }}
          />
        )}
        <Table
          columns={copyColumns}
          dataSource={book.copies || []}
          rowKey="id"
          pagination={false}
          scroll={{ x: 600 }}
          bordered
          locale={{ emptyText: 'Đầu sách này chưa có bản sao vật lý nào trên hệ thống.' }}
        />
      </div>
    </div>
  )
}
