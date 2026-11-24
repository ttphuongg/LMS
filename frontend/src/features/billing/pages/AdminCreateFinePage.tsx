import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Select, InputNumber, DatePicker, Space, Alert, Typography, Divider, Radio } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { CalculatorOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { billingApi } from '../api'
import type dayjs from 'dayjs'
import type { FineType } from '../types'
import { PageHeader } from '@/shared/components/PageHeader'
import { cardStyle, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'
import {
  calculateOverdueFine,
  calculateIncidentCompensation,
  LIBRARY_FINE_RULES,
} from '../utils/fineCalculation'

const { Text } = Typography

interface FineFormValues {
  accountId: string
  reason: FineType
  amount: number
  paymentDueDate?: dayjs.Dayjs
  // Trường hỗ trợ tính toán theo quy chế
  bookValue?: number
  daysOverdue?: number
  incidentSubtype?: 'Lost' | 'DamagedMinor' | 'DamagedMajor'
}

export const AdminCreateFinePage: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm<FineFormValues>()
  const [loading, setLoading] = useState(false)

  // Theo dõi loại xử phạt và các tham số tính toán
  const watchedReason = Form.useWatch('reason', form) || 'Overdue'
  const watchedBookValue = Form.useWatch('bookValue', form) ?? 100000
  const watchedDaysOverdue = Form.useWatch('daysOverdue', form) ?? 1
  const watchedIncidentSubtype = Form.useWatch('incidentSubtype', form) || 'DamagedMinor'

  // Tự động tính toán số tiền phạt theo Quy chế Domus Libri
  useEffect(() => {
    if (watchedReason === 'Overdue') {
      const res = calculateOverdueFine(watchedDaysOverdue, watchedBookValue)
      form.setFieldValue('amount', res.amount)
    } else if (watchedReason === 'Compensation') {
      let calc
      if (watchedIncidentSubtype === 'Lost') {
        calc = calculateIncidentCompensation('Lost', 'TotalLoss', watchedBookValue)
      } else if (watchedIncidentSubtype === 'DamagedMinor') {
        calc = calculateIncidentCompensation('Damaged', 'Minor', watchedBookValue)
      } else {
        calc = calculateIncidentCompensation('Damaged', 'Major', watchedBookValue)
      }
      form.setFieldValue('amount', calc.amount)
    }
  }, [watchedReason, watchedBookValue, watchedDaysOverdue, watchedIncidentSubtype, form])

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
      message.success('Đã lập phiếu phạt thành công theo quy chế!')
      navigate('/admin/fines')
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi lập phiếu phạt'))
    } finally {
      setLoading(false)
    }
  }

  // Kết quả diễn giải công thức
  const overdueCalc = calculateOverdueFine(watchedDaysOverdue, watchedBookValue)
  let incidentCalc
  if (watchedIncidentSubtype === 'Lost') {
    incidentCalc = calculateIncidentCompensation('Lost', 'TotalLoss', watchedBookValue)
  } else if (watchedIncidentSubtype === 'DamagedMinor') {
    incidentCalc = calculateIncidentCompensation('Damaged', 'Minor', watchedBookValue)
  } else {
    incidentCalc = calculateIncidentCompensation('Damaged', 'Major', watchedBookValue)
  }

  return (
    <div>
      <PageHeader
        title="Lập Phiếu Phạt & Bồi Thường Mới"
        subtitle="Hệ thống tự động tính toán tiền phạt căn cứ theo Điều 7 & Điều 8 Quy chế Thư viện Domus Libri"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Phiếu phạt', href: '/admin/fines' },
          { title: 'Lập phiếu mới' },
        ]}
      />

      <Card className="catalog-card" style={{ ...cardStyle, maxWidth: 680 }}>
        <Alert
          type="info"
          showIcon
          title="Quy chế phạt Thư viện Domus Libri (Chương III)"
          description={
            <div style={{ fontSize: 13, marginTop: 4 }}>
              • <strong>Quá hạn (Điều 7):</strong> 5.000 VNĐ / ngày trễ. Tối đa không vượt quá 150% giá trị cuốn sách.<br />
              • <strong>Làm mất sách (Điều 8):</strong> Bồi thường 150% giá trị sách.<br />
              • <strong>Hư hỏng sách (Điều 8):</strong> Nhẹ bồi thường 30%, nặng bồi thường 100% giá trị sách.
            </div>
          }
          style={{ marginBottom: 'var(--sp-5)', borderRadius: 'var(--radius)' }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            reason: 'Overdue',
            bookValue: 100000,
            daysOverdue: 1,
            incidentSubtype: 'DamagedMinor',
            amount: 5000,
          }}
        >
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
          >
            <Select
              options={[
                { label: 'Trả sách trễ hạn (Overdue - 5.000đ/ngày, max 150% giá sách)', value: 'Overdue' },
                { label: 'Làm hỏng / Mất sách (Compensation - 30% / 100% / 150%)', value: 'Compensation' },
                { label: 'Phí hành chính khác (Other)', value: 'Other' },
              ]}
            />
          </Form.Item>

          {/* KHỐI TÍNH TOÁN THEO QUY CHẾ CHO QUÁ HẠN HOẶC BỒI HOÀN */}
          {watchedReason !== 'Other' && (
            <div
              style={{
                background: 'var(--muted)',
                padding: 'var(--sp-4)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                marginBottom: 'var(--sp-4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--sp-3)' }}>
                <CalculatorOutlined style={{ color: 'var(--primary)', fontSize: 16 }} />
                <Text strong style={{ color: 'var(--foreground)' }}>
                  Tính tiền phạt tự động theo Quy chế:
                </Text>
              </div>

              <Form.Item
                label="Giá bìa của cuốn sách (VNĐ)"
                name="bookValue"
                extra="Căn cứ tính trần quá hạn (150%) và tỷ lệ bồi thường hỏng/mất"
              >
                <InputNumber
                  min={1000}
                  step={10000}
                  style={{ width: '100%', borderRadius: 'var(--radius)' }}
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>

              {watchedReason === 'Overdue' && (
                <>
                  <Form.Item
                    label="Số ngày trễ hạn"
                    name="daysOverdue"
                  >
                    <InputNumber
                      min={1}
                      max={365}
                      style={{ width: '100%', borderRadius: 'var(--radius)' }}
                    />
                  </Form.Item>
                  <Alert
                    type={overdueCalc.isCapped ? 'warning' : 'success'}
                    showIcon
                    style={{
                      backgroundColor: overdueCalc.isCapped ? '#FCF8EE' : '#F3F9F5',
                      border: overdueCalc.isCapped ? '1px solid #EEDCB8' : '1px solid #C2DFCF',
                      borderRadius: 'var(--radius)',
                    }}
                    message={
                      <div>
                        <strong style={{ color: overdueCalc.isCapped ? '#8B6A20' : '#1A382B' }}>
                          Diễn giải công thức: </strong>
                        <span style={{ color: overdueCalc.isCapped ? '#705315' : '#2D4B3C' }}>
                          {overdueCalc.formula}
                        </span>
                        {overdueCalc.isCapped && (
                          <div style={{ fontSize: 12, marginTop: 2, color: 'var(--destructive)' }}>
                            * Đã áp dụng trần phạt tối đa 150% giá trị sách ({overdueCalc.capAmount?.toLocaleString('vi-VN')}đ) theo Điều 7.
                          </div>
                        )}
                      </div>
                    }
                  />
                </>
              )}

              {watchedReason === 'Compensation' && (
                <>
                  <Form.Item
                    label="Mức độ hư hại / Mất mát"
                    name="incidentSubtype"
                  >
                    <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Radio value="DamagedMinor">
                        <strong>Hư hỏng nhẹ:</strong> Bồi thường 30% giá sách (xước bìa, gập góc, vết bẩn nhỏ)
                      </Radio>
                      <Radio value="DamagedMajor">
                        <strong>Hư hỏng nặng:</strong> Bồi thường 100% giá sách (rách chữ, ngấm nước mốc biến dạng)
                      </Radio>
                      <Radio value="Lost">
                        <strong>Làm mất sách:</strong> Bồi thường 150% giá sách (không tính thêm phí quá hạn)
                      </Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Alert
                    type="info"
                    showIcon
                    style={{
                      backgroundColor: '#F3F9F5',
                      border: '1px solid #C2DFCF',
                      borderRadius: 'var(--radius)',
                    }}
                    message={
                      <div>
                        <strong style={{ color: '#1A382B' }}>Công thức: </strong>
                        <span style={{ color: '#2D4B3C' }}>{incidentCalc.formula}</span>
                      </div>
                    }
                  />
                </>
              )}
            </div>
          )}

          <Form.Item
            label="Số tiền phạt áp dụng (VNĐ)"
            name="amount"
            rules={[{ required: true, message: 'Vui lòng nhập số tiền phạt' }]}
            extra="Số tiền được tự động tính theo công thức ở trên; thủ thư có thể điều chỉnh thủ công nếu cần."
          >
            <InputNumber
              min={1000}
              step={5000}
              style={{ width: '100%', borderRadius: 'var(--radius)', fontSize: 16, fontWeight: 700 }}
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
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

          <Divider style={{ margin: 'var(--sp-4) 0' }} />

          <Form.Item style={{ marginBottom: 0 }}>
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
