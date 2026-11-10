import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CloseOutlined } from '@ant-design/icons'
import type { BookDto } from '@/features/catalog'
import { BookCatalogSheet } from './bookReader/BookCatalogSheet'
import { BookSummaryPage } from './bookReader/BookSummaryPage'
import type { BookPalette } from './bookReader/types'

interface BookReaderModalProps {
  book: BookDto | null
  palette?: BookPalette
  onClose: () => void
  onNavigate: (bookId: string) => void
}

export const BookReaderModal: React.FC<BookReaderModalProps> = ({
  book,
  palette = { bg: '#1F3A2E', gold: '#B08D3C' },
  onClose,
  onNavigate,
}) => {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!book) return null

  return createPortal(
    <div
      className="book-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(42, 33, 24, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-5)',
        boxSizing: 'border-box',
        animation: 'fadeInModal 0.22s ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="opened-book-title"
    >
      {/* Modal Dialog Content Wrapper */}
      <div
        className="opened-book-modal-wrapper"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: 860,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Floating Close Button outside the top-right corner of the book */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng sách"
          className="book-modal-close-btn"
          style={{
            position: 'absolute',
            top: -16,
            right: -16,
            zIndex: 30,
            background: 'var(--card)',
            border: '1.5px solid var(--border-strong)',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--foreground)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--destructive)'
            e.currentTarget.style.color = '#FFF'
            e.currentTarget.style.borderColor = 'var(--destructive)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--card)'
            e.currentTarget.style.color = 'var(--foreground)'
            e.currentTarget.style.borderColor = 'var(--border-strong)'
          }}
          title="Đóng sách (hoặc nhấn phím ESC)"
        >
          <CloseOutlined style={{ fontSize: 14 }} />
        </button>

        {/* Opened Book Container */}
        <div
          className="opened-book-spread"
          style={{
            width: '100%',
            background: '#FBF7EC',
            border: `2px solid ${palette.gold}`,
            borderRadius: 6,
            boxShadow: '0 24px 60px rgba(24, 18, 12, 0.45)',
            position: 'relative',
            display: 'flex',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >

        {/* Trang trái: bìa thu nhỏ & phiếu biên mục Dewey */}
        <BookCatalogSheet book={book} palette={palette} />

        {/* Trang phải: tiêu đề, tóm tắt, tình trạng lưu thông & nút hành động */}
        <BookSummaryPage book={book} onNavigate={onNavigate} />
      </div>
      </div>
    </div>,
    document.body
  )
}
