import React, { useState } from 'react'
import { Form, Input, Button, Card, Alert, Typography } from 'antd'
import { MailOutlined, ArrowLeftOutlined, KeyOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { identityApi } from '../api'
import type { ForgotPasswordRequest } from '../types'
import { BRAND } from '@/shared/constants/brand'
import { mutedTextStyle, radiusStyle, cardStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

const { Title, Text } = Typography

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: ForgotPasswordRequest) => {
    try {
      setLoading(true)
      setError(null)
      await identityApi.forgotPassword(values)
      setSubmittedEmail(values.email.trim())
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Không thể gửi yêu cầu đặt lại mật khẩu'))
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
            Quên Mật Khẩu
          </Title>
          <Text style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
            Nhập email tài khoản thư viện của bạn để nhận mã xác thực đặt lại mật khẩu
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

        {submittedEmail ? (
          <div style={{ textAlign: 'center' }}>
            <Alert
              icon={<CheckCircleOutlined style={{ color: '#2e7d32' }} />}
              title="Đã gửi hướng dẫn xác thực"
              description={
                <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
                  Nếu tài khoản liên kết với địa chỉ <strong>{submittedEmail}</strong> tồn tại trên hệ thống, một email chứa liên kết và mã OTP 6 chữ số đã được gửi đi. Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam/Rác). Mã có hiệu lực trong 15 phút.
                </div>
              }
              type="success"
              showIcon
              style={{ marginBottom: 'var(--sp-6)', textAlign: 'left', borderRadius: 'var(--radius)' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <Button
                type="primary"
                size="large"
                icon={<KeyOutlined />}
                block
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(submittedEmail)}`)}
                style={{
                  background: 'var(--primary)',
                  borderColor: 'var(--primary)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius)',
                }}
              >
                Nhập mã OTP để đặt lại mật khẩu
              </Button>

              <Button
                block
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={() => setSubmittedEmail(null)}
                style={radiusStyle}
              >
                Gửi lại yêu cầu với email khác
              </Button>
            </div>
          </div>
        ) : (
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
                Gửi hướng dẫn đặt lại mật khẩu
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', fontSize: 13, marginTop: 'var(--sp-4)' }}>
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                <ArrowLeftOutlined style={{ marginRight: 6 }} /> Quay lại đăng nhập
              </Link>
            </div>
          </Form>
        )}
      </Card>
    </div>
  )
}

