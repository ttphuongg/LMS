import React, { useState } from 'react'
import { Form, Input, Button, Card, Alert, Typography } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { identityApi } from '../api'
import type { RegisterRequest } from '../types'
import { mutedTextStyle, radiusStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

const { Title, Text } = Typography

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: RegisterRequest) => {
    try {
      setLoading(true)
      setError(null)
      await identityApi.register(values)
      message.success('Đăng ký thẻ thư viện thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Đăng ký không thành công'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: 500,
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
          <div
            style={{
              width: 44,
              height: 44,
              background: 'var(--primary)',
              borderRadius: 'var(--radius)',
              margin: '0 auto var(--sp-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--card)',
              border: '1px solid var(--border-strong)',
            }}
          >
            <IdcardOutlined style={{ fontSize: 22 }} />
          </div>
          <Title
            level={3}
            style={{
              fontFamily: "var(--font-serif)",
              margin: '0 0 var(--sp-1)',
              color: 'var(--foreground)',
            }}
          >
            Đăng Ký Thẻ Thư Viện
          </Title>
          <Text style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
            Cấp thẻ Bạn đọc trực tuyến và kích hoạt quyền mượn sách tức thì
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
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập' },
              { min: 3, message: 'Tên đăng nhập phải từ 3 ký tự' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={mutedTextStyle} />}
              placeholder="nguyenvana"
              size="large"
              style={radiusStyle}
            />
          </Form.Item>

          <Form.Item
            label="Họ và tên bạn đọc"
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input
              prefix={<UserOutlined style={mutedTextStyle} />}
              placeholder="Nguyễn Văn A"
              size="large"
              style={radiusStyle}
            />
          </Form.Item>

          <Form.Item
            label="Địa chỉ email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không đúng định dạng' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={mutedTextStyle} />}
              placeholder="example@library.edu.vn"
              size="large"
              style={radiusStyle}
            />
          </Form.Item>

          <Form.Item
            label="Số điện thoại liên hệ"
            name="phone"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input
              prefix={<PhoneOutlined style={mutedTextStyle} />}
              placeholder="0912345678"
              size="large"
              style={radiusStyle}
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu tạo mới"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu phải từ 6 ký tự' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={mutedTextStyle} />}
              placeholder="Tối thiểu 6 ký tự..."
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
              Hoàn tất đăng ký thẻ
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', fontSize: 13 }}>
          <span style={mutedTextStyle}>Đã có tài khoản thẻ? </span>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Đăng nhập ngay
          </Link>
        </div>
      </Card>
    </div>
  )
}
