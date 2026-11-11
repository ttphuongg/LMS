/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '@/shared/api/client'
import type { ApiResponse, PagedResult } from '@/shared/api/types'
import type {
  LoanSlipDto,
  ReservationDto,
  RenewalRequestDto,
  CreateReservationRequest,
  RequestRenewalRequest,
  CreateStaffLoanRequest,
  ReturnLoanRequest,
  ApproveRenewalRequest,
  ReportIncidentRequest,
} from './types'

export const circulationApi = {
  // ── Dành cho Reader ──────────────────────────────────────────────────────────
  getMyLoans: async (): Promise<LoanSlipDto[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/api/circulation/my-loans')
    const list = res.data.data || []
    return list.map((loan: any) => ({
      id: String(loan.loanSlipId),
      loanSlipId: loan.loanSlipId,
      slipNumber: `LS-${loan.loanSlipId}`,
      readerId: '',
      readerName: 'Bạn đọc',
      readerEmail: '',
      librarianId: '',
      borrowDate: loan.borrowDate,
      borrowedAt: loan.borrowDate,
      dueDate: loan.details?.[0]?.dueDate || loan.borrowDate,
      status: loan.status,
      details: (loan.details || []).map((d: any) => ({
        id: String(d.detailId),
        detailId: d.detailId,
        loanSlipId: String(loan.loanSlipId),
        bookCopyId: String(d.bookCopyId),
        bookCopyIdInt: d.bookCopyId,
        barcode: d.barcode || `BC-${d.bookCopyId}`,
        bookTitle: d.bookTitle || 'Tài liệu thư viện',
        dueDate: String(d.dueDate),
        returnDate: d.returnedDate ? String(d.returnedDate) : undefined,
        returnedDate: d.returnedDate ? String(d.returnedDate) : undefined,
        actualReturnDate: d.returnedDate ? String(d.returnedDate) : undefined,
        status: d.status,
        renewalCount: d.renewalsCount || 0,
        renewalsCount: d.renewalsCount || 0,
      })),
    }))
  },

  getMyReservations: async (): Promise<ReservationDto[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/api/circulation/my-reservations')
    const list = res.data.data || []
    return list.map((r: any) => ({
      id: String(r.id),
      reservationId: r.id,
      bookId: String(r.bookId),
      bookIdInt: r.bookId,
      bookTitle: r.bookTitle || 'Sách đã đặt',
      readerId: '',
      readerName: '',
      reservedAt: r.reservedAt,
      expiresAt: r.expiresAt || undefined,
      status: r.status,
      bookCopyId: r.bookCopyId,
      barcode: r.barcode,
    }))
  },

  createReservation: async (data: CreateReservationRequest): Promise<ReservationDto> => {
    const res = await apiClient.post<ApiResponse<number>>('/api/circulation/reservations', {
      bookId: Number(data.bookId),
    })
    return {
      id: String(res.data.data),
      reservationId: res.data.data,
      bookId: String(data.bookId),
      bookTitle: 'Sách đã đặt trước',
      readerId: '',
      readerName: '',
      reservedAt: new Date().toISOString(),
      status: 'Waiting',
    }
  },

  cancelReservation: async (id: string | number): Promise<void> => {
    await apiClient.delete<ApiResponse>(`/api/circulation/reservations/${id}`)
  },

  markReservationReady: async (id: string | number): Promise<void> => {
    await apiClient.post<ApiResponse>(`/api/circulation/reservations/${id}/ready`)
  },

  fulfillReservation: async (id: string | number): Promise<void> => {
    await apiClient.post<ApiResponse>(`/api/circulation/reservations/${id}/fulfill`)
  },

  requestRenewal: async (detailId: string, data: RequestRenewalRequest): Promise<void> => {
    const formattedDate = data.newDueDate.includes('T') ? data.newDueDate.split('T')[0] : data.newDueDate
    await apiClient.post<ApiResponse>(`/api/circulation/loan-details/${detailId}/renewals`, {
      newDueDate: formattedDate,
      reason: data.reason || null,
    })
  },

  // ── Dành cho Staff (Librarian / Admin) ───────────────────────────────────────
  createLoan: async (data: CreateStaffLoanRequest): Promise<LoanSlipDto> => {
    if (!data.bookCopyIds || data.bookCopyIds.length === 0) {
      throw new Error('Vui lòng cung cấp ít nhất một mã bản sao hoặc mã vạch sách.')
    }

    const resolvedCopyIds: number[] = []
    for (const item of data.bookCopyIds) {
      const rawBarcode = String(item).trim()
      if (!rawBarcode) continue

      try {
        const lookup = await apiClient.get<ApiResponse<{ id: number; barcode: string; status: string }>>(
          `/api/catalog/copies/lookup?barcode=${encodeURIComponent(rawBarcode)}`
        )
        if (lookup.data?.data?.id) {
          resolvedCopyIds.push(Number(lookup.data.data.id))
          continue
        }
        throw new Error(`Mã vạch "${rawBarcode}" không tồn tại trong hệ thống mục lục.`)
      } catch (err: any) {
        const status = err.response?.status
        const errMsg = err.message || ''
        if (status === 401 || status === 403) {
          throw new Error('Bạn không có quyền tra cứu thông tin bản sao sách. Vui lòng đăng nhập lại.', { cause: err })
        }
        if (status >= 500 || errMsg.includes('Network Error') || errMsg.includes('Lỗi kết nối')) {
          throw new Error(`Lỗi kết nối máy chủ khi tra cứu mã vạch "${rawBarcode}": ${errMsg}`, { cause: err })
        }

        const numeric = Number(rawBarcode)
        if (!isNaN(numeric) && Number.isInteger(numeric) && numeric > 0 && numeric < 100000) {
          resolvedCopyIds.push(numeric)
          continue
        }

        throw new Error(`Mã vạch "${rawBarcode}" không tồn tại trong hệ thống mục lục.`, { cause: err })
      }
    }

    if (resolvedCopyIds.length === 0) {
      throw new Error('Không có bản sao sách hợp lệ nào để lập phiếu mượn.')
    }

    const payload = {
      accountId: Number(data.accountId),
      dueDate: data.dueDate.includes('T') ? data.dueDate.split('T')[0] : data.dueDate,
      bookCopyIds: resolvedCopyIds,
      notes: data.notes || null,
    }

    const res = await apiClient.post<ApiResponse<number>>('/api/circulation/loans', payload)
    const newLoanId = String(res.data.data)
    return await circulationApi.getLoanById(newLoanId)
  },

  getAllLoans: async (params?: { status?: string | number; keyword?: string; openOnly?: boolean; page?: number; pageSize?: number }): Promise<PagedResult<LoanSlipDto>> => {
    const queryParams: Record<string, unknown> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    }
    if (params?.keyword && params.keyword.trim()) {
      queryParams.keyword = params.keyword.trim()
    }
    if (params?.openOnly) {
      queryParams.openOnly = true
    }

    const statusMap: Record<string, number> = {
      Pending: 0,
      Active: 1,
      Borrowing: 1,
      Returned: 2,
      Overdue: 3,
      Cancelled: 4,
    }

    if (params?.status !== undefined && params?.status !== '' && params?.status !== 'ALL') {
      if (typeof params.status === 'number') {
        queryParams.status = params.status
      } else if (!isNaN(Number(params.status))) {
        queryParams.status = Number(params.status)
      } else if (statusMap[params.status] !== undefined) {
        queryParams.status = statusMap[params.status]
      }
    }

    const res = await apiClient.get<ApiResponse<{ items: any[]; totalCount: number }>>('/api/circulation/loans', { params: queryParams })
    const data = res.data.data
    const items: LoanSlipDto[] = (data?.items || []).map((l: any) => ({
      id: String(l.id),
      loanSlipId: l.id,
      slipNumber: `LS-${l.id}`,
      readerId: String(l.accountId),
      accountId: l.accountId,
      readerName: l.readerName || `Bạn đọc #${l.accountId}`,
      readerEmail: '',
      librarianId: String(l.librarianId || ''),
      borrowDate: l.borrowedAt,
      borrowedAt: l.borrowedAt,
      dueDate: l.dueDate ? String(l.dueDate) : '',
      status: l.status,
      detailCount: l.detailCount,
      details: [],
    }))

    return {
      items,
      totalCount: data?.totalCount || 0,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      totalPages: Math.ceil((data?.totalCount || 0) / (params?.pageSize || 10)) || 1,
    }
  },

  getLoanById: async (id: string): Promise<LoanSlipDto> => {
    const res = await apiClient.get<ApiResponse<any>>(`/api/circulation/loans/${id}`)
    const d = res.data.data
    const loanSlipId = d.loanSlipId ?? d.id
    return {
      id: String(loanSlipId),
      loanSlipId: Number(loanSlipId),
      slipNumber: `LS-${loanSlipId}`,
      readerId: String(d.accountId),
      accountId: d.accountId,
      readerName: d.readerName || d.readerFullName || d.readerUsername || `Bạn đọc #${d.accountId}`,
      readerEmail: '',
      librarianId: String(d.librarianId || ''),
      borrowDate: d.borrowedAt,
      borrowedAt: d.borrowedAt,
      dueDate: String(d.dueDate),
      actualReturnDate: d.returnedDate ? String(d.returnedDate) : undefined,
      status: d.status,
      notes: d.notes,
      details: (d.items || []).map((item: any) => {
        const detailId = item.detailId ?? item.id
        return {
          id: String(detailId),
          detailId: Number(detailId),
          loanSlipId: String(loanSlipId),
          bookCopyId: String(item.bookCopyId),
          bookCopyIdInt: item.bookCopyId,
          barcode: item.barcode || `BC-${item.bookCopyId}`,
          bookTitle: item.bookTitle || 'Tài liệu mượn',
          dueDate: String(d.dueDate),
          returnDate: item.actualReturnDate ? String(item.actualReturnDate) : undefined,
          actualReturnDate: item.actualReturnDate ? String(item.actualReturnDate) : undefined,
          status: item.status,
          renewalCount: item.renewalsCount || 0,
          renewalsCount: item.renewalsCount || 0,
          notes: item.notes,
        }
      }),
    }
  },

  returnLoan: async (id: string, data: ReturnLoanRequest): Promise<void> => {
    const payload = {
      loanSlipId: Number(id),
      returnedCopies: data.returnedCopies.map((c) => ({
        loanSlipDetailId: Number(c.loanSlipDetailId),
        notes: c.notes || 'Hoàn trả tại quầy',
      })),
    }
    await apiClient.post<ApiResponse>(`/api/circulation/loans/${id}/return`, payload)
  },

  getAllRenewals: async (params?: { page?: number; pageSize?: number }): Promise<RenewalRequestDto[]> => {
    const page = params?.page || 1
    const pageSize = params?.pageSize || 50
    const res = await apiClient.get<ApiResponse<{ items: any[]; totalCount: number }>>('/api/circulation/renewals', {
      params: { page, pageSize },
    })
    const items = res.data.data?.items || []
    return items.map((r: any) => ({
      id: String(r.id),
      renewalId: r.id,
      loanSlipDetailId: String(r.loanSlipDetailId),
      loanSlipId: String(r.loanSlipId),
      accountId: r.accountId,
      bookTitle: r.bookTitle || 'Tài liệu',
      barcode: r.barcode || `BC-${r.bookCopyId}`,
      readerName: r.readerName || `Bạn đọc #${r.accountId}`,
      currentDueDate: String(r.oldDueDate),
      oldDueDate: String(r.oldDueDate),
      requestedNewDueDate: String(r.newDueDate),
      newDueDate: String(r.newDueDate),
      reason: r.reason,
      status: r.status,
      renewalNumber: r.renewalNumber,
      librarianId: r.librarianId,
    }))
  },

  reviewRenewal: async (id: string, data: ApproveRenewalRequest): Promise<void> => {
    await apiClient.patch<ApiResponse>(`/api/circulation/renewals/${id}/status`, {
      status: data.status,
      reason: data.reason || null,
    })
  },

  getAllReservations: async (params?: { page?: number; pageSize?: number }): Promise<ReservationDto[]> => {
    const page = params?.page || 1
    const pageSize = params?.pageSize || 50
    const res = await apiClient.get<ApiResponse<{ items: any[]; totalCount: number }>>('/api/circulation/reservations', {
      params: { page, pageSize },
    })
    const items = res.data.data?.items || []
    return items.map((r: any) => ({
      id: String(r.id),
      reservationId: r.id,
      bookId: String(r.bookId),
      bookIdInt: r.bookId,
      bookTitle: r.bookTitle || `Sách #${r.bookId}`,
      readerId: String(r.accountId),
      accountId: r.accountId,
      readerName: r.readerName || `Bạn đọc #${r.accountId}`,
      reservedAt: r.reservedAt,
      expiresAt: r.expiresAt || undefined,
      status: r.status,
      bookCopyId: r.bookCopyId ?? null,
      copyLocationLabel: r.copyLocationLabel ?? null,
    }))
  },

  reportIncident: async (data: ReportIncidentRequest): Promise<void> => {
    const typeMap: Record<string, number> = { Lost: 0, Damaged: 1 }
    const severityMap: Record<string, number> = { Minor: 0, Major: 1, TotalLoss: 2 }

    await apiClient.post<ApiResponse>('/api/circulation/incidents', {
      loanSlipDetailId: Number(data.loanSlipDetailId),
      incidentType: typeMap[data.incidentType] ?? 1,
      severity: severityMap[data.severity] ?? 0,
      description: data.description || null,
      compensationAmount: Number(data.compensationAmount),
    })
  },
}
