import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { circulationApi } from '../api'
import { notificationsApi, type DashboardStats } from '@/features/notifications'
import type { LoanDetailDto, LoanSlipDto, RenewalRequestDto, ReservationDto } from '../types'
import { getVnTodayKey, toVnDateKey } from '@/shared/utils/format'

/** Số phiếu mượn gần nhất dùng cho danh sách chi tiết trên Bàn làm việc. */
export const LOAN_POOL = 100

interface Row {
  slip: LoanSlipDto
  detail: LoanDetailDto
}

/** Chuẩn hóa về đầu ngày lịch Việt Nam (UTC+7), độc lập với múi giờ trình duyệt. */
export const startOfDay = (iso: string) => {
  const vnKey = toVnDateKey(iso)
  return vnKey ? dayjs(vnKey) : dayjs(iso).startOf('day')
}

/** Tải và tổng hợp số liệu cho "Bàn làm việc" của thủ thư (kết hợp tổng SQL từ /api/dashboard/stats). */
export function useDeskData() {
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [renewals, setRenewals] = useState<RenewalRequestDto[]>([])
  const [reservations, setReservations] = useState<ReservationDto[]>([])
  const [slips, setSlips] = useState<LoanSlipDto[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [truncated, setTruncated] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [ren, res, loans, dash] = await Promise.allSettled([
      circulationApi.getAllRenewals({ page: 1, pageSize: 100 }),
      circulationApi.getAllReservations({ page: 1, pageSize: 100 }),
      circulationApi.getAllLoans({ page: 1, pageSize: LOAN_POOL }),
      notificationsApi.getDashboardStats(),
    ])

    const rawSlips = loans.status === 'fulfilled' ? loans.value.items : []

    const openSlips = rawSlips.filter((s) => s.status !== 'Returned' && s.status !== 'Cancelled')
    const targetSlips = openSlips.slice(0, 25)

    let enrichedSlips = rawSlips
    if (targetSlips.length > 0) {
      try {
        const detailResults = await Promise.allSettled(
          targetSlips.map((s) => circulationApi.getLoanById(s.id))
        )
        const detailedMap = new Map<string, LoanSlipDto>()
        detailResults.forEach((r) => {
          if (r.status === 'fulfilled' && r.value) {
            detailedMap.set(r.value.id, r.value)
          }
        })
        enrichedSlips = rawSlips.map((s) => detailedMap.get(s.id) || s)
      } catch {
        // Fallback giữ nguyên rawSlips nếu có lỗi mạng
      }
    }

    setRenewals(ren.status === 'fulfilled' ? ren.value : [])
    setReservations(res.status === 'fulfilled' ? res.value : [])
    setSlips(enrichedSlips)
    setStats(dash.status === 'fulfilled' ? dash.value : null)
    setTruncated(loans.status === 'fulfilled' && loans.value.totalCount > loans.value.items.length)
    setFailed([ren, res, loans].some((r) => r.status === 'rejected'))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const data = useMemo(() => {
    const today = dayjs(getVnTodayKey())
    const rows: Row[] = slips.flatMap((slip) => slip.details.map((detail) => ({ slip, detail })))
    const open = rows.filter((r) => r.detail.status !== 'Returned')
    const overdue = open
      .filter((r) => r.detail.status === 'Overdue' || startOfDay(r.detail.dueDate).isBefore(today))
      .sort((a, b) => startOfDay(a.detail.dueDate).valueOf() - startOfDay(b.detail.dueDate).valueOf())
    const overdueIds = new Set(overdue.map((r) => r.detail.id))

    const ready = reservations.filter((r) => r.status === 'Ready')
    const waiting = stats ? (stats.waitingReservations ?? 0) : reservations.filter((r) => r.status === 'Waiting').length
    const pendingRenewals = renewals.filter((r) => r.status === 'Pending')
    const dueTodayFallback = open.filter((r) => startOfDay(r.detail.dueDate).isSame(today) && !overdueIds.has(r.detail.id)).length

    return {
      pendingRenewals,
      pendingRenewalsTotalCount: stats ? (stats.pendingRenewals ?? pendingRenewals.length) : pendingRenewals.length,
      ready,
      readyTotalCount: stats ? (stats.readyReservations ?? ready.length) : ready.length,
      waiting,
      overdue,
      overdueTotalCount: stats ? stats.totalOverdueLoans : overdue.length,
      dueToday: stats ? (stats.dueTodayLoans ?? dueTodayFallback) : dueTodayFallback,
      borrowedToday: stats ? stats.todayLoans : slips.filter((s) => startOfDay(s.borrowDate).isSame(today)).length,
      returnedToday: stats ? stats.todayReturns : rows.filter((r) => r.detail.returnDate && startOfDay(r.detail.returnDate).isSame(today)).length,
    }
  }, [slips, renewals, reservations, stats])

  return { loading, failed, truncated, data, reload: load }
}
