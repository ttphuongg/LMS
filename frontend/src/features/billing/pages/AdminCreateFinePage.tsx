import React, { useState } from 'react'
import { Card, Form, Input, Button, Select, InputNumber, DatePicker, Space, Alert } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { useNavigate } from 'react-router-dom'
import { billingApi } from '../api'
import type dayjs from 'dayjs'
import type { FineType } from '../types'
import { PageHeader } from '@/shared/components/PageHeader'
import { cardStyle, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

interface FineFormValues {
  accountId: string
  reason: FineType
  amount: number
  paymentDueDate?: dayjs.Dayjs
}

export const AdminCreateFinePage: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm<FineFormValues>()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: FineFormValues) => {
    try {
      setLoading(true)
      await billingApi.createFine({
        accountId: values.accountId,
        fineType: values.reason,
        reason: String(values.reason),
        amount: values.amount,
        paymentDueDate: values.paymentDueDate ? values.paymentDueDate.format('YYYY-MM-DD') : undefined,
      })
      message.success('Đã lập phiếu phạt thành công!')
      navigate('/admin/fines')
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi lập phiếu phạt'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Lập Phiếu Phạt Mới"
        subtitle="Ghi nhận khoản phí phạt vi phạm quy chế hoặc bồi hoàn hư hại sách"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Phiếu phạt', href: '/admin/fines' },
          { title: 'Lập phiếu mới' },
        ]}
      />

      <Card className="catalog-card" style={{ ...cardStyle, maxWidth: 640 }}>
        <Alert
          type="info"
          showIcon
          title="Hệ thống lưu trữ phân loại phạt (Quá hạn / Bồi thường / Khác), số tiền và hạn thanh toán theo cấu trúc phiếu phạt hiện hành."
          style={{ marginBottom: 'var(--sp-4)', borderRadius: 'var(--radius)' }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Mã số thẻ bạn đọc (ID tài khoản)"
            name="accountId"
            rules={[{ required: true, message: 'Vui lòng nhập ID bạn đọc' }]}
            extra="Nhập ID số nguyên của bạn đọc (ví dụ: 1, 2, 3...)"
          >
            <Input placeholder="VD: 1" style={radiusStyle} />
          </Form.Item>

          <Form.Item
            label="Loại xử phạt"
            name="reason"
            rules={[{ required: true, message: 'Vui lòng chọn loại xử phạt' }]}
            initialValue="Overdue"
          >
            <Select
              options={[
                { label: 'Trả sách trễ hạn (Overdue)', value: 'Overdue' },
                { label: 'Làm hỏng / Mất sách (Compensation)', value: 'Compensation' },
                { label: 'Phí hành chính khác (Other)', value: 'Other' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Hạn thanh toán phạt (Tùy chọn)"
            name="paymentDueDate"
          >
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="Chọn ngày hạn thanh toán"
              style={{ width: '100%', borderRadius: 'var(--radius)' }}
            />
          </Form.Item>

          <Form.Item
            label="Số tiền phạt (VNĐ)"
            name="amount"
            rules={[{ required: true, message: 'Vui lòng nhập số tiền phạt' }]}
            initialValue={15000}
          >
            <InputNumber
              min={1000}
              step={5000}
              style={{ width: '100%', borderRadius: 'var(--radius)' }}
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 'var(--sp-6)' }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} style={primaryButtonStyle}>
                Xác nhận lập phiếu phạt
              </Button>
              <Button onClick={() => navigate('/admin/fines')} style={radiusStyle}>Hủy bỏ</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
