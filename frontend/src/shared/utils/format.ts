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

/**
 * Chuẩn hóa chuỗi ngày sinh từ người dùng (hỗ trợ YYYY-MM-DD và DD/MM/YYYY)
 * về định dạng ISO chuẩn YYYY-MM-DD để gửi lên Backend.
 */
export const normalizeDateToIso = (value?: string | null): string | null => {
  if (!value || !value.trim()) return null
  const trimmed = value.trim()
  const matchIso = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (matchIso) {
    const y = matchIso[1]
    const m = matchIso[2].padStart(2, '0')
    const d = matchIso[3].padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const matchVn = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  if (matchVn) {
    const d = matchVn[1].padStart(2, '0')
    const m = matchVn[2].padStart(2, '0')
    const y = matchVn[3]
    return `${y}-${m}-${d}`
  }
  return trimmed
}

/**
 * Kiểm tra tính hợp lệ của ngày sinh theo 5 trường hợp nghiệp vụ của LIBRI:
 * 1. Ngày sinh hợp lệ
 * 2. Sai định dạng: "Ngày sinh không đúng định dạng. Vui lòng kiểm tra lại!"
 * 3. Ngày không tồn tại: "Ngày sinh không hợp lệ. Vui lòng nhập một ngày có thật!" (vd: 31/02/2000, 29/02/2001)
 * 4. Ngày sinh lớn hơn ngày hiện tại: "Ngày sinh không được lớn hơn ngày hiện tại!"
 * 5. Để trống: Cho phép nếu trường không bắt buộc.
 */
export const validateDateOfBirth = (value?: string | null): Promise<void> => {
  // Trường hợp 5: Để trống ngày sinh -> Cho phép (không bắt buộc)
  if (!value || !value.trim()) {
    return Promise.resolve()
  }

  const trimmed = value.trim()
  const matchIso = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  const matchVn = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)

  // Trường hợp 2: Sai định dạng ngày sinh
  if (!matchIso && !matchVn) {
    return Promise.reject(new Error('Ngày sinh không đúng định dạng. Vui lòng kiểm tra lại!'))
  }

  let year: number
  let month: number
  let day: number

  if (matchIso) {
    year = parseInt(matchIso[1], 10)
    month = parseInt(matchIso[2], 10)
    day = parseInt(matchIso[3], 10)
  } else {
    day = parseInt(matchVn![1], 10)
    month = parseInt(matchVn![2], 10)
    year = parseInt(matchVn![3], 10)
  }

  // Trường hợp 3: Ngày không tồn tại trên lịch
  if (month < 1 || month > 12 || year < 1900 || year > 2100) {
    return Promise.reject(new Error('Ngày sinh không hợp lệ. Vui lòng nhập một ngày có thật!'))
  }

  // Tính số ngày chính xác trong tháng của năm đó (bao gồm năm nhuận tháng 2 có 28 hoặc 29 ngày)
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) {
    return Promise.reject(new Error('Ngày sinh không hợp lệ. Vui lòng nhập một ngày có thật!'))
  }

  // Trường hợp 4: Ngày sinh lớn hơn ngày hiện tại
  const isoFormatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const todayIso = getVnTodayKey()
  if (isoFormatted > todayIso) {
    return Promise.reject(new Error('Ngày sinh không được lớn hơn ngày hiện tại!'))
  }

  // Trường hợp 1: Ngày sinh hợp lệ
  return Promise.resolve()
}

/**
 * Lấy thông báo lỗi thân thiện bằng tiếng Việt, triệt tiêu hoàn toàn các mã lỗi kỹ thuật
 * như "Request failed with status code 400", "Bad Request", "Network Error".
 */
export const getErrorMessage = (err: unknown, fallback = 'Cập nhật thất bại. Vui lòng thử lại sau!'): string => {
  if (!err) return fallback

  let msg = ''

  if (err instanceof Error) {
    msg = err.message
  } else if (typeof err === 'string') {
    msg = err
  } else if (typeof err === 'object') {
    const obj = err as { message?: string; error?: string; detail?: string; title?: string }
    msg = obj.message || obj.error || obj.detail || obj.title || ''
  }

  if (!msg) return fallback

  // Lọc bỏ các thông báo lỗi kỹ thuật tiếng Anh / mã lỗi thô
  if (/Request failed with status code 400/i.test(msg) || /^Bad Request$/i.test(msg)) {
    return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại!'
  }

  if (/Request failed with status code 500/i.test(msg) || /^Internal Server Error$/i.test(msg)) {
    return 'Lỗi hệ thống máy chủ. Vui lòng thử lại sau!'
  }

  if (/Network Error/i.test(msg) || /Failed to fetch/i.test(msg)) {
    return 'Không thể kết nối đến máy chủ. Vui lòng thử lại!'
  }

  if (/The JSON value could not be converted/i.test(msg) || /DateOnly/i.test(msg)) {
    return 'Ngày sinh không đúng định dạng. Vui lòng kiểm tra lại!'
  }

  if (msg.includes('Ngày sinh phải trước ngày hiện tại')) {
    return 'Ngày sinh không được lớn hơn ngày hiện tại!'
  }

  return msg
}
