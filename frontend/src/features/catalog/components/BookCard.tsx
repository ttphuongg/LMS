import React, { useState } from 'react'
import { Card, Tag } from 'antd'
import { BookOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { BookDto } from '../types'
import { API_BASE_URL } from '@/shared/api/client'
import { CatalogCode } from '@/shared/components/CatalogCode'
import { SpineTag } from '@/shared/components/SpineTag'

interface BookCardProps {
  book: BookDto
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)
  const rawCover = book.coverImageUrl || book.coverImage
  const coverSrc = rawCover
    ? rawCover.startsWith('http')
      ? rawCover
      : `${API_BASE_URL}${rawCover.startsWith('/') ? '' : '/'}${rawCover}`
    : null

  return (
    <Card
      hoverable
      className="catalog-card"
      onClick={() => navigate(`/books/${book.id}`)}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
      }}
      styles={{ body: { padding: 'var(--sp-4)', height: '100%', display: 'flex', flexDirection: 'column' } }}
    >
      <div>
        {/* Top header: Call number & Category */}
        <div className="catalog-card-header">
          <CatalogCode code={book.callNumber} />
          <Tag
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              margin: 0,
              maxWidth: '55%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'inline-block',
              verticalAlign: 'top',
            }}
            title={book.categoryName}
          >
            {book.categoryName}
          </Tag>
        </div>

        {/* Cover Image */}
        <div
          style={{
            width: '100%',
            height: 140,
            overflow: 'hidden',
            borderRadius: 'var(--radius-sm)',
            margin: 'var(--sp-2) 0',
            background: 'rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
          }}
        >
          {coverSrc && !imgError ? (
            <img
              src={coverSrc}
              alt={book.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--sp-2)' }}>
              <BookOutlined style={{ fontSize: 32, color: 'var(--primary)', opacity: 0.65, marginBottom: 4 }} />
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                {book.categoryName || 'Tài liệu thư viện'}
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 17,
            margin: 'var(--sp-2) 0 var(--sp-1)',
            color: 'var(--foreground)',
            lineHeight: 1.35,
            fontWeight: 600,
          }}
        >
          {book.title}
        </h3>

        {/* Author */}
        <div style={{ color: 'var(--muted-foreground)', fontSize: 13, marginBottom: 'var(--sp-2)', fontStyle: 'italic' }}>
          Tác giả: {book.authorName}
        </div>

        {/* Description snippet */}
        {book.description && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--muted-foreground)',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              marginBottom: 'var(--sp-3)',
            }}
          >
            {book.description.replace(/Thông tin chi tiết\s*:[\s\S]*/i, '').trim()}
          </p>
        )}
      </div>

      {/* Footer: Availability & ISBN */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 'var(--sp-2)',
          borderTop: '1px dashed var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
        }}
      >
        <span style={{ color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' }}>
          ISBN: {book.isbn}
        </span>

        {book.availableCopies > 0 ? (
          <SpineTag variant="primary">
            Sẵn sàng: {book.availableCopies}/{book.totalCopies}
          </SpineTag>
        ) : (
          <SpineTag variant="warning">
            Hết bản có sẵn (0/{book.totalCopies})
          </SpineTag>
        )}
      </div>
    </Card>
  )
}
