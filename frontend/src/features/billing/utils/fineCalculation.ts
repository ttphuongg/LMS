/**
 * Quy định tính phí phạt và bồi hoàn của Thư viện Domus Libri
 * - Căn cứ: CHƯƠNG III. PHÍ PHẠT VÀ BỒI THƯỜNG (Điều 7 & Điều 8)
 */

export const LIBRARY_FINE_RULES = {
  /** Phí quá hạn mỗi ngày: 5.000 VNĐ / ngày (Điều 7) */
  OVERDUE_FEE_PER_DAY: 5000,

  /** Trần phí quá hạn tối đa: 150% giá trị cuốn sách (Điều 7) */
  OVERDUE_CAP_RATIO: 1.5,

  /** Bồi thường làm mất sách: 150% giá trị sách (Điều 8) */
  LOST_BOOK_RATIO: 1.5,

  /** Bồi thường hư hỏng nhẹ (xước bìa, gập góc, vết bẩn nhỏ): 30% giá trị sách (Điều 8) */
  MINOR_DAMAGE_RATIO: 0.3,

  /** Bồi thường hư hỏng nặng (mất trang, rách chữ, ngấm nước mốc biến dạng): 100% giá trị sách (Điều 8) */
  MAJOR_DAMAGE_RATIO: 1.0,

  /** Giá trị sách mặc định khi cuốn sách không có giá trị ghi nhận */
  DEFAULT_BOOK_VALUE: 100000,
}

export interface OverdueFineCalculationResult {
  daysOverdue: number
  rawAmount: number
  amount: number
  isCapped: boolean
  capAmount?: number
  formula: string
}

/**
 * Tính tiền phạt trả chậm (quá hạn) theo Điều 7
 * @param daysOverdue Số ngày quá hạn
 * @param bookValue Giá trị của cuốn sách (VNĐ)
 */
export function calculateOverdueFine(
  daysOverdue: number,
  bookValue?: number | null
): OverdueFineCalculationResult {
  const safeDays = Math.max(0, daysOverdue)
  const rawAmount = safeDays * LIBRARY_FINE_RULES.OVERDUE_FEE_PER_DAY

  if (bookValue != null && bookValue > 0) {
    const capAmount = Math.round(bookValue * LIBRARY_FINE_RULES.OVERDUE_CAP_RATIO)
    const isCapped = rawAmount > capAmount
    const amount = isCapped ? capAmount : rawAmount

    const formula = isCapped
      ? `${safeDays} ngày × 5,000đ = ${rawAmount.toLocaleString('vi-VN')}đ ➔ Đạt trần 150% giá sách (${capAmount.toLocaleString('vi-VN')}đ)`
      : `${safeDays} ngày × 5,000đ/ngày = ${amount.toLocaleString('vi-VN')}đ`

    return { daysOverdue: safeDays, rawAmount, amount, isCapped, capAmount, formula }
  }

  return {
    daysOverdue: safeDays,
    rawAmount,
    amount: rawAmount,
    isCapped: false,
    formula: `${safeDays} ngày × 5,000đ/ngày = ${rawAmount.toLocaleString('vi-VN')}đ`,
  }
}

export interface IncidentCompensationResult {
  ratio: number
  percentage: number
  amount: number
  ruleName: string
  formula: string
}

/**
 * Tính số tiền bồi thường sự cố (hỏng hoặc mất sách) theo Điều 8
 * @param incidentType Loại sự cố ('Lost' | 'Damaged')
 * @param severity Mức độ nghiêm trọng ('Minor' | 'Major' | 'TotalLoss')
 * @param bookValue Giá trị gốc của sách (VNĐ)
 */
export function calculateIncidentCompensation(
  incidentType: 'Lost' | 'Damaged',
  severity: 'Minor' | 'Major' | 'TotalLoss',
  bookValue?: number | null
): IncidentCompensationResult {
  const baseValue = bookValue != null && bookValue > 0 ? bookValue : LIBRARY_FINE_RULES.DEFAULT_BOOK_VALUE

  if (incidentType === 'Lost') {
    const ratio = LIBRARY_FINE_RULES.LOST_BOOK_RATIO
    const amount = Math.round(baseValue * ratio)
    return {
      ratio,
      percentage: 150,
      amount,
      ruleName: 'Mất sách (Bồi thường 150% giá trị sách)',
      formula: `Giá sách: ${baseValue.toLocaleString('vi-VN')}đ × 150% = ${amount.toLocaleString('vi-VN')}đ (Điều 8 Quy chế)`,
    }
  }

  if (severity === 'Minor') {
    const ratio = LIBRARY_FINE_RULES.MINOR_DAMAGE_RATIO
    const amount = Math.round(baseValue * ratio)
    return {
      ratio,
      percentage: 30,
      amount,
      ruleName: 'Hư hỏng nhẹ (Bồi thường 30% giá trị sách)',
      formula: `Giá sách: ${baseValue.toLocaleString('vi-VN')}đ × 30% = ${amount.toLocaleString('vi-VN')}đ (Điều 8 Quy chế)`,
    }
  }

  // Major hoặc TotalLoss
  const ratio = LIBRARY_FINE_RULES.MAJOR_DAMAGE_RATIO
  const amount = Math.round(baseValue * ratio)
  return {
    ratio,
    percentage: 100,
    amount,
    ruleName: 'Hư hỏng nặng / Mất trang (Bồi thường 100% giá trị sách)',
    formula: `Giá sách: ${baseValue.toLocaleString('vi-VN')}đ × 100% = ${amount.toLocaleString('vi-VN')}đ (Điều 8 Quy chế)`,
  }
}

