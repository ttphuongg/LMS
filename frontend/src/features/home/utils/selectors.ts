import dayjs from 'dayjs'
import type { BookDto } from '@/features/catalog'
import type { LoanDetailDto, LoanSlipDto, ReservationDto } from '@/features/circulation'
import type { FineDto } from '@/features/billing'
import { LIBRARY_RULES } from '@/shared/constants/rules'

/**
 * BookDto hiện chưa có createdAt / borrowCount.
 * Khi backend bổ sung hai trường này, các hàm bên dưới tự dùng chúng;
 * trước đó sẽ dùng cách tính tạm (ghi chú ở từng hàm).
 */
export type BookWithStats = BookDto & { borrowCount?: number; createdAt?: string }

const norm = (s: string) => s.trim().toLowerCase()

/** Số ngày từ hôm nay đến hạn trả (âm = đã quá hạn) */
export const daysUntil = (iso: string): number =>
  dayjs(iso).startOf('day').diff(dayjs().startOf('day'), 'day')

// ---------------- Sách đang mượn ----------------
export const getActiveDetails = (slips: LoanSlipDto[]): LoanDetailDto[] =>
  slips
    .flatMap((s) => s.details)
    .filter((d) => d.status !== 'Returned')
    .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())

export const isOverdue = (d: LoanDetailDto): boolean =>
  d.status === 'Overdue' || daysUntil(d.dueDate) < 0

export interface LoanSummary {
  active: number
  overdue: number
  dueSoon: number
  estimatedFine: number
}

export const summarizeLoans = (active: LoanDetailDto[]): LoanSummary => {
  let overdue = 0
  let dueSoon = 0
  let estimatedFine = 0
  active.forEach((d) => {
    const left = daysUntil(d.dueDate)
    if (isOverdue(d)) {
      overdue += 1
      estimatedFine += Math.abs(Math.min(left, -1)) * LIBRARY_RULES.finePerDayVND
    } else if (left <= 3) {
      dueSoon += 1
    }
  })
  return { active: active.length, overdue, dueSoon, estimatedFine }
}

// ---------------- Tiền phạt / đặt trước ----------------
export const summarizeFines = (fines: FineDto[]) => {
  const unpaid = fines.filter((f) => f.status === 'Unpaid')
  return {
    unpaidCount: unpaid.length,
    unpaidAmount: unpaid.reduce((sum, f) => sum + Math.max(0, f.amount - f.paidAmount), 0),
  }
}

export const summarizeReservations = (reservations: ReservationDto[]) => {
  const ready = reservations.filter((r) => r.status === 'ReadyForPickup').length
  const pending = reservations.filter((r) => r.status === 'Pending').length
  return { ready, pending, total: ready + pending }
}

// ---------------- Kệ sách ----------------
/** Sách mới: dùng createdAt nếu có, tạm thời xếp theo năm xuất bản giảm dần */
export const pickNewest = (books: BookWithStats[], limit: number): BookWithStats[] =>
  [...books]
    .sort((a, b) => {
      const byCreated =
        (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0)
      return byCreated || (b.publishedYear ?? 0) - (a.publishedYear ?? 0)
    })
    .slice(0, limit)

const borrowedCopies = (b: BookWithStats) => Math.max(0, b.totalCopies - b.availableCopies)

/** Sách nổi bật: dùng borrowCount nếu có, tạm thời lấy số bản đang được mượn */
export const pickPopular = (books: BookWithStats[], limit: number): BookWithStats[] =>
  [...books]
    .sort(
      (a, b) =>
        (b.borrowCount ?? borrowedCopies(b)) - (a.borrowCount ?? borrowedCopies(a)) ||
        b.totalCopies - a.totalCopies,
    )
    .slice(0, limit)

/**
 * Gợi ý: sách cùng tác giả (điểm 2) hoặc cùng danh mục (điểm 1) với những cuốn
 * bạn đọc đã mượn. Chưa có lịch sử thì lấy sách đang có sẵn chưa xuất hiện ở kệ khác.
 */
export const pickRecommended = (
  books: BookWithStats[],
  slips: LoanSlipDto[],
  shownIds: string[],
  limit = 10,
): { items: BookWithStats[]; personalized: boolean } => {
  const discover = () => {
    const shown = new Set(shownIds)
    return {
      items: books.filter((b) => b.availableCopies > 0 && !shown.has(b.id)).slice(0, limit),
      personalized: false,
    }
  }

  const titles = new Set(slips.flatMap((s) => s.details).map((d) => norm(d.bookTitle)))
  const history = books.filter((b) => titles.has(norm(b.title)))
  if (history.length === 0) return discover()

  const historyIds = new Set(history.map((b) => b.id))
  const categories = new Set(history.map((b) => b.categoryId ?? b.categoryName))
  const authors = new Set(history.map((b) => b.authorId ?? b.authorName))

  const items = books
    .filter((b) => !historyIds.has(b.id))
    .map((b) => ({
      book: b,
      score:
        (authors.has(b.authorId ?? b.authorName) ? 2 : 0) +
        (categories.has(b.categoryId ?? b.categoryName) ? 1 : 0) +
        (b.availableCopies > 0 ? 0.5 : 0),
    }))
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.book)

  return items.length > 0 ? { items, personalized: true } : discover()
}

export const countByCategory = (books: BookDto[]): Record<string, number> =>
  books.reduce<Record<string, number>>((acc, b) => {
    const key = b.categoryId ?? b.categoryName
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

export const greeting = (): string => {
  const h = new Date().getHours()
  if (h < 11) return 'Chào buổi sáng'
  if (h < 14) return 'Chào buổi trưa'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

/** Tên gọi: từ cuối của họ tên (Nguyễn Văn An → An) */
export const givenName = (fullName?: string): string =>
  fullName?.trim().split(/\s+/).pop() ?? 'bạn đọc'
