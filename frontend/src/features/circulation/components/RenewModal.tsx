import React, { useState } from 'react'
import { Modal, Form, Input, DatePicker, Alert } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import dayjs from 'dayjs'
import { circulationApi } from '../api'
import type { LoanDetailDto } from '../types'
import { LIBRARY_RULES } from '@/shared/constants/rules'
import { formatDate, getErrorMessage } from '@/shared/utils/format'
import { modalTitleStyle, mutedText12Style, radiusStyle, strongTextStyle } from '@/shared/styles/ui'

interface RenewModalProps {
  open: boolean
  loanDetail: LoanDetailDto | null
  onClose: () => void
  onSuccess: () => void
}

export const RenewModal: React.FC<RenewModalProps> = ({
  open,
  loanDetail,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  if (!loanDetail) return null

  // Ngày gia hạn dự kiến: mặc định hiện tại + 7 ngày
  const defaultNewDate = dayjs(loanDetail.dueDate).add(LIBRARY_RULES.renewalExtensionDays, 'day')

  const handleFinish = async (values: { newDueDate: dayjs.Dayjs; reason: string }) => {
    try {
      setLoading(true)
      await circulationApi.requestRenewal(loanDetail.id, {
        newDueDate: values.newDueDate.format('YYYY-MM-DD'),
        reason: values.reason,
      })
      message.success('Đã gửi yêu cầu gia hạn tới thủ thư thành công!')
      form.resetFields()
      onSuccess()
      onClose()
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi gửi yêu cầu gia hạn'))
    } finally {
      setLoading(false)
    }
  }

  const reachedMaxRenew = loanDetail.renewalCount >= LIBRARY_RULES.maxRenewTimes

  return (
    <Modal
      title={
        <span style={modalTitleStyle}>
          Đề Nghị Gia Hạn Mượn Sách
        </span>
      }
      open={open}
      onOk={() => form.submit()}
      confirmLoading={loading}
      onCancel={onClose}
      okText="Gửi yêu cầu gia hạn"
      cancelText="Đóng"
      okButtonProps={{
        disabled: reachedMaxRenew,
        style: { background: 'var(--primary)', borderColor: 'var(--primary)', borderRadius: 'var(--radius)' },
      }}
      cancelButtonProps={{ style: radiusStyle }}
    >
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <div style={{ padding: 'var(--sp-2) var(--sp-3)', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 'var(--sp-3)' }}>
          <div style={strongTextStyle}>{loanDetail.bookTitle}</div>
          <div style={mutedText12Style}>
            Hạn trả hiện tại: <strong>{formatDate(loanDetail.dueDate)}</strong> • Đã gia hạn: {loanDetail.renewalCount}/{LIBRARY_RULES.maxRenewTimes} lần
          </div>
        </div>

        {reachedMaxRenew && (
          <Alert
            title={`Tài liệu đã đạt giới hạn tối đa ${LIBRARY_RULES.maxRenewTimes} lần gia hạn theo quy định. Vui lòng mang sách tới quầy để hoàn trả.`}
            type="warning"
            showIcon
            style={{ marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius)' }}
          />
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          newDueDate: defaultNewDate,
          reason: 'Cần thêm thời gian nghiên cứu và tham khảo tài liệu.',
        }}
      >
        <Form.Item
          label="Ngày hẹn trả mới dự kiến"
          name="newDueDate"
          rules={[{ required: true, message: 'Vui lòng chọn ngày trả mới' }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: '100%' }}
            disabledDate={(current) =>
              current && (current < dayjs(loanDetail.dueDate) || current > dayjs(loanDetail.dueDate).add(14, 'day'))
            }
          />
        </Form.Item>

        <Form.Item
          label="Lý do xin gia hạn"
          name="reason"
          rules={[{ required: true, message: 'Vui lòng nhập lý do gia hạn' }]}
        >
          <Input.TextArea rows={3} placeholder="VD: Đang làm bài tập lớn, luận văn..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}
