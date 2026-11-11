import React from 'react'
import { Modal, Form, InputNumber, Select, Alert, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { AddCopiesState } from '../hooks/useAddCopies'
import { modalTitleStyle, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'

const CONDITION_OPTIONS = [
  { label: 'Tốt (Good)', value: 'Good' },
  { label: 'Hư nhẹ (MinorDamage)', value: 'MinorDamage' },
  { label: 'Hư nặng (MajorDamage)', value: 'MajorDamage' },
]

/** Modal bổ sung bản sao cho một đầu sách (chọn vị trí thực tế từ /api/catalog/locations). */
export const AddCopiesModal: React.FC<{ addCopies: AddCopiesState }> = ({ addCopies }) => {
  const {
    open,
    book,
    form,
    submitting,
    locations,
    locationsLoading,
    locationsError,
    reloadLocations,
    close,
    submit,
  } = addCopies

  const locationOptions = locations.map((loc) => {
    const current = loc.currentCount ?? 0
    const isFull = loc.maxCapacity != null && current >= loc.maxCapacity
    const capacityText = loc.maxCapacity != null ? `${current}/${loc.maxCapacity} cuốn` : `${current} cuốn`
    return {
      value: loc.id,
      disabled: isFull,
      label: `${loc.aisle} - ${loc.shelf} - Tầng ${loc.rowLevel} (${capacityText}${isFull ? ' - Đã đầy' : ''})`,
    }
  })

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
      <div
        style={{
          marginBottom: 'var(--sp-4)',
          padding: 'var(--sp-2) var(--sp-3)',
          background: 'var(--muted)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <strong>Tài liệu:</strong> {book?.title}
        {book?.isbn ? ` (ISBN: ${book.isbn})` : ''}
      </div>

      {locationsError && (
        <Alert
          type="warning"
          showIcon
          title={locationsError}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={reloadLocations}>
              Thử lại
            </Button>
          }
          style={{ marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius)' }}
        />
      )}

      {!locationsLoading && !locationsError && locations.length === 0 && (
        <Alert
          type="info"
          showIcon
          title="Chưa có vị trí kệ nào đang hoạt động. Bạn có thể để trống để lưu trạng thái 'Chưa xếp kệ' hoặc tạo kệ tại mục Vị trí kệ sách."
          style={{ marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius)' }}
        />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          label="Số lượng bản sao nhập thêm"
          name="quantity"
          rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
        >
          <InputNumber min={1} max={50} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Tình trạng ban đầu"
          name="condition"
          initialValue="Good"
        >
          <Select options={CONDITION_OPTIONS} />
        </Form.Item>

        <Form.Item
          label="Vị trí kệ xếp sách"
          name="locationId"
          extra="Chọn từ danh sách vị trí kệ đang hoạt động trong kho; để trống nếu chưa xếp kệ."
        >
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            loading={locationsLoading}
            placeholder="Chọn kệ sách thực tế trong DB (hoặc để trống)..."
            options={locationOptions}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
