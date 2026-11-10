import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Avatar, Row, Col } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { UserOutlined, PhoneOutlined, MailOutlined, KeyOutlined, LogoutOutlined, HomeOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { identityApi } from '../api'
import { useAuth } from '../authStore'
import { PageHeader } from '@/shared/components/PageHeader'
import { SpineTag } from '@/shared/components/SpineTag'
import { LoadingState } from '@/shared/components/LoadingState'
import type { CurrentUser } from '@/shared/api/types'
import { useStableCallback } from '@/shared/hooks'
import { cardStyle, mutedTextStyle, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { user: authUser, setAuth, logout } = useAuth()
  const [profile, setProfile] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const fetchProfile = useStableCallback(async () => {
    try {
      setLoading(true)
      const data = await identityApi.getProfile()
      setProfile(data)

    } catch {
      message.error('Không thể tải thông tin hồ sơ')
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (!loading && profile) {
      form.setFieldsValue({
        fullName: profile.fullName,
        phone: profile.phone || profile.phoneNumber,
        address: profile.address,
        dateOfBirth: profile.dateOfBirth,
      })
    }
  }, [loading, profile, form])

  const handleUpdate = async (values: { fullName: string; phone?: string; address?: string; dateOfBirth?: string }) => {
    try {
      setSaving(true)
      const updated = await identityApi.updateProfile(values)
      setProfile(updated)
      if (authUser) {
        setAuth({ ...authUser, ...updated }, sessionStorage.getItem('lms_access_token') || '')
      }
      message.success('Cập nhật hồ sơ bạn đọc thành công')
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi cập nhật'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingState tip="Đang truy xuất thông tin thẻ..." />
  }

  return (
    <div>
      <PageHeader
        title="Hồ Sơ Bạn Đọc"
        subtitle="Thông tin cá nhân, quyền hạn thẻ và lịch sử định danh trên hệ thống thư viện"
        breadcrumbs={[{ title: 'Trang chủ', href: '/' }, { title: 'Hồ sơ cá nhân' }]}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card
            className="catalog-card"
            style={{ textAlign: 'center', ...cardStyle }}
          >
            <Avatar
              size={80}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--card)',
                fontSize: 32,
                fontFamily: "var(--font-serif)",
                marginBottom: 'var(--sp-4)',
              }}
            >
              {profile?.fullName ? profile.fullName[0].toUpperCase() : 'U'}
            </Avatar>

            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 20,
                color: 'var(--foreground)',
                margin: '0 0 var(--sp-1)',
              }}
            >
              {profile?.fullName}
            </h3>

            <div style={{ marginBottom: 'var(--sp-3)' }}>
              <SpineTag
                variant={
                  profile?.role === 'Admin'
                    ? 'danger'
                    : profile?.role === 'Librarian'
                    ? 'primary'
                    : 'warning'
                }
              >
                {profile?.role === 'Admin'
                  ? 'Quản trị viên hệ thống'
                  : profile?.role === 'Librarian'
                  ? 'Thủ thư phục vụ'
                  : 'Bạn đọc thư viện'}
              </SpineTag>
            </div>

            <div style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
              Mã thẻ: <span style={{ fontWeight: 600, color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>#{profile?.id}</span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--sp-2)',
                marginTop: 'var(--sp-5)',
                paddingTop: 'var(--sp-4)',
                borderTop: '1px solid var(--border)',
              }}
            >
              <Button
                block
                icon={<KeyOutlined />}
                onClick={() => navigate('/change-password')}
                style={radiusStyle}
              >
                Đổi mật khẩu
              </Button>
              <Button
                block
                danger
                icon={<LogoutOutlined />}
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                style={radiusStyle}
              >
                Đăng xuất
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card className="catalog-card" style={cardStyle}>
            <h4
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 18,
                color: 'var(--foreground)',
                marginBottom: 'var(--sp-4)',
              }}
            >
              Chỉnh Sửa Thông Tin Cá Nhân
            </h4>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdate}
              style={{ maxWidth: 540 }}
            >
              <Form.Item label="Email đăng nhập">
                <Input
                  value={profile?.email}
                  disabled
                  prefix={<MailOutlined style={mutedTextStyle} />}
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius)' }}
                />
              </Form.Item>

              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input prefix={<UserOutlined style={mutedTextStyle} />} style={radiusStyle} />
              </Form.Item>

              <Form.Item label="Số điện thoại" name="phone">
                <Input prefix={<PhoneOutlined style={mutedTextStyle} />} style={radiusStyle} />
              </Form.Item>

              <Form.Item label="Địa chỉ liên hệ" name="address">
                <Input prefix={<HomeOutlined style={mutedTextStyle} />} placeholder="Số nhà, đường, quận/huyện..." style={radiusStyle} />
              </Form.Item>

              <Form.Item label="Ngày sinh" name="dateOfBirth">
                <Input prefix={<CalendarOutlined style={mutedTextStyle} />} placeholder="YYYY-MM-DD (VD: 2000-01-15)" style={radiusStyle} />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  style={primaryButtonStyle}
                >
                  Lưu thay đổi
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
