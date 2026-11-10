/**
 * Quy định chung của thư viện (dễ sửa đổi theo mục 7)
 */
export const LIBRARY_RULES = {
  standardBorrowDays: 14,
  maxRenewTimes: 2,
  renewalExtensionDays: 7,
  finePerDayVND: 5000,
  maxConcurrentLoans: 5,
  reservationHoldHours: 48,
} as const
