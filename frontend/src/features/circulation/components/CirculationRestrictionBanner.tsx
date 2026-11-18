import React, { useEffect, useState } from 'react'
import { Alert, Button, Spin } from 'antd'
import { WarningOutlined, StopOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/identity'
import { circulationApi } from '../api'
import type { CirculationEligibilityResult } from '../types'

interface CirculationRestrictionBannerProps {
  /** Nếu truyền vào sẽ dùng data sẵn, không cần fetch lại */
  eligibility?: CirculationEligibilityResult | null
}

/**
 * Banner cảnh báo bạn đọc khi tài khoản bị hạn chế chức năng mượn/đặt trước sách.
 * Hiển thị:
 *   - Màu đỏ: Tài khoản bị khóa hoàn toàn (Admin khóa)
 *   - Màu vàng: Chức năng lưu thông bị tạm khóa do nợ phạt quá hạn hoặc sách quá hạn
 *   - Không hiển thị gì khi tài khoản bình thường
 */
export const CirculationRestrictionBanner: React.FC<CirculationRestrictionBannerProps> = ({
  eligibility: externalEligibility,
}) => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [eligibility, setEligibility] = useState<CirculationEligibilityResult | null>(
    externalEligibility ?? null,
  )
  const [loading, setLoading] = useState(!externalEligibility && isAuthenticated)

  useEffect(() => {
    if (externalEligibility !== undefined) {
      setEligibility(externalEligibility)
      setLoading(false)
      return
    }
    if (!isAuthenticated || user?.role !== 'Reader') {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    circulationApi
      .getMyCirculationEligibility()
      .then((result) => {
        if (!cancelled) setEligibility(result)
      })
      .catch(() => {
        // Im lặng nếu lỗi (không làm gián đoạn UX)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.role, externalEligibility])

  if (!isAuthenticated || loading || !eligibility) {
    return loading ? <Spin size="small" style={{ display: 'block', margin: '8px 0' }} /> : null
  }

  // Tài khoản bình thường → không hiển thị banner
  if (eligibility.isEligible) return null

  const isFullyLocked =
    eligibility.restrictionReason?.includes('khóa hoàn toàn') ||
    eligibility.restrictionReason?.includes('khóa bởi quản trị')

  if (isFullyLocked) {
    return (
      <Alert
        type="error"
        showIcon
        icon={<StopOutlined />}
        message="Tài khoản bị khóa"
        description={
          <div>
            <div>{eligibility.restrictionReason ?? 'Tài khoản của bạn hiện đang bị khóa toàn bộ bởi quản trị viên.'}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted-foreground)' }}>
              Vui lòng liên hệ Thủ thư hoặc Quản trị viên để được hỗ trợ.
            </div>
          </div>
        }
        style={{ marginBottom: 16 }}
      />
    )
  }

  // Chức năng bị tạm khóa (phạt quá hạn hoặc sách quá hạn)
  const actions = []
  if (eligibility.hasOverdueFines) {
    actions.push({ label: 'Xem phiếu phạt', to: '/my-fines' })
  }
  if (eligibility.hasOverdueLoans) {
    actions.push({ label: 'Xem sách mượn', to: '/my-loans' })
  }

  return (
    <Alert
      type="warning"
      showIcon
      icon={<WarningOutlined />}
      message="Chức năng mượn & đặt trước tạm thời bị hạn chế"
      description={
        <div>
          <div style={{ marginBottom: 8 }}>
            {eligibility.restrictionReason ?? 'Tài khoản của bạn đang bị hạn chế chức năng lưu thông sách.'}
          </div>

          {eligibility.hasOverdueFines && (
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>
              💳 Khoản phạt quá hạn:{' '}
              <strong>
                {eligibility.overdueFinesCount} hóa đơn —{' '}
                {eligibility.totalOverdueFineAmount.toLocaleString('vi-VN')} đ
              </strong>
            </div>
          )}

          {eligibility.hasOverdueLoans && (
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>
              📚 Sách quá hạn chưa trả: <strong>{eligibility.overdueLoansCount} cuốn</strong>
            </div>
          )}

          {actions.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {actions.map((a) => (
                <Button
                  key={a.to}
                  size="small"
                  type="primary"
                  onClick={() => navigate(a.to)}
                  style={{
                    backgroundColor: 'var(--warning, #d97706)',
                    borderColor: 'var(--warning, #d97706)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      }
      style={{ marginBottom: 16 }}
    />
  )
}

