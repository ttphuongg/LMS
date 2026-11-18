import React, { useState } from 'react'
import { Tooltip } from 'antd'
import { BookOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { BookDto } from '../types'
import { API_BASE_URL } from '@/shared/api/client'

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

  const handleNavigate = () => {
    navigate(`/books/${book.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleNavigate()
    }
  }

  // Tooltip hiển thị nổi: Tên sách (năm xuất bản) và Tên tác giả
  const tooltipContent = (
    <div className="book-card-tooltip">
      <div className="book-card-tooltip-title">
        {book.title}
        {book.publishedYear ? ` (${book.publishedYear})` : ''}
      </div>
      {book.authorName ? (
        <div className="book-card-tooltip-author">{book.authorName}</div>
      ) : null}
    </div>
  )

  const ariaLabel = `${book.title}${book.publishedYear ? ` (${book.publishedYear})` : ''}${book.authorName ? ` - ${book.authorName}` : ''}`

  return (
    <Tooltip
      title={tooltipContent}
      placement="top"
      arrow={{ pointAtCenter: true }}
      color="#183025"
      overlayClassName="book-cover-tooltip-overlay"
      trigger={['hover', 'focus']}
      mouseEnterDelay={0.12}
      mouseLeaveDelay={0.08}
      destroyTooltipOnHide
    >
      <div
        className="book-cover-card"
        onClick={handleNavigate}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={ariaLabel}
      >
        {coverSrc && !imgError ? (
          <img
            src={coverSrc}
            alt={book.title}
            className="book-cover-img"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="book-cover-placeholder">
            <div className="book-cover-placeholder-category">
              {book.categoryName || 'LIBRI'}
            </div>
            <div className="book-cover-placeholder-center">
              <BookOutlined className="book-cover-placeholder-icon" />
              <div className="book-cover-placeholder-title">{book.title}</div>
            </div>
            {book.authorName ? (
              <div className="book-cover-placeholder-author">{book.authorName}</div>
            ) : null}
          </div>
        )}
      </div>
    </Tooltip>
  )
}
