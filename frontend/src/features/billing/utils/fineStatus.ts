import type { FineDto, FineStatus } from '../types'
import type { SpineTagProps } from '@/shared/components/SpineTag'

export interface FineStatusMeta {
  label: string
  variant: NonNullable<SpineTagProps['variant']>
}

export const FINE_STATUS_META: Record<FineStatus, FineStatusMeta> = {
  Unpaid: { label: 'Chưa thanh toán', variant: 'danger' },
  Paid: { label: 'Đã thanh toán', variant: 'primary' },
  Cancelled: { label: 'Đã hủy', variant: 'neutral' },
}

export const FINE_STATUS_OPTIONS: Array<{ label: string; value: FineStatus }> = [
  { label: 'Chưa thanh toán', value: 'Unpaid' },
  { label: 'Đã thanh toán', value: 'Paid' },
  { label: 'Đã hủy', value: 'Cancelled' },
]

export const getFineStatusMeta = (status?: string | null): FineStatusMeta => {
  if (status && status in FINE_STATUS_META) {
    return FINE_STATUS_META[status as FineStatus]
  }
  return {
    label: status?.trim() || 'Không xác định',
    variant: 'neutral',
  }
}

/** Kiểm tra phiếu phạt còn có thể thu / nộp tiền (chỉ phiếu Unpaid có số tiền > 0). */
export const isFinePayable = (fine: Pick<FineDto, 'status' | 'amount'>): boolean =>
  fine.status === 'Unpaid' && fine.amount > 0
