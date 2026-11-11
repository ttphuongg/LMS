import React, { useEffect, useState, useCallback } from 'react'
import { Row, Col, Card, Button, Space } from 'antd'
import {
  BookOutlined,
  ReadOutlined,
  WarningOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PlusOutlined,
  SwapOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { notificationsApi } from '../api'
import type { DashboardStats } from '../types'
import { PageHeader } from '@/shared/components/PageHeader'
import { formatCurrency, getErrorMessage } from '@/shared/utils/format'
import { LoadingState } from '@/shared/components/LoadingState'
import { ErrorState } from '@/shared/components/ErrorState'
import { useRequestGuard } from '@/shared/hooks'
import { mutedText13Style, outlineButtonStyle, primaryButtonStyle } from '@/shared/styles/ui'

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const guard = useRequestGuard()

  const fetchStats = useCallback(async () => {
    const reqId = guard.next()
    try {
      setLoading(true)
      setError(null)
      const data = await notificationsApi.getDashboardStats()
      if (!guard.isLatest(reqId)) return
      setStats(data)
    } catch (err: unknown) {
      if (!guard.isLatest(reqId)) return
      setStats(null)
      setError(getErrorMessage(err, 'Không thể kết nối đến máy chủ để tải dữ liệu thống kê.'))
    } finally {
      if (guard.isLatest(reqId)) setLoading(false)
    }
  }, [guard])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return <LoadingState tip="Đang tổng hợp dữ liệu thống kê thư viện..." />
  }

  if (error || !stats) {
    return (
      <ErrorState
        title="Lỗi tải dữ liệu thống kê"
        subTitle={error || 'Không thể lấy dữ liệu thống kê thư viện.'}
        onRetry={fetchStats}
      />
    )
  }

  const statCards = [
    {
      title: 'Bản sao vật lý đang lưu hành',
      value: stats.totalBooks,
      suffix: stats.totalBookTitles ? `bản (${stats.totalBookTitles} đầu sách)` : 'bản sao',
      color: 'var(--primary)',
      icon: <BookOutlined style={{ fontSize: 24, color: 'var(--primary)' }} />,
      onClick: () => navigate('/admin/books'),
    },
    {
      title: 'Tài liệu đang lưu thông mượn',
      value: stats.totalActiveLoans,
      suffix: 'cuốn',
      color: 'var(--primary)',
      icon: <ReadOutlined style={{ fontSize: 24, color: 'var(--primary)' }} />,
      onClick: () => navigate('/admin/loans'),
    },
    {
      title: 'Tài liệu quá hạn chưa trả',
      value: stats.totalOverdueLoans,
      suffix: 'cuốn',
      color: 'var(--destructive)',
      icon: <WarningOutlined style={{ fontSize: 24, color: 'var(--destructive)' }} />,
      onClick: () => navigate('/admin/loans'),
    },
    {
      title: 'Tổng bạn đọc có thẻ',
      value: stats.totalUsers,
      suffix: 'thành viên',
      color: 'var(--foreground)',
      icon: <UserOutlined style={{ fontSize: 24, color: 'var(--accent)' }} />,
      onClick: () => navigate('/admin/users'),
    },
    {
      title: 'Lượt đặt trước đang chờ',
      value: stats.pendingReservations,
      suffix: 'lượt',
      color: 'var(--accent)',
      icon: <ClockCircleOutlined style={{ fontSize: 24, color: 'var(--accent)' }} />,
      onClick: () => navigate('/admin/reservations'),
    },
    {
      title: 'Tiền phạt chưa thu hồi',
      value: formatCurrency(stats.unpaidFinesTotal),
      isRaw: true,
      color: 'var(--destructive)',
      icon: <DollarOutlined style={{ fontSize: 24, color: 'var(--destructive)' }} />,
      onClick: () => navigate('/admin/fines'),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Tổng Quan Quản Trị Hệ Thống"
        subtitle="Báo cáo tình hình lưu thông tài liệu học thuật và vận hành thư viện theo thời gian thực"
        breadcrumbs={[{ title: 'Quản trị' }, { title: 'Tổng quan' }]}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/books/new')}
              style={primaryButtonStyle}
            >
              Nhập sách mới
            </Button>
            <Button
              icon={<SwapOutlined />}
              onClick={() => navigate('/admin/loans/borrow')}
              style={outlineButtonStyle}
            >
              Lập phiếu mượn
            </Button>
            <Button
              icon={<RollbackOutlined />}
              onClick={() => navigate('/admin/loans/return')}
              style={outlineButtonStyle}
            >
              Nhận trả sách
            </Button>
          </Space>
        }
      />

      {/* Lưới thống kê */}
      <Row gutter={[20, 20]} style={{ marginBottom: 'var(--sp-8)' }}>
        {statCards.map((sc, i) => (
          <Col xs={24} sm={12} lg={8} key={i}>
            <Card
              hoverable
              className="catalog-card"
              onClick={sc.onClick}
              style={{
                background: 'var(--card)',
                cursor: 'pointer',
                borderColor: 'var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 'var(--sp-2)' }}>{sc.title}</div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: sc.color,
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.2,
                    }}
                  >
                    {sc.value}
                    {sc.suffix && (
                      <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: 'var(--sp-2)' }}>
                        {sc.suffix}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--background)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border)',
                  }}
                >
                  {sc.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Khu vực thông số nghiệp vụ hôm nay */}
      <Card className="catalog-card" style={{ background: 'var(--card)', borderRadius: 'var(--radius)' }}>
        <h3
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 18,
            color: 'var(--primary)',
            marginBottom: 'var(--sp-4)',
          }}
        >
          Hoạt Động Lưu Thông Trong Ngày
        </h3>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <div
              style={{
                padding: 'var(--sp-4) var(--sp-5)',
                background: 'var(--background)',
                borderLeft: '4px solid var(--primary)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={mutedText13Style}>Số lượt mượn sách hôm nay</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                {stats.todayLoans} cuốn
              </div>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div
              style={{
                padding: 'var(--sp-4) var(--sp-5)',
                background: 'var(--background)',
                borderLeft: '4px solid var(--accent)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={mutedText13Style}>Số lượt hoàn trả hôm nay</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                {stats.todayReturns} cuốn
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
