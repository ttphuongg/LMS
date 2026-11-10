import React from 'react'
import { BookOutlined, BarcodeOutlined } from '@ant-design/icons'
import type { BookDto } from '@/features/catalog'
import { DetailRow } from './DetailRow'
import type { BookPalette } from './types'

interface BookCatalogSheetProps {
  book: BookDto
  palette: BookPalette
}

/** Trang trái: bìa thu nhỏ + phiếu biên mục thư mục (Dewey). */
export const BookCatalogSheet: React.FC<BookCatalogSheetProps> = ({ book, palette }) => (
  <div
    className="book-page-left"
    style={{
      flex: '1 1 50%',
      padding: '36px 32px',
      borderRight: '1px dashed #DECFAA',
      background: '#F8F3E5',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      boxSizing: 'border-box',
    }}
  >


    <div>
      {/* Top Ex-Libris Seal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #DECFAA',
          paddingBottom: 10,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOutlined style={{ color: palette.gold, fontSize: 16 }} />
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#2A2118',
              textTransform: 'uppercase',
            }}
          >
            Thư Viện Trí Tri
          </span>
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: palette.gold,
            fontWeight: 700,
          }}
        >
          {book.callNumber}
        </span>
      </div>

      {/* Book Miniature Representation */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          marginBottom: 20,
          background: '#FBF7EC',
          border: '1px solid #DECFAA',
          borderRadius: 4,
          padding: '14px 16px',
        }}
      >
        {/* Mini Book Cover */}
        <div
          style={{
            width: 68,
            height: 96,
            background: palette.bg,
            border: `1.5px solid ${palette.gold}`,
            borderRadius: '2px 4px 4px 2px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '8px 6px',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <div style={{ fontSize: 7, color: palette.gold, fontWeight: 700 }}>
            {book.callNumber.split(' ')[0]}
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 8.5,
              color: '#FBF7EC',
              fontWeight: 700,
              lineHeight: 1.15,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {book.title}
          </div>
          <div style={{ fontSize: 7, color: palette.gold, fontStyle: 'italic' }}>
            {book.authorName.split(' ')[0]}
          </div>
        </div>

        {/* Bibliographic summary beside mini cover */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#6B5B4B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            PHIẾU BIÊN MỤC
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 13,
              fontWeight: 700,
              color: '#2A2118',
              marginTop: 2,
              marginBottom: 4,
            }}
          >
            {book.categoryName || 'Tài liệu nghiên cứu'}
          </div>
          <div style={{ fontSize: 11, color: '#6B5B4B' }}>
            Năm ấn hành: <strong>{book.publishedYear || '—'}</strong>
          </div>
          <div style={{ fontSize: 11, color: '#6B5B4B' }}>
            Nhà xuất bản: <strong>{book.publisher || 'NXB Đại học'}</strong>
          </div>
        </div>
      </div>

      {/* Dewey & ISBN Details Table */}
      <div style={{ fontSize: 12, lineHeight: 1.8, color: '#4A3B2C' }}>
        <DetailRow label="Mã ISBN:" value={book.isbn || 'Đang cập nhật'} mono />
        <DetailRow label="Tác giả:" value={book.authorName} />
        <DetailRow label="Kho lưu trữ:" value="Kho tài liệu lưu hành (Tầng 2)" />
      </div>
    </div>

    {/* Bottom Barcode Decorative Element */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 14,
        borderTop: '1px solid #DECFAA',
        marginTop: 16,
        color: '#8A7A6A',
        fontSize: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <BarcodeOutlined style={{ fontSize: 18 }} />
        <span style={{ fontFamily: 'monospace' }}>TRITRI-LIB-{book.id.replace(/\D/g, '') || '001'}</span>
      </div>
      <span>ẤN BẢN TIÊU CHUẨN</span>
    </div>
  </div>
)
