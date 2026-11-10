import React, { useState } from 'react'
import { Card, Form, Input, Button, Alert } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { LockOutlined } from '@ant-design/icons'
import { identityApi } from '../api'
import { PageHeader } from '@/shared/components/PageHeader'
import type { ChangePasswordRequest } from '../types'
import { cardStyle, mutedTextStyle, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

export const ChangePasswordPage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: ChangePasswordRequest) => {
    try {
      setLoading(true)
      setError(null)
      await identityApi.changePassword(values)
      message.success('Đổi mật khẩu thành công! Mật khẩu mới có hiệu lực ngay.')
      form.resetFields()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Đổi mật khẩu thất bại'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Đổi Mật Khẩu"
        subtitle="Cập nhật mật khẩu bảo mật định kỳ để bảo vệ tài khoản thẻ thư viện"
        breadcrumbs={[
          { title: 'Trang chủ', href: '/' },
          { title: 'Hồ sơ', href: '/profile' },
          { title: 'Đổi mật khẩu' },
        ]}
      />

      <div style={{ maxWidth: 480 }}>
        <Card className="catalog-card" style={cardStyle}>
          {error && (
            <Alert
              title={error}
              type="error"
              showIcon
              style={{ marginBottom: 'var(--sp-4)', borderRadius: 'var(--radius)' }}
            />
          )}

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Mật khẩu hiện tại"
              name="currentPassword"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
            >
              <Input.Password prefix={<LockOutlined style={mutedTextStyle} />} style={radiusStyle} />
            </Form.Item>

            <Form.Item
              label="Mật khẩu mới"
              name="newPassword"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                { min: 6, message: 'Mật khẩu phải từ 6 ký tự' },
              ]}
            >
              <Input.Password prefix={<LockOutlined style={mutedTextStyle} />} style={radiusStyle} />
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
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined style={mutedTextStyle} />} style={radiusStyle} />
            </Form.Item>

            <Form.Item style={{ marginTop: 'var(--sp-5)' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={primaryButtonStyle}
              >
                Cập nhật mật khẩu
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  )
}
