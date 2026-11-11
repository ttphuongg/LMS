import React, { useState } from 'react'
import { Alert, Button, Modal } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { BookOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/identity'
import { circulationApi } from '../api'
import { LIBRARY_RULES } from '@/shared/constants/rules'
import { modalTitleStyle, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

interface ReserveButtonProps {
  bookId: string
  bookTitle?: string
  disabled?: boolean
}

interface ReserveBlockAction {
  label: string
  to: string
}

/** Xác định trang cá nhân phù hợp giúp bạn đọc xử lý nguyên nhân bị từ chối đặt trước. */
function getReserveBlockAction(errorText: string): ReserveBlockAction | null {
  const normalized = errorText.toLowerCase()
  if (normalized.includes('phạt') || normalized.includes('nợ')) {
    return { label: 'Xem phiếu phạt của tôi', to: '/my-fines' }
  }
  if (
    normalized.includes('quá hạn') ||
    normalized.includes('đang mượn') ||
    normalized.includes('yêu cầu đặt trước')
  ) {
    return { label: 'Xem sách mượn & đặt trước', to: '/my-loans' }
  }
  return null
}

export const ReserveButton: React.FC<ReserveButtonProps> = ({
  bookId,
  bookTitle,
  disabled = false,
}) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reserved, setReserved] = useState(false)
  const [reserveError, setReserveError] = useState<string | null>(null)

  const handleClick = () => {
    if (!isAuthenticated) {
      message.info('Vui lòng đăng nhập thẻ để thực hiện đặt trước sách')
      navigate('/login')
      return
    }
    setReserveError(null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setReserveError(null)
  }

  const handleConfirmReserve = async () => {
    try {
      setLoading(true)
      setReserveError(null)
      await circulationApi.createReservation({ bookId })
      message.success(`Đặt trước thành công cuốn "${bookTitle || 'sách'}"!`)
      setReserved(true)
      setModalOpen(false)
    } catch (err: unknown) {
      const errMsg = getErrorMessage(err, 'Đặt trước thất bại')
      setReserveError(errMsg)
      message.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const blockAction = reserveError ? getReserveBlockAction(reserveError) : null

  return (
    <>
      <Button
        type="primary"
        icon={reserved ? <CheckCircleOutlined /> : <BookOutlined />}
        onClick={handleClick}
        disabled={disabled || reserved}
        style={{
          background: reserved ? 'var(--accent)' : 'var(--primary)',
          borderColor: reserved ? 'var(--accent)' : 'var(--primary)',
          borderRadius: 'var(--radius)',
          fontWeight: 600,
        }}
      >
        {reserved ? 'Đã đăng ký đặt trước' : 'Đặt trước tài liệu này'}
      </Button>

      <Modal
        title={
          <span style={modalTitleStyle}>
            Xác Nhận Đặt Giữ Chỗ Sách
          </span>
        }
        open={modalOpen}
        onOk={handleConfirmReserve}
        confirmLoading={loading}
        onCancel={handleCloseModal}
        okText="Xác nhận giữ chỗ"
        cancelText="Đóng"
        okButtonProps={{ style: primaryButtonStyle, disabled: Boolean(reserveError) }}
        cancelButtonProps={{ style: radiusStyle }}
      >
        <div style={{ padding: 'var(--sp-2) 0', color: 'var(--foreground)' }}>
          {reserveError && (
            <Alert
              type="error"
              showIcon
              title="Không thể thực hiện đặt trước"
              description={
                <div>
                  <div>{reserveError}</div>
                  {blockAction && (
                    <div style={{ marginTop: 'var(--sp-2)' }}>
                      <Button
                        size="small"
                        type="primary"
                        danger
                        onClick={() => {
                          handleCloseModal()
                          navigate(blockAction.to)
                        }}
                        style={radiusStyle}
                      >
                        {blockAction.label}
                      </Button>
                    </div>
                  )}
                </div>
              }
              style={{ marginBottom: 'var(--sp-4)', borderRadius: 'var(--radius)' }}
            />
          )}

          <p style={{ margin: '0 0 var(--sp-3)' }}>
            Bạn đang đăng ký đặt trước cuốn:
          </p>
          <div
            style={{
              padding: 'var(--sp-2) var(--sp-3)',
              background: 'var(--muted)',
              borderLeft: '3px solid var(--accent)',
              fontWeight: 600,
              marginBottom: 'var(--sp-4)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {bookTitle || 'Tài liệu thư viện'}
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.6 }}>
            <strong>Lưu ý:</strong> Mỗi bạn đọc được đặt trước tối đa <strong>{LIBRARY_RULES.maxConcurrentReservations} cuốn</strong> cùng lúc. Khi có bản sao sẵn sàng, thư viện sẽ giữ riêng tài liệu này tại quầy thủ thư cho bạn trong vòng <strong>{LIBRARY_RULES.reservationHoldHours} giờ</strong>. Bạn có thể hủy đặt trước bất cứ lúc nào trong trang cá nhân.
          </p>
        </div>
      </Modal>
    </>
  )
}
