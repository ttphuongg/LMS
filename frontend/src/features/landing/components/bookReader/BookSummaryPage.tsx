import React from 'react'
import { Button, Tag } from 'antd'
import { ArrowRightOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { BookDto } from '@/features/catalog'

interface BookSummaryPageProps {
  book: BookDto
  onNavigate: (bookId: string) => void
}

/** Trang phải: tiêu đề, tóm tắt, tình trạng lưu thông và nút xem chi tiết. */
export const BookSummaryPage: React.FC<BookSummaryPageProps> = ({ book, onNavigate }) => {
  const isAvailable = book.availableCopies > 0

  return (
    <div
      className="book-page-right"
      style={{
        flex: '1 1 50%',
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >


      <div>
        {/* Header: Page 1 notation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #DECFAA',
            paddingBottom: 10,
            marginBottom: 18,
          }}
        >
          <span style={{ fontSize: 11, color: '#7A6B5B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            TRANG ĐẦU TIÊN • TÓM TẮT TÁC PHẨM
          </span>
          <span style={{ fontSize: 11, fontStyle: 'italic', color: '#B08D3C' }}>Trang 1</span>
        </div>

        {/* Book Title */}
        <h3
          id="opened-book-title"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(18px, 1.8vw, 22px)',
            fontWeight: 700,
            color: '#2A2118',
            lineHeight: 1.25,
            margin: '0 0 8px',
          }}
        >
          {book.title}
        </h3>

        {/* Author */}
        <div
          style={{
            fontSize: 13,
            fontStyle: 'italic',
            color: '#7A5C1F',
            marginBottom: 16,
          }}
        >
          Nguyên tác: {book.authorName}
        </div>

        {/* Scholarly Synopsis */}
        <div
          style={{
            fontSize: 13,
            color: '#554637',
            lineHeight: 1.65,
            background: '#F7F1E1',
            border: '1px solid #DECFAA',
            borderRadius: 4,
            padding: '12px 14px',
            marginBottom: 20,
          }}
        >
          <p style={{ margin: 0 }}>
            Tác phẩm học thuật kinh điển thuộc phân ngành <strong>{book.categoryName}</strong>. Cung cấp nền tảng lý thuyết
            chặt chẽ kết hợp các hướng dẫn thực hành chuyên sâu, phục vụ công tác nghiên cứu của giảng viên, nghiên cứu sinh và bạn đọc.
          </p>
        </div>

        {/* Circulation Status Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: isAvailable ? '#EAF3ED' : '#F8ECEC',
            border: `1px solid ${isAvailable ? '#1F3A2E' : '#7A2E2B'}`,
            borderRadius: 4,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isAvailable ? (
                <CheckCircleOutlined style={{ color: '#1F3A2E', fontSize: 16 }} />
              ) : (
                <ExclamationCircleOutlined style={{ color: '#7A2E2B', fontSize: 16 }} />
              )}
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: isAvailable ? '#1F3A2E' : '#7A2E2B',
                }}
              >
                {isAvailable ? 'Sẵn sàng lưu thông' : 'Tất cả bản sao đang được mượn'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#6B5B4B', marginTop: 2 }}>
              Tổng số: <strong>{book.totalCopies}</strong> cuốn • Còn tại quầy: <strong>{book.availableCopies}</strong> cuốn
            </div>
          </div>

          <Tag
            color={isAvailable ? '#1F3A2E' : '#7A2E2B'}
            style={{
              fontSize: 11,
              fontWeight: 600,
              margin: 0,
              borderRadius: 2,
              padding: '2px 8px',
            }}
          >
            {isAvailable ? 'Mượn được ngay' : 'Hỗ trợ đặt trước'}
          </Tag>
        </div>
      </div>

      {/* Action Button: Full-width focused primary CTA */}
      <div
        style={{
          paddingTop: 16,
          borderTop: '1px solid #DECFAA',
        }}
      >
        <Button
          type="primary"
          size="large"
          block
          icon={<ArrowRightOutlined />}
          onClick={() => onNavigate(book.id)}
          style={{
            background: '#1F3A2E',
            borderColor: '#B08D3C',
            fontWeight: 600,
            height: 44,
            borderRadius: 'var(--radius)',
          }}
        >
          Xem Chi Tiết & Đặt Mượn Sách
        </Button>
      </div>
    </div>
  )
}
