import React from 'react'
import { Modal, Form, Input, InputNumber } from 'antd'
import type { AddCopiesState } from '../hooks/useAddCopies'
import { modalTitleStyle, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'

/** Modal bổ sung bản sao cho một đầu sách. */
export const AddCopiesModal: React.FC<{ addCopies: AddCopiesState }> = ({ addCopies }) => {
  const { open, book, form, submitting, close, submit } = addCopies

  return (
    <Modal
      title={<span style={modalTitleStyle}>Bổ Sung Bản Sao Vào Kệ</span>}
      open={open}
      onOk={submit}
      confirmLoading={submitting}
      onCancel={close}
      okText="Bổ sung bản sao"
      cancelText="Hủy"
      okButtonProps={{ style: primaryButtonStyle }}
      cancelButtonProps={{ style: radiusStyle }}
    >
      <div style={{ marginBottom: 'var(--sp-4)', padding: 'var(--sp-2) var(--sp-3)', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <strong>Tài liệu:</strong> {book?.title} ({book?.callNumber})
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          label="Số lượng bản sao nhập thêm"
          name="quantity"
          rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
        >
          <InputNumber min={1} max={50} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Vị trí kệ xếp sách ban đầu" name="location">
          <Input placeholder="VD: Kệ A3 - Tầng 2" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
