import React, { useState } from 'react'
import { Button, Spin } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { BookDto } from '@/features/catalog'
import { ShelfBookCluster } from './BookSpineArtwork'
import { BookReaderModal } from './BookReaderModal'
import { FeaturedBookJacket } from './bay1/FeaturedBookJacket'
import { useFeaturedBooks } from './bay1/useFeaturedBooks'
import { COVER_PALETTES, DEFAULT_TILTS, type CoverPalette } from './bay1/coverPalettes'

export const Bay1Catalog: React.FC = () => {
  const navigate = useNavigate()
  const { books, loading, error, reload } = useFeaturedBooks()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<BookDto | null>(null)
  const [selectedPalette, setSelectedPalette] = useState<{ bg: string; gold: string } | null>(null)

  return (
    <section className="shelf-bay shelf-bay-1" aria-labelledby="bay-1-heading">
      {/* Bay Category Badge & Description */}
      <div className="bay-header-wrap">
        <div className="bay-ddc-code">000 — 099</div>
        <h2 id="bay-1-heading" className="bay-title">
          Tra Cứu Mục Lục
        </h2>
        <p className="bay-desc">
          Khám phá các ấn phẩm học thuật kinh điển. Bấm vào sách để xem chi tiết bản sao và tình trạng mượn trả.
        </p>
      </div>

      {/* Bookshelf Interactive Display */}
      <div className="bay-shelf-stage">
        {/* Books Row */}
        <div className="shelf-books-row" role="region" aria-label="Sách nổi bật trên kệ 1">
          {/* Decorative books at left edge */}
          <div className="shelf-filler-left">
            <ShelfBookCluster count={4} startTilt={-5} />
          </div>

          {/* Interactive Featured Books */}
          {loading ? (
            <div style={{ minWidth: 280, padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--muted-foreground)' }}>
              <Spin size="small" /> Đang tải mục lục thực tế...
            </div>
          ) : error ? (
            <div
              style={{
                minWidth: 320,
                padding: 'var(--sp-5)',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                textAlign: 'center',
              }}
            >
              <div style={{ color: 'var(--destructive)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>
                Không thể kết nối máy chủ mục lục
              </div>
              <Button size="small" icon={<ReloadOutlined />} onClick={reload}>
                Thử tải lại
              </Button>
            </div>
          ) : books.length === 0 ? (
            <div
              style={{
                minWidth: 280,
                padding: 'var(--sp-5)',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                textAlign: 'center',
                color: 'var(--muted-foreground)',
              }}
            >
              Chưa có tài liệu nào trong mục lục thư viện.
            </div>
          ) : (
            books.map((book, idx) => {
              const pal: CoverPalette = COVER_PALETTES[idx % COVER_PALETTES.length]
              return (
                <FeaturedBookJacket
                  key={book.id}
                  book={book}
                  pal={pal}
                  baseTilt={DEFAULT_TILTS[idx % DEFAULT_TILTS.length]}
                  isHovered={hoveredId === book.id}
                  onHoverChange={(hovered) => setHoveredId(hovered ? book.id : null)}
                  onOpen={() => {
                    setSelectedBook(book)
                    setSelectedPalette(pal)
                  }}
                />
              )
            })
          )}

          {/* Decorative books at right edge */}
          <div className="shelf-filler-right">
            <ShelfBookCluster count={4} startTilt={4} />
          </div>
        </div>

        {/* Solid Wooden Shelf Bar */}
        <div className="wooden-shelf-bar" />
      </div>

      {/* Center Book Spread Reader Modal */}
      <BookReaderModal
        book={selectedBook}
        palette={selectedPalette || undefined}
        onClose={() => setSelectedBook(null)}
        onNavigate={(bookId) => {
          setSelectedBook(null)
          navigate(`/books/${bookId}`)
        }}
      />
    </section>
  )
}
