/**
 * Quy định chung của thư viện (dễ sửa đổi theo mục 7)
 */
export const LIBRARY_RULES = {
  standardBorrowDays: 14,
  maxRenewTimes: 3,
  renewalExtensionDays: 7,
  finePerDayVND: 5000,
  maxConcurrentLoans: 5,
  maxConcurrentReservations: 3,
  reservationHoldHours: 48,
} as const
