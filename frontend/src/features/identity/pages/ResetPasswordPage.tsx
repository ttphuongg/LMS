import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Alert, Typography, Result } from 'antd'
import { MailOutlined, LockOutlined, KeyOutlined, LoginOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { identityApi } from '../api'
import type { ResetPasswordRequest } from '../types'
import { BRAND } from '@/shared/constants/brand'
import { mutedTextStyle, radiusStyle, cardStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

const { Title, Text } = Typography

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const emailParam = searchParams.get('email') || ''
    // Chỉ tự động điền mã OTP gồm 6 chữ số, tuyệt đối không hiển thị mã token dài
    const candidate = searchParams.get('otp') || searchParams.get('code') || searchParams.get('token') || ''
    const otpParam = /^\d{6}$/.test(candidate.trim()) ? candidate.trim() : ''

    form.setFieldsValue({
      email: emailParam,
      tokenOrOtp: otpParam,
    })
  }, [searchParams, form])

  const handleSubmit = async (values: ResetPasswordRequest) => {
    try {
      setLoading(true)
      setError(null)
      await identityApi.resetPassword({
        email: values.email.trim(),
        tokenOrOtp: values.tokenOrOtp.trim(),
        newPassword: values.newPassword,
      })
      setSuccess(true)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại mã xác thực.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: 'var(--sp-10) auto',
        padding: '0 var(--sp-4)',
      }}
    >
      <Card className="catalog-card" style={cardStyle}>
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
              fontFamily: 'var(--font-serif)',
              margin: '0 0 var(--sp-1)',
              color: 'var(--foreground)',
            }}
          >
            Đặt Lại Mật Khẩu
          </Title>
          <Text style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
            Nhập mã xác thực nhận được qua email và thiết lập mật khẩu mới
          </Text>
        </div>

        {success ? (
          <Result
            status="success"
            title="Đặt lại mật khẩu thành công!"
            subTitle="Mật khẩu của bạn đã được cập nhật an toàn. Toàn bộ các phiên đăng nhập cũ đã được đăng xuất. Vui lòng đăng nhập lại bằng mật khẩu mới."
            extra={[
              <Button
                type="primary"
                key="login"
                size="large"
                icon={<LoginOutlined />}
                block
                onClick={() => navigate('/login')}
                style={{
                  background: 'var(--primary)',
                  borderColor: 'var(--primary)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius)',
                }}
              >
                Đăng nhập ngay
              </Button>,
            ]}
          />
        ) : (
          <>
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
                label="Địa chỉ Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập địa chỉ email' },
                  { type: 'email', message: 'Địa chỉ email không hợp lệ' },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={mutedTextStyle} />}
                  placeholder="example@library.vn"
                  size="large"
                  style={radiusStyle}
                />
              </Form.Item>

              <Form.Item
                label="Mã xác thực OTP"
                name="tokenOrOtp"
                extra="Mã OTP gồm 6 chữ số được gửi tới hộp thư của bạn."
                rules={[
                  { required: true, message: 'Vui lòng nhập mã OTP xác thực' },
                  { pattern: /^\d{6}$/, message: 'Mã OTP phải gồm đúng 6 chữ số' },
                ]}
              >
                <Input
                  prefix={<KeyOutlined style={mutedTextStyle} />}
                  placeholder="Nhập mã OTP 6 số (ví dụ: 123456)..."
                  maxLength={6}
                  size="large"
                  style={radiusStyle}
                />
              </Form.Item>

              <Form.Item
                label="Mật khẩu mới"
                name="newPassword"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                  { min: 6, message: 'Mật khẩu phải có tối thiểu 6 ký tự' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={mutedTextStyle} />}
                  placeholder="Tối thiểu 6 ký tự..."
                  size="large"
                  style={radiusStyle}
                />
              </Form.Item>

              <Form.Item
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'))
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={mutedTextStyle} />}
                  placeholder="Nhập lại mật khẩu mới..."
                  size="large"
                  style={radiusStyle}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 'var(--sp-6)', marginBottom: 'var(--sp-4)' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  style={{
                    background: 'var(--primary)',
                    borderColor: 'var(--primary)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius)',
                  }}
                >
                  Xác nhận đặt lại mật khẩu
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center', fontSize: 13, marginTop: 'var(--sp-4)' }}>
                <Link to="/forgot-password" style={{ color: 'var(--muted-foreground)' }}>
                  Chưa nhận được mã? Gửi lại yêu cầu
                </Link>
                <span style={{ margin: '0 8px', color: 'var(--border)' }}>|</span>
                <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  Đăng nhập
                </Link>
              </div>
            </Form>
          </>
        )}
      </Card>
    </div>
  )
}

