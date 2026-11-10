import { useCallback, useEffect, useRef, useState } from 'react'
import { catalogApi } from '@/features/catalog'
import type { CategoryDto } from '@/features/catalog'
import { circulationApi } from '@/features/circulation'
import type { LoanSlipDto, ReservationDto } from '@/features/circulation'
import { billingApi } from '@/features/billing'
import type { FineDto } from '@/features/billing'
import { notificationsApi } from '@/features/notifications'
import type { NotificationItem } from '@/features/notifications'
import type { BookWithStats } from '../utils/selectors'

const POOL_SIZE = 100

export interface HomeData {
  loading: boolean
  /** true nếu có ít nhất một nguồn dữ liệu tải lỗi (trang vẫn hiển thị phần còn lại) */
  partialError: boolean
  books: BookWithStats[]
  totalBooks: number
  categories: CategoryDto[]
  slips: LoanSlipDto[]
  reservations: ReservationDto[]
  fines: FineDto[]
  notifications: NotificationItem[]
  reload: () => void
}

const valueOf = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
  r.status === 'fulfilled' ? r.value : fallback

/**
 * Tải toàn bộ dữ liệu trang chủ song song. Mỗi nguồn lỗi độc lập,
 * một API hỏng không làm trắng cả trang.
 */
export const useHomeData = (): HomeData => {
  const [state, setState] = useState<Omit<HomeData, 'reload'>>({
    loading: true,
    partialError: false,
    books: [],
    totalBooks: 0,
    categories: [],
    slips: [],
    reservations: [],
    fines: [],
    notifications: [],
  })
  const runId = useRef(0)

  const load = useCallback(async () => {
    const id = ++runId.current
    setState((s) => ({ ...s, loading: true }))

    const results = await Promise.allSettled([
      catalogApi.getBooks({ page: 1, pageSize: POOL_SIZE }),
      catalogApi.getCategories(),
      notificationsApi.getMyNotifications(),
      circulationApi.getMyLoans(),
      circulationApi.getMyReservations(),
      billingApi.getMyFines(),
    ])
    if (id !== runId.current) return // đã có lần tải mới hơn

    const [books, categories, notifications, slips, reservations, fines] = results
    const bookPage = books.status === 'fulfilled' ? books.value : null

    setState({
      loading: false,
      partialError: results.some((r) => r.status === 'rejected'),
      books: bookPage?.items ?? [],
      totalBooks: bookPage?.totalCount ?? 0,
      categories: valueOf(categories, []),
      notifications: valueOf(notifications, []),
      slips: valueOf(slips, []),
      reservations: valueOf(reservations, []),
      fines: valueOf(fines, []),
    })
  }, [])

  useEffect(() => {
    load()
    return () => {
      runId.current += 1
    }
  }, [load])

  return { ...state, reload: load }
}
