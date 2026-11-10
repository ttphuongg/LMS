import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { CategoryDto } from '@/features/catalog'

interface CategoryGridProps {
  categories: CategoryDto[]
  /** Số đầu sách theo danh mục; chỉ truyền khi đã có đủ dữ liệu để đếm chính xác */
  counts?: Record<string, number>
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, counts }) => {
  const navigate = useNavigate()
  if (categories.length === 0) return null

  return (
    <section aria-labelledby="home-cats-title">
      <div className="home-section-head">
        <h2 id="home-cats-title">Danh mục sách</h2>
        <button type="button" className="home-link" onClick={() => navigate('/books')}>
          Xem toàn bộ mục lục
        </button>
      </div>
      <div className="home-cats">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className="home-cat"
            onClick={() => navigate(`/books?categoryId=${encodeURIComponent(c.id)}`)}
          >
            {c.code && <span className="catalog-call-number">#{c.code}</span>}
            <span className="home-cat-name">{c.name}</span>
            {c.description && <span className="home-cat-desc">{c.description}</span>}
            {counts && (
              <span className="home-cat-desc" style={{ marginTop: 'var(--sp-2)' }}>
                {counts[c.id] ?? 0} đầu sách
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
