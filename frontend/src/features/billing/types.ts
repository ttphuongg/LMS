export type FineStatus = 'Unpaid' | 'Paid' | 'Cancelled'
export type FineType = 'Overdue' | 'Compensation' | 'Other' | 0 | 1 | 2
export type FineReason = 'Overdue' | 'DamagedBook' | 'LostBook' | 'AdministrativeFee' | 'Compensation' | 'Other'
export type PaymentMethod = 'Cash' | 'BankTransfer' | 'Other'

export interface FineDto {
  id: string
  fineId?: number
  fineNumber: string
  readerId: string
  accountId?: number
  readerName: string
  readerEmail?: string
  fineType?: FineType | string
  loanSlipDetailId?: string
  incidentId?: string
  bookTitle?: string
  amount: number
  status: FineStatus | string
  reason: FineReason | string
  description?: string
  createdAt: string
  issuedAt?: string
  dueDate?: string
  paymentDueDate?: string
  paidAt?: string
  paymentMethod?: PaymentMethod | string
}

export interface CreateFineRequest {
  accountId: string
  accountIdInt?: number
  amount: number
  fineType?: FineType | number
  reason: FineReason | string
  description?: string
  loanSlipDetailId?: string | number
  incidentId?: string | number
  paymentDueDate?: string
  dueDate?: string // Tương thích ngược
}

export interface PayFineRequest {
  paymentMethod: PaymentMethod
  notes?: string
}

export interface FineSummaryStats {
  totalFineAmount: number
  totalPaidAmount: number
  totalRemainingAmount: number
}
