import React, { useState } from 'react'
import { Form, Input, Button, Card, Alert, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { identityApi } from '../api'
import { useAuth } from '../authStore'
import type { LoginRequest } from '../types'
import type { CurrentUser } from '@/shared/api/types'
import { BRAND } from '@/shared/constants/brand'
import { mutedTextStyle, radiusStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

const { Title, Text } = Typography

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuth()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'

  const handleSubmit = async (values: LoginRequest) => {
    try {
      setLoading(true)
      setError(null)
      const res = await identityApi.login(values)
      const currentUser: CurrentUser = res.user ?? {
        id: res.accountId,
        username: res.username,
        fullName: res.fullName,
        email: res.email,
        role: res.role as CurrentUser['role'],
      }
      setAuth(currentUser, res.accessToken, res.refreshToken)

      // Điều hướng thông minh theo vai trò
      if (from && from !== '/login' && from !== '/') {
        navigate(from, { replace: true })
      } else if (currentUser.role === 'Admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (currentUser.role === 'Librarian') {
        navigate('/admin/desk', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Đăng nhập không thành công'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: 460,
        margin: 'var(--sp-10) auto',
        padding: '0 var(--sp-4)',
      }}
    >
      <Card
        className="catalog-card"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
          <img
            src={BRAND.logoDark}
            alt={BRAND.name}
            style={{
              width: 54,
              height: 54,
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto var(--sp-3)',
            }}
          />
          <Title
            level={3}
            style={{
              fontFamily: "var(--font-serif)",
              margin: '0 0 var(--sp-1)',
              color: 'var(--foreground)',
            }}
          >
            Đăng Nhập Thư Viện
          </Title>
          <Text style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
            Cổng thông tin Bạn đọc & Cán bộ Thư viện
          </Text>
        </div>

        {error && (
          <Alert
            title={error}
            type="error"
            showIcon
            style={{ marginBottom: 'var(--sp-4)', borderRadius: 'var(--radius)' }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional">
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input
              prefix={<UserOutlined style={mutedTextStyle} />}
              placeholder="Nhập tên đăng nhập..."
              size="large"
              style={radiusStyle}
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={mutedTextStyle} />}
              placeholder="Nhập mật khẩu..."
              size="large"
              style={radiusStyle}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 'var(--sp-6)' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              style={{ background: 'var(--primary)', borderColor: 'var(--primary)', fontWeight: 600, borderRadius: 'var(--radius)' }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', fontSize: 13 }}>
          <span style={mutedTextStyle}>Chưa có thẻ thư viện? </span>
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Đăng ký thẻ ngay
          </Link>
        </div>
      </Card>
    </div>
  )
}
