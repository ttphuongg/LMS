import React from 'react'
import { Skeleton } from 'antd'
import { useNavigate } from 'react-router-dom'
import { BookCard } from '@/features/catalog'
import type { BookDto } from '@/features/catalog'

interface BookShelfProps {
  title: string
  subtitle?: string
  books: BookDto[]
  loading?: boolean
}

export const BookShelf: React.FC<BookShelfProps> = ({ title, subtitle, books, loading }) => {
  const navigate = useNavigate()
  if (!loading && books.length === 0) return null

  return (
    <section aria-label={title}>
      <div className="home-section-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <small>{subtitle}</small>}
        </div>
        <button type="button" className="home-link" onClick={() => navigate('/books')}>
          Xem tất cả
        </button>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <div className="home-shelf-row">
          {books.map((b) => (
            <div className="home-shelf-item" key={b.id}>
              <BookCard book={b} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
