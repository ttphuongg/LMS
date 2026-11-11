import React from 'react'
import { Modal, Form, Input, InputNumber, Select } from 'antd'
import type { IncidentReportState } from '../hooks/useIncidentReport'
import { radiusStyle } from '@/shared/styles/ui'

const INCIDENT_TYPE_OPTIONS = [
  { label: 'Hư hỏng / Rách bìa (Damaged)', value: 'Damaged' },
  { label: 'Làm mất sách (Lost)', value: 'Lost' },
]

const SEVERITY_OPTIONS = [
  { label: 'Nhẹ - Có thể khắc phục (Minor)', value: 'Minor' },
  { label: 'Nặng - Hư hỏng đáng kể (Major)', value: 'Major' },
  { label: 'Mất hoàn toàn / Không thể phục hồi (TotalLoss)', value: 'TotalLoss' },
]

/** Modal lập biên bản sự cố tài liệu (hỏng / mất) khi thu hồi sách. */
export const IncidentModal: React.FC<{ incident: IncidentReportState }> = ({ incident }) => {
  const { open, detail, form, submitting, close, submit } = incident

  return (
    <Modal
      title={
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--destructive)' }}>
          Biên Bản Sự Cố Tài Liệu
        </span>
      }
      open={open}
      onOk={submit}
      confirmLoading={submitting}
      onCancel={close}
      okText="Lập biên bản & Tính phạt"
      cancelText="Đóng"
      okButtonProps={{ danger: true, style: radiusStyle }}
      cancelButtonProps={{ style: radiusStyle }}
    >
      <div style={{ marginBottom: 'var(--sp-4)', padding: 'var(--sp-2) var(--sp-3)', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <strong>Tài liệu:</strong> {detail?.bookTitle} ({detail?.barcode})
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          label="Loại sự cố"
          name="incidentType"
          rules={[{ required: true, message: 'Chọn loại sự cố' }]}
        >
          <Select options={INCIDENT_TYPE_OPTIONS} />
        </Form.Item>

        <Form.Item
          label="Mức độ nghiêm trọng"
          name="severity"
          rules={[{ required: true, message: 'Chọn mức độ' }]}
        >
          <Select options={SEVERITY_OPTIONS} />
        </Form.Item>

        <Form.Item
          label="Mô tả chi tiết tình trạng hư hại"
          name="description"
          rules={[{ required: true, message: 'Nhập mô tả tình trạng' }]}
        >
          <Input.TextArea rows={3} placeholder="Ghi nhận hiện trạng cuốn sách khi thu nhận..." />
        </Form.Item>

        <Form.Item
          label="Số tiền bồi thường quy định (VNĐ)"
          name="compensationAmount"
          rules={[{ required: true, message: 'Nhập số tiền bồi thường' }]}
        >
          <InputNumber
            min={0}
            step={10000}
            style={{ width: '100%' }}
            formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
