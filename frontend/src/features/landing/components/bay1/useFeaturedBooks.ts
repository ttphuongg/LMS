import { useCallback, useEffect, useState } from 'react'
import { catalogApi, type BookDto } from '@/features/catalog'

export interface FeaturedBooksState {
  books: BookDto[]
  loading: boolean
  error: boolean
  reload: () => void
}

/** Tải 6 cuốn sách nổi bật trực tiếp từ API thực cho khoang 1 (không dùng mock fallback). */
export function useFeaturedBooks(): FeaturedBooksState {
  const [books, setBooks] = useState<BookDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    let active = true
    setLoading(true)
    setError(false)
    catalogApi
      .getBooks({ page: 1, pageSize: 6 })
      .then((res) => {
        if (!active) return
        setBooks((res.items || []).slice(0, 6))
      })
      .catch(() => {
        if (!active) return
        setBooks([])
        setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => load(), [load])

  return { books, loading, error, reload: load }
}
