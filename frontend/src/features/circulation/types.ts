export type LoanStatus = 'Pending' | 'Active' | 'Borrowing' | 'Returned' | 'Overdue' | 'Cancelled' | 'PartiallyReturned'
export type ReservationStatus =
  | 'Waiting'
  | 'Ready'
  | 'Completed'
  | 'Cancelled'
  | 'Expired'
export type RenewalStatus = 'Pending' | 'Approved' | 'Rejected'
export type IncidentType = 'Lost' | 'Damaged'
export type IncidentSeverity = 'Minor' | 'Major' | 'TotalLoss'

export interface LoanDetailDto {
  id: string
  detailId?: number
  loanSlipId: string
  bookCopyId: string
  bookCopyIdInt?: number
  barcode: string
  bookTitle: string
  dueDate: string
  returnDate?: string
  returnedDate?: string
  actualReturnDate?: string
  status: 'Borrowing' | 'Returned' | 'Overdue' | string
  renewalCount: number
  renewalsCount?: number
  fineAmount?: number
  notes?: string
}

export interface LoanSlipDto {
  id: string
  loanSlipId?: number
  slipNumber: string
  readerId: string
  accountId?: number
  readerName: string
  readerEmail?: string
  librarianId?: string
  borrowDate: string
  borrowedAt?: string
  dueDate: string
  actualReturnDate?: string
  status: LoanStatus | string
  details: LoanDetailDto[]
  notes?: string
  detailCount?: number
}

export interface ReservationDto {
  id: string
  reservationId?: number
  bookId: string
  bookIdInt?: number
  bookTitle: string
  readerId: string
  accountId?: number
  readerName: string
  reservedAt: string
  expiresAt?: string
  status: ReservationStatus | string
  bookCopyId?: number | null
  barcode?: string | null
  copyLocationLabel?: string | null
}

export interface RenewalRequestDto {
  id: string
  renewalId?: number
  loanSlipDetailId: string
  loanSlipId?: string
  accountId?: number
  bookTitle: string
  barcode: string
  readerName: string
  currentDueDate: string
  oldDueDate?: string
  requestedNewDueDate: string
  newDueDate?: string
  reason?: string
  status: RenewalStatus | string
  renewalNumber?: number
  reviewedAt?: string
  reviewNotes?: string
  librarianId?: number | string
}

export interface CreateReservationRequest {
  bookId: string
  bookIdInt?: number
  accountId?: number
}

export interface RequestRenewalRequest {
  newDueDate: string
  reason?: string
}

export interface CreateStaffLoanRequest {
  accountId: string
  accountIdInt?: number
  dueDate: string
  bookCopyIds: string[]
  bookCopyIdInts?: number[]
  librarianId?: number
  notes?: string
}

export interface ReturnBookCopyItem {
  loanSlipDetailId: string | number
  notes?: string
}

export interface ReturnLoanRequest {
  loanSlipId?: number | string
  librarianId?: number | string
  returnedCopies: ReturnBookCopyItem[]
  notes?: string
}

export interface ApproveRenewalRequest {
  renewalId?: number | string
  librarianId?: number | string
  status: 'Approved' | 'Rejected'
  reason?: string
}

export interface ReportIncidentRequest {
  loanSlipDetailId: string | number
  librarianId?: string | number
  incidentType: IncidentType
  severity: IncidentSeverity
  description: string
  compensationAmount: number
}
