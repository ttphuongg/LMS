import React, { useEffect, useState } from 'react'
import { Modal, Radio, Button, Space, Alert, Input } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { QrcodeOutlined, DollarOutlined, BankOutlined, WalletOutlined } from '@ant-design/icons'
import { billingApi } from '../api'
import type { FineDto, PaymentMethod } from '../types'
import { FineStatusTag } from './FineStatusTag'
import { isFinePayable } from '../utils/fineStatus'
import { useAuth } from '@/features/identity'
import { formatCurrency, getErrorMessage } from '@/shared/utils/format'
import { modalTitleStyle, mutedText12Style, mutedText13Style, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'

interface FinePaymentModalProps {
  open: boolean
  fine: FineDto | null
  onClose: () => void
  onSuccess: () => void
}

export const FinePaymentModal: React.FC<FinePaymentModalProps> = ({
  open,
  fine,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth()
  const isStaff = user?.role === 'Admin' || user?.role === 'Librarian'

  const [method, setMethod] = useState<PaymentMethod>('Cash')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (open && fine) {
      setMethod('Cash')
      setNotes('')
      setSubmitError(null)
    }
  }, [open, fine])

  if (!fine) return null

  const payable = isFinePayable(fine)
  const settlementAmount = Math.max(0, fine.amount)
  const canSubmit = isStaff && payable && !loading && settlementAmount > 0

  const handlePay = async () => {
    if (!canSubmit) return
    try {
      setLoading(true)
      setSubmitError(null)
      await billingApi.payFine(fine.id, {
        paymentMethod: method,
        notes: notes.trim() || undefined,
      })
      message.success(
        `Đã ghi nhận thanh toán đủ ${formatCurrency(settlementAmount)} cho phiếu ${fine.fineNumber}!`
      )
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const errMsg = getErrorMessage(err, 'Thanh toán thất bại')
      setSubmitError(errMsg)
      message.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  // Giao diện cho Bạn đọc (Chỉ hiển thị hướng dẫn nộp phạt, không gọi API thanh toán StaffOnly)
  if (!isStaff) {
    return (
      <Modal
        title={<span style={modalTitleStyle}>Hướng Dẫn Thanh Toán Khoản Phạt</span>}
        open={open}
        onCancel={onClose}
        footer={[
          <Button key="close" type="primary" onClick={onClose} style={primaryButtonStyle}>
            Đã hiểu hướng dẫn
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <div
            style={{
              padding: 'var(--sp-3) var(--sp-4)',
              background: 'var(--background)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--sp-4)',
              borderLeft: '4px solid var(--destructive)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={mutedText13Style}>Mã phiếu phạt: <strong>{fine.fineNumber}</strong></span>
              <FineStatusTag status={fine.status} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--destructive)', margin: 'var(--sp-1) 0' }}>
              {formatCurrency(fine.amount)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--foreground)' }}>Lý do: {fine.description}</div>
          </div>

          <Alert
            title="Hướng dẫn nộp phạt & xác nhận giao dịch"
            description="Hệ thống chưa tích hợp thanh toán trực tuyến tự động. Bạn đọc vui lòng nộp tiền mặt tại quầy hoặc chuyển khoản theo thông tin bên dưới để Thủ thư kiểm tra và xác nhận hoàn tất phiếu phạt."
            type="info"
            showIcon
            style={{ marginBottom: 'var(--sp-4)', borderRadius: 'var(--radius-sm)' }}
          />

          <div style={{ textAlign: 'center', padding: 'var(--sp-4)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: 'var(--sp-2)' }}>
              Thông tin chuyển khoản tham khảo (VietQR)
            </div>
            <div
              style={{
                width: 140,
                height: 140,
                margin: '0 auto',
                background: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <QrcodeOutlined style={{ fontSize: 80, color: 'var(--primary)' }} />
            </div>
            <div style={{ marginTop: 'var(--sp-3)', fontSize: 13, textAlign: 'left', lineHeight: 1.8 }}>
              <div>• Ngân hàng: <strong>BIDV - Chi nhánh Hà Nội</strong></div>
              <div>• Số tài khoản: <strong>190367888999</strong></div>
              <div>• Chủ tài khoản: <strong>BAN QUẢN LÝ THƯ VIỆN</strong></div>
              <div>• Nội dung chuyển: <strong style={{ color: 'var(--primary)' }}>PHAT {fine.fineNumber}</strong></div>
            </div>
          </div>
        </div>
      </Modal>
    )
  }

  // Giao diện cho Thủ thư / Quản trị viên (Thu đủ 100% một lần qua API StaffOnly)
  return (
    <Modal
      title={
        <span style={modalTitleStyle}>
          Ghi Nhận Thanh Toán Phí Phạt (Thủ thư)
        </span>
      }
      open={open}
      onOk={handlePay}
      confirmLoading={loading}
      onCancel={() => {
        if (!loading) onClose()
      }}
      mask={{ closable: !loading }}
      okText="Xác nhận thu đủ tiền"
      cancelText="Đóng"
      okButtonProps={{ style: primaryButtonStyle, disabled: !canSubmit }}
      cancelButtonProps={{ style: radiusStyle, disabled: loading }}
    >
      <div style={{ marginBottom: 'var(--sp-3)' }}>
        <div
          style={{
            padding: 'var(--sp-3) var(--sp-4)',
            background: 'var(--background)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--sp-4)',
            borderLeft: '4px solid var(--destructive)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={mutedText13Style}>
              Phiếu phạt: <strong>{fine.fineNumber}</strong> • {fine.readerName}
            </span>
            <FineStatusTag status={fine.status} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--foreground)' }}>Lý do: {fine.description}</div>
        </div>

        {submitError && (
          <Alert
            title={submitError}
            type="error"
            showIcon
            style={{ marginBottom: 'var(--sp-4)', borderRadius: 'var(--radius-sm)' }}
          />
        )}

        <div
          style={{
            marginBottom: 'var(--sp-4)',
            padding: 'var(--sp-3) var(--sp-4)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
              Số tiền quyết toán (thu đủ 100% một lần):
            </span>
            <strong style={{ fontSize: 18, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(settlementAmount)}
            </strong>
          </div>
          <div style={{ ...mutedText12Style, marginTop: 4 }}>
            Hệ thống thanh toán trực tiếp một lần để hoàn tất toàn bộ phiếu phạt ngay.
          </div>
        </div>

        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <label style={{ display: 'block', fontWeight: 600, color: 'var(--foreground)', marginBottom: 'var(--sp-2)' }}>
            Chọn phương thức thu tiền:
          </label>
          <Radio.Group
            value={method}
            disabled={loading || !payable}
            onChange={(e) => setMethod(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Radio value="Cash" style={{ padding: 'var(--sp-2) var(--sp-3)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: '100%' }}>
                <DollarOutlined style={{ marginRight: 'var(--sp-2)', color: 'var(--primary)' }} /> Thu tiền mặt trực tiếp tại quầy (Cash)
              </Radio>
              <Radio value="BankTransfer" style={{ padding: 'var(--sp-2) var(--sp-3)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: '100%' }}>
                <BankOutlined style={{ marginRight: 'var(--sp-2)', color: 'var(--accent)' }} /> Chuyển khoản ngân hàng (BankTransfer)
              </Radio>
              <Radio value="Other" style={{ padding: 'var(--sp-2) var(--sp-3)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: '100%' }}>
                <WalletOutlined style={{ marginRight: 'var(--sp-2)', color: 'var(--muted-foreground)' }} /> Hình thức thanh toán khác (Other)
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        <div>
          <label
            htmlFor="fine-payment-notes"
            style={{ display: 'block', fontWeight: 600, color: 'var(--foreground)', marginBottom: 'var(--sp-2)' }}
          >
            Ghi chú giao dịch (tùy chọn):
          </label>
          <Input.TextArea
            id="fine-payment-notes"
            rows={2}
            maxLength={250}
            value={notes}
            disabled={loading || !payable}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Thu tiền mặt tại quầy thủ thư, mã giao dịch chuyển khoản..."
            style={radiusStyle}
          />
        </div>
      </div>
    </Modal>
  )
}
