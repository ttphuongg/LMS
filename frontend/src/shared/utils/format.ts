import dayjs from 'dayjs'

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export const formatDate = (date: string | Date | null | undefined, format = 'DD/MM/YYYY'): string => {
  if (!date) return '—'
  return dayjs(date).format(format)
}

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—'
  return dayjs(date).format('DD/MM/YYYY HH:mm')
}

/** Lấy thông báo lỗi để hiển thị: dùng `err.message` nếu là Error, ngược lại dùng `fallback`. */
export const getErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error ? err.message : fallback
