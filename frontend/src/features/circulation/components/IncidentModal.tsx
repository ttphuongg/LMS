import React, { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Select, Alert, Typography } from 'antd'
import type { IncidentReportState } from '../hooks/useIncidentReport'
import { radiusStyle } from '@/shared/styles/ui'
import { calculateIncidentCompensation } from '@/features/billing/utils/fineCalculation'

const { Text } = Typography

const INCIDENT_TYPE_OPTIONS = [
  { label: 'Hư hỏng / Rách / Bẩn sách (Damaged)', value: 'Damaged' },
  { label: 'Làm mất sách (Lost - Bồi thường 150%)', value: 'Lost' },
]

const SEVERITY_OPTIONS = [
  { label: 'Nhẹ - Có thể phục hồi (Minor - 30% giá sách)', value: 'Minor' },
  { label: 'Nặng - Biến dạng, rách chữ, ngấm nước (Major - 100% giá sách)', value: 'Major' },
  { label: 'Mất hoàn toàn / Không thể phục hồi (TotalLoss - 100% giá sách)', value: 'TotalLoss' },
]

/** Modal lập biên bản sự cố tài liệu (hỏng / mất) khi thu hồi sách. */
export const IncidentModal: React.FC<{ incident: IncidentReportState }> = ({ incident }) => {
  const { open, detail, form, submitting, close, submit } = incident

  // Theo dõi loại sự cố và mức độ để tự động tính tiền phạt theo quy chế
  const watchedType = Form.useWatch('incidentType', form) || 'Damaged'
  const watchedSeverity = Form.useWatch('severity', form) || 'Minor'

  // Tính toán số tiền bồi hoàn theo Điều 8 Quy chế
  const calc = calculateIncidentCompensation(watchedType, watchedSeverity, detail?.bookValue)

  // Tự động cập nhật số tiền vào form khi thay đổi loại sự cố hoặc mức độ
  useEffect(() => {
    if (open && detail) {
      const newCalc = calculateIncidentCompensation(watchedType, watchedSeverity, detail.bookValue)
      form.setFieldValue('compensationAmount', newCalc.amount)
    }
  }, [watchedType, watchedSeverity, detail, open, form])

  return (
    <Modal
      title={
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--destructive)' }}>
          Biên Bản Sự Cố Tài Liệu (Căn cứ Điều 8 Quy chế Thư viện)
        </span>
      }
      open={open}
      onOk={submit}
      confirmLoading={submitting}
      onCancel={close}
      okText="Lập biên bản & Xuất phiếu phạt"
      cancelText="Đóng"
      okButtonProps={{ danger: true, style: radiusStyle }}
      cancelButtonProps={{ style: radiusStyle }}
      width={560}
    >
      <div
        style={{
          marginBottom: 'var(--sp-4)',
          padding: 'var(--sp-3)',
          background: 'var(--muted)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          fontSize: 13,
        }}
      >
        <div>
          <strong>Tài liệu:</strong> {detail?.bookTitle} ({detail?.barcode})
        </div>
        <div style={{ marginTop: 4 }}>
          <strong>Giá bìa tài liệu:</strong>{' '}
          <Text strong style={{ color: 'var(--primary)' }}>
            {detail?.bookValue != null && detail.bookValue > 0
              ? `${detail.bookValue.toLocaleString('vi-VN')} VNĐ`
              : '100,000 VNĐ (Ước tính theo khung quy định)'}
          </Text>
        </div>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          label="Loại sự cố"
          name="incidentType"
          rules={[{ required: true, message: 'Chọn loại sự cố' }]}
        >
          <Select options={INCIDENT_TYPE_OPTIONS} />
        </Form.Item>

        {watchedType === 'Damaged' && (
          <Form.Item
            label="Mức độ nghiêm trọng"
            name="severity"
            rules={[{ required: true, message: 'Chọn mức độ' }]}
          >
            <Select options={SEVERITY_OPTIONS} />
          </Form.Item>
        )}

        <Form.Item
          label="Mô tả chi tiết tình trạng hư hại"
          name="description"
          rules={[{ required: true, message: 'Nhập mô tả tình trạng' }]}
        >
          <Input.TextArea
            rows={2}
            placeholder={
              watchedType === 'Lost'
                ? 'Độc giả báo mất sách trong quá trình lưu thông...'
                : 'Ghi nhận hiện trạng cuốn sách khi thu nhận...'
            }
          />
        </Form.Item>

        <Form.Item
          label="Số tiền bồi thường quy định (VNĐ)"
          name="compensationAmount"
          rules={[{ required: true, message: 'Nhập số tiền bồi thường' }]}
          extra={
            <div style={{ marginTop: 6 }}>
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
                    <div style={{ fontWeight: 600, color: '#1A382B', fontSize: 13 }}>
                      Quy chuẩn tính phạt: {calc.ruleName}
                    </div>
                    <div style={{ fontSize: 12, color: '#3E5C4E', marginTop: 2 }}>
                      {calc.formula}
                    </div>
                  </div>
                }
              />
            </div>
          }
        >
          <InputNumber
            min={0}
            step={5000}
            style={{ width: '100%', fontSize: 16, fontWeight: 700 }}
            formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
