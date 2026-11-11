import dayjs from 'dayjs'

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const VN_OFFSET_MS = 7 * 60 * 60 * 1000
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/
const HAS_TIMEZONE_REGEX = /(?:Z|[+-]\d{2}:?\d{2})$/i

const formatUtcDateKey = (d: Date): string => {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Chuẩn hóa chuỗi DateTime từ Backend:
 * - Date-only (YYYY-MM-DD): giữ nguyên.
 * - Đã có 'Z' hoặc offset (+/-HH:mm): giữ nguyên.
 * - DateTime ISO chưa có thông tin múi giờ (từ SQL datetime2 lưu UTC): thêm 'Z'.
 */
export const normalizeUtcIso = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed || DATE_ONLY_REGEX.test(trimmed) || HAS_TIMEZONE_REGEX.test(trimmed)) {
    return trimmed
  }
  if (trimmed.includes('T')) {
    return `${trimmed}Z`
  }
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(trimmed)) {
    return `${trimmed.replace(' ', 'T')}Z`
  }
  return trimmed
}

/**
 * Quy đổi thời điểm UTC (hoặc DateOnly) về chuỗi ngày lịch Việt Nam (UTC+7) dạng YYYY-MM-DD,
 * độc lập hoàn toàn với múi giờ hệ điều hành/trình duyệt.
 */
export const toVnDateKey = (value: string | Date): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (DATE_ONLY_REGEX.test(trimmed)) return trimmed
    const ms = Date.parse(normalizeUtcIso(trimmed))
    if (Number.isNaN(ms)) return ''
    return formatUtcDateKey(new Date(ms + VN_OFFSET_MS))
  }
  return formatUtcDateKey(new Date(value.getTime() + VN_OFFSET_MS))
}

/** Ngày hiện tại theo múi giờ Việt Nam (UTC+7) dạng YYYY-MM-DD. */
export const getVnTodayKey = (): string => toVnDateKey(new Date())

const toVnDayjs = (date: string | Date) => {
  if (typeof date === 'string') {
    const trimmed = date.trim()
    if (DATE_ONLY_REGEX.test(trimmed)) {
      return dayjs(trimmed)
    }
    const ms = Date.parse(normalizeUtcIso(trimmed))
    if (Number.isNaN(ms)) return dayjs(trimmed)
    const vn = new Date(ms + VN_OFFSET_MS)
    const vnIso = `${formatUtcDateKey(vn)} ${String(vn.getUTCHours()).padStart(2, '0')}:${String(vn.getUTCMinutes()).padStart(2, '0')}:${String(vn.getUTCSeconds()).padStart(2, '0')}`
    return dayjs(vnIso)
  }
  const vn = new Date(date.getTime() + VN_OFFSET_MS)
  const vnIso = `${formatUtcDateKey(vn)} ${String(vn.getUTCHours()).padStart(2, '0')}:${String(vn.getUTCMinutes()).padStart(2, '0')}:${String(vn.getUTCSeconds()).padStart(2, '0')}`
  return dayjs(vnIso)
}

export const formatDate = (date: string | Date | null | undefined, format = 'DD/MM/YYYY'): string => {
  if (!date) return '—'
  return toVnDayjs(date).format(format)
}

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—'
  return toVnDayjs(date).format('DD/MM/YYYY HH:mm')
}

/** Lấy thông báo lỗi để hiển thị: dùng `err.message` nếu là Error, ngược lại dùng `fallback`. */
export const getErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error ? err.message : fallback
