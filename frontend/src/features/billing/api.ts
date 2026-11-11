/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '@/shared/api/client'
import type { ApiResponse, PagedResult } from '@/shared/api/types'
import type {
  FineDto,
  FineStatus,
  FineSummaryStats,
  PaymentMethod,
  CreateFineRequest,
  PayFineRequest,
} from './types'

// Khớp đúng giá trị enum FineStatus trên Backend: Unpaid = 0, Paid = 2, Cancelled = 3
const FINE_STATUS_MAP: Record<FineStatus, number> = {
  Unpaid: 0,
  Paid: 2,
  Cancelled: 3,
}

const PAYMENT_METHOD_MAP: Record<PaymentMethod, number> = {
  Cash: 0,
  BankTransfer: 1,
  Other: 2,
}

const formatFineTypeLabel = (fineType?: string): string => {
  if (fineType === 'Overdue') return 'Phí trả sách trễ hạn'
  if (fineType === 'Compensation') return 'Phí bồi thường tài liệu'
  if (fineType === 'Other') return 'Khoản phí phạt khác'
  return fineType || 'Khoản phí phạt thư viện'
}

const mapFineSummary = (f: any, isStaffView: boolean): FineDto => {
  const amount = Number(f.amount ?? 0)
  const status = String(f.status || 'Unpaid')

  const apiReaderName =
    typeof f.readerName === 'string' && f.readerName.trim() ? f.readerName.trim() : ''
  const fallbackReaderName =
    isStaffView && f.accountId !== undefined ? `Account #${f.accountId}` : 'Bạn đọc'

  return {
    id: String(f.id),
    fineId: f.id,
    fineNumber: `FP-${f.id}`,
    readerId: isStaffView && f.accountId !== undefined ? String(f.accountId) : '',
    accountId: f.accountId,
    readerName: apiReaderName || fallbackReaderName,
    readerEmail: '',
    fineType: f.fineType,
    amount,
    status,
    reason: f.fineType || 'Overdue',
    description: formatFineTypeLabel(f.fineType),
    createdAt: f.issuedAt,
    issuedAt: f.issuedAt,
    dueDate: f.dueDate ? String(f.dueDate) : undefined,
    paymentDueDate: f.dueDate ? String(f.dueDate) : undefined,
  }
}

export const billingApi = {
  // Tiền phạt của bạn đọc hiện tại
  getMyFines: async (): Promise<FineDto[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/api/billing/my-fines')
    const list = res.data.data || []
    return list.map((f: any) => mapFineSummary(f, false))
  },

  // Thanh toán trực tiếp toàn bộ tiền phạt một lần (StaffOnly - Direct Full Payment)
  payFine: async (id: string, data: PayFineRequest): Promise<void> => {
    const methodEnum = PAYMENT_METHOD_MAP[data.paymentMethod]
    if (methodEnum === undefined) {
      throw new Error('Phương thức thanh toán không được hệ thống hỗ trợ')
    }

    const payload: Record<string, unknown> = {
      paymentMethod: methodEnum,
    }
    if (data.notes && data.notes.trim()) {
      payload.notes = data.notes.trim()
    }

    await apiClient.post<ApiResponse>(`/api/billing/fines/${id}/payments`, payload)
  },

  // Lấy danh sách tất cả phiếu phạt phân trang, tìm kiếm & lọc trạng thái (StaffOnly)
  getAllFines: async (params?: {
    status?: FineStatus | string | number
    keyword?: string
    page?: number
    pageSize?: number
  }): Promise<PagedResult<FineDto> & { summary: FineSummaryStats | null }> => {
    const page = params?.page && params.page >= 1 ? params.page : 1
    const pageSize = params?.pageSize && params.pageSize >= 1 ? Math.min(params.pageSize, 100) : 10

    const queryParams: Record<string, unknown> = { page, pageSize }
    if (params?.keyword && params.keyword.trim()) {
      queryParams.keyword = params.keyword.trim()
    }
    if (params?.status !== undefined && params?.status !== null && params?.status !== '' && params?.status !== 'ALL') {
      const statusInt =
        typeof params.status === 'number'
          ? params.status
          : (FINE_STATUS_MAP[params.status as FineStatus] ??
            (isNaN(Number(params.status)) ? undefined : Number(params.status)))
      if (statusInt !== undefined && [0, 2, 3].includes(statusInt)) {
        queryParams.status = statusInt
      }
    }

    const res = await apiClient.get<
      ApiResponse<{ items: any[]; totalCount: number; summary?: FineSummaryStats | null }>
    >('/api/billing/fines', {
      params: queryParams,
    })
    const data = res.data.data
    const list = data?.items || []
    const totalCount = data?.totalCount ?? 0
    const rawSummary = data?.summary
    const summary: FineSummaryStats | null =
      rawSummary !== undefined && rawSummary !== null
        ? {
            totalFineAmount: Number(rawSummary.totalFineAmount ?? 0),
            totalPaidAmount: Number(rawSummary.totalPaidAmount ?? 0),
            totalRemainingAmount: Number(rawSummary.totalRemainingAmount ?? 0),
          }
        : null

    return {
      items: list.map((f: any) => mapFineSummary(f, true)),
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize) || 1,
      summary,
    }
  },

  // Lập phiếu phạt mới (StaffOnly)
  createFine: async (data: CreateFineRequest): Promise<FineDto> => {
    const typeMap: Record<string, number> = {
      Overdue: 0,
      DamagedBook: 1,
      Damage: 1,
      Compensation: 1,
      LostBook: 1,
      Lost: 1,
      AdministrativeFee: 2,
      Other: 2,
    }

    let fineTypeEnum = 2
    if (typeof data.fineType === 'number') {
      fineTypeEnum = data.fineType
    } else if (data.fineType && typeMap[data.fineType] !== undefined) {
      fineTypeEnum = typeMap[data.fineType]
    } else if (data.reason && typeMap[data.reason] !== undefined) {
      fineTypeEnum = typeMap[data.reason]
    }

    const dueDateVal = data.paymentDueDate || data.dueDate
    const payload = {
      accountId: Number(data.accountId),
      loanSlipDetailId: data.loanSlipDetailId ? Number(data.loanSlipDetailId) : null,
      incidentId: data.incidentId ? Number(data.incidentId) : null,
      fineType: fineTypeEnum,
      amount: Number(data.amount),
      paymentDueDate: dueDateVal ? (dueDateVal.includes('T') ? dueDateVal.split('T')[0] : dueDateVal) : null,
    }

    const res = await apiClient.post<ApiResponse<number>>('/api/billing/fines', payload)
    const newFineId = String(res.data.data)

    const fineTypeName =
      fineTypeEnum === 0 ? 'Overdue' : fineTypeEnum === 1 ? 'Compensation' : 'Other'

    return {
      id: newFineId,
      fineId: res.data.data,
      fineNumber: `FP-${newFineId}`,
      readerId: String(data.accountId),
      accountId: Number(data.accountId),
      readerName: `Account #${data.accountId}`,
      amount: data.amount,
      status: 'Unpaid',
      reason: fineTypeName,
      description: formatFineTypeLabel(fineTypeName),
      createdAt: new Date().toISOString(),
    }
  },
}
