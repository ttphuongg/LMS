import { useEffect, useState } from 'react'
import { catalogApi, type BookDto } from '@/features/catalog'
import { FALLBACK_BOOKS } from './fallbackBooks'

/** Tải 6 cuốn sách nổi bật cho khoang 1; lỗi API thì dùng danh sách mặc định. */
export function useFeaturedBooks(): BookDto[] {
  const [books, setBooks] = useState<BookDto[]>([])

  useEffect(() => {
    let mounted = true
    catalogApi
      .getBooks({ page: 1, pageSize: 6 })
      .then((res) => {
        if (mounted && res.items?.length > 0) {
          setBooks(res.items.slice(0, 6))
        }
      })
      .catch(() => {
        // Fallback default books if API is not yet loaded
        if (mounted) {
          setBooks(FALLBACK_BOOKS)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  return books
}
