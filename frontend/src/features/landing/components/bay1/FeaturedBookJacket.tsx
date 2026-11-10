import React from 'react'
import { Tag } from 'antd'
import { ReadOutlined } from '@ant-design/icons'
import type { BookDto } from '@/features/catalog'
import type { CoverPalette } from './coverPalettes'

interface FeaturedBookJacketProps {
  book: BookDto
  pal: CoverPalette
  baseTilt: number
  isHovered: boolean
  onHoverChange: (hovered: boolean) => void
  onOpen: () => void
}

/** Một cuốn sách nổi bật trên kệ: bìa sách có hiệu ứng nghiêng/nhấc khi rê chuột. */
export const FeaturedBookJacket: React.FC<FeaturedBookJacketProps> = ({
  book,
  pal,
  baseTilt,
  isHovered,
  onHoverChange,
  onOpen,
}) => (
  <div
    className="featured-shelf-book"
    onMouseEnter={() => onHoverChange(true)}
    onMouseLeave={() => onHoverChange(false)}
    style={{
      transform: isHovered ? 'translateY(-10px) rotate(-3deg)' : `translateY(0) rotate(${baseTilt}deg)`,
      transformOrigin: 'bottom center',
      transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
      zIndex: isHovered ? 25 : 5,
    }}
  >
    {/* Book Jacket Front */}
    <div
      className="interactive-book-jacket"
      style={{
        width: 175,
        height: 255,
        background: pal.bg,
        border: '1.5px solid',
        borderColor: isHovered ? 'var(--border-strong)' : pal.gold,
        borderRadius: 'var(--radius)',
        padding: 'var(--sp-4) var(--sp-3)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease',
      }}
      onClick={onOpen}
      title="Bấm để lật mở xem thông tin sách"
    >
      {/* Left Spine Bound Divider Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 10,
          bottom: 0,
          width: 1,
          borderLeft: '1px dashed var(--border-strong)',
          opacity: 0.6,
        }}
      />

      {/* Header: Call number & Click Hint */}
      <div style={{ paddingLeft: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: 10,
            color: pal.gold,
            letterSpacing: '0.06em',
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontWeight: 700,
          }}
        >
          {book.callNumber}
        </span>

        {/* Subtle click-to-open badge on hover */}
        {isHovered && (
          <span
            style={{
              background: '#B08D3C',
              color: '#2A2118',
              fontSize: 8.5,
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 2,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <ReadOutlined style={{ marginRight: 2 }} /> Mở
          </span>
        )}
      </div>

      {/* Center: Book Title & Author */}
      <div style={{ paddingLeft: 6, margin: 'auto 0' }}>
        <h3
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 14,
            color: '#FBF7EC',
            margin: '0 0 6px',
            lineHeight: 1.3,
            fontWeight: 700,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={book.title}
        >
          {book.title}
        </h3>
        <p
          style={{
            fontSize: 11,
            color: pal.gold,
            margin: 0,
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {book.authorName}
        </p>
      </div>

      {/* Bottom: Availability Tag */}
      <div style={{ paddingLeft: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tag
          color={book.availableCopies > 0 ? '#1F3A2E' : '#7A2E2B'}
          style={{
            fontSize: 10,
            margin: 0,
            borderRadius: 2,
            borderColor: pal.gold,
          }}
        >
          {book.availableCopies > 0 ? `Sẵn có (${book.availableCopies})` : 'Đang mượn hết'}
        </Tag>
      </div>
    </div>
  </div>
)
