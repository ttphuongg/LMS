import React, { useState } from 'react'
import { Card, Form, Input, Button, DatePicker, Space, Tag, Typography } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { BarcodeOutlined, UserOutlined, PhoneOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { circulationApi } from '../api'
import type { CirculationEligibilityResult } from '../types'
import type { UserManagementItem } from '@/features/notifications/types'
import { CirculationRestrictionBanner } from '../components/CirculationRestrictionBanner'
import { ReaderSelect } from '@/shared/components/ReaderSelect'
import { PageHeader } from '@/shared/components/PageHeader'
import { LIBRARY_RULES } from '@/shared/constants/rules'
import { cardStyle, mutedTextStyle, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

const { Text } = Typography

export const AdminBorrowPage: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [barcodes, setBarcodes] = useState<string[]>([])
  const [currentBarcode, setCurrentBarcode] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserManagementItem | null>(null)
  const [readerEligibility, setReaderEligibility] = useState<CirculationEligibilityResult | null>(null)
  const [checkingEligibility, setCheckingEligibility] = useState(false)

  // Kiểm tra tình trạng lưu thông của bạn đọc khi được chọn
  const handleCheckEligibility = async (accountId: number) => {
    if (!accountId || isNaN(accountId) || accountId <= 0) {
      setReaderEligibility(null)
      return
    }
    try {
      setCheckingEligibility(true)
      const result = await circulationApi.getCirculationEligibility(accountId)
      setReaderEligibility(result)
    } catch {
      setReaderEligibility(null)
    } finally {
      setCheckingEligibility(false)
    }
  }

  const handleAddBarcode = () => {
    const trimmed = currentBarcode.trim()
    if (!trimmed) return
    if (barcodes.includes(trimmed)) {
      message.warning('Mã vạch này đã có trong danh sách mượn')
      return
    }
    if (barcodes.length >= LIBRARY_RULES.maxConcurrentLoans) {
      message.warning(`Đã đạt giới hạn tối đa ${LIBRARY_RULES.maxConcurrentLoans} cuốn sách/lần mượn`)
      return
    }
    setBarcodes([...barcodes, trimmed])
    setCurrentBarcode('')
  }

  const handleRemoveBarcode = (code: string) => {
    setBarcodes(barcodes.filter((b) => b !== code))
  }

  const handleSubmit = async (values: { accountId: string; dueDate: dayjs.Dayjs; notes?: string }) => {
    if (barcodes.length === 0) {
      message.error('Vui lòng quét hoặc nhập ít nhất một mã bản sao sách')
      return
    }

    // Cảnh báo nếu bạn đọc đang bị hạn chế mượn sách
    if (readerEligibility && !readerEligibility.isEligible) {
      message.error(readerEligibility.restrictionReason || 'Bạn đọc này đang bị hạn chế mượn sách.')
      return
    }

    try {
      setLoading(true)
      await circulationApi.createLoan({
        accountId: values.accountId,
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        bookCopyIds: barcodes,
        notes: values.notes,
      })
      message.success('Đã lập phiếu mượn tài liệu thành công!')
      navigate('/admin/loans')
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi lập phiếu mượn'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Lập Phiếu Mượn Tại Quầy"
        subtitle="Tìm kiếm bạn đọc bằng thẻ, tên, email, SĐT và quét mã vạch tài liệu để kích hoạt quyền mượn"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Sổ mượn trả', href: '/admin/loans' },
          { title: 'Lập phiếu mượn' },
        ]}
      />

      <Card className="catalog-card" style={{ ...cardStyle, maxWidth: 760 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            dueDate: dayjs().add(LIBRARY_RULES.standardBorrowDays, 'day'),
          }}
        >
          {/* Ô TÌM KIẾM BẠN ĐỌC THÔNG MINH */}
          <Form.Item
            label="Bạn đọc mượn tài liệu"
            name="accountId"
            rules={[{ required: true, message: 'Vui lòng chọn bạn đọc' }]}
            extra="Thủ thư có thể gõ Tên bạn đọc, Username, Số điện thoại, Email hoặc quét Mã số thẻ"
          >
            <ReaderSelect
              onSelectUser={(u) => {
                setSelectedUser(u)
                if (u) {
                  handleCheckEligibility(Number(u.id))
                } else {
                  setReaderEligibility(null)
                }
              }}
              onClear={() => {
                setSelectedUser(null)
                setReaderEligibility(null)
              }}
            />
          </Form.Item>

          {/* THẺ TÓM TẮT THÔNG TIN BẠN ĐỌC ĐÃ CHỌN */}
          {selectedUser && (
            <div
              style={{
                background: 'var(--muted)',
                padding: 'var(--sp-3) var(--sp-4)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                marginBottom: 'var(--sp-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {selectedUser.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                    {selectedUser.fullName}{' '}
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      (@{selectedUser.username})
                    </Text>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', display: 'flex', gap: 12 }}>
                    {selectedUser.phone && <span><PhoneOutlined /> {selectedUser.phone}</span>}
                    {selectedUser.email && <span><MailOutlined /> {selectedUser.email}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Tag color="blue">
                  <IdcardOutlined /> ID Thẻ: {selectedUser.id}
                </Tag>
                {selectedUser.status === 'Locked' ? (
                  <Tag color="error">Tài khoản bị khóa</Tag>
                ) : (
                  <Tag color="success">Hoạt động</Tag>
                )}
              </div>
            </div>
          )}

          {/* Banner tình trạng lưu thông của bạn đọc — hiện ngay sau khi chọn bạn đọc */}
          {checkingEligibility && (
            <div style={{ marginBottom: 16, color: 'var(--muted-foreground)', fontSize: 13 }}>
              🔍 Đang kiểm tra điều kiện lưu thông của bạn đọc...
            </div>
          )}
          {readerEligibility && (
            <CirculationRestrictionBanner eligibility={readerEligibility} />
          )}

          <Form.Item
            label="Hạn trả tài liệu (Mặc định 14 ngày theo Điều 4)"
            name="dueDate"
            rules={[{ required: true, message: 'Vui lòng chọn ngày trả' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%', borderRadius: 'var(--radius)' }} />
          </Form.Item>

          {/* Nhập mã vạch bản sao */}
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--sp-1)', fontWeight: 500, color: 'var(--foreground)' }}>
              Quét mã vạch bản sao sách (Tối đa {LIBRARY_RULES.maxConcurrentLoans} cuốn theo Điều 4):
            </label>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                prefix={<BarcodeOutlined style={mutedTextStyle} />}
                placeholder="Nhập hoặc quét mã vạch (VD: BC-0051-01)..."
                value={currentBarcode}
                onChange={(e) => setCurrentBarcode(e.target.value)}
                onPressEnter={(e) => {
                  e.preventDefault()
                  handleAddBarcode()
                }}
                style={{ borderRadius: 'var(--radius) 0 0 var(--radius)' }}
              />
              <Button
                type="primary"
                onClick={handleAddBarcode}
                style={{
                  background: 'var(--primary)',
                  borderColor: 'var(--primary)',
                  borderRadius: '0 var(--radius) var(--radius) 0',
                }}
              >
                Thêm vào phiếu
              </Button>
            </Space.Compact>

            {/* Danh sách mã đã quét */}
            <div style={{ marginTop: 'var(--sp-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
              {barcodes.map((code) => (
                <Tag
                  key={code}
                  closable
                  onClose={() => handleRemoveBarcode(code)}
                  style={{
                    padding: 'var(--sp-1) var(--sp-2)',
                    fontSize: 13,
                    background: 'var(--muted)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {code}
                </Tag>
              ))}
              {barcodes.length === 0 && (
                <span style={{ fontSize: 13, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                  Chưa có mã bản sao nào được thêm vào phiếu
                </span>
              )}
            </div>
          </div>

          <Form.Item label="Ghi chú nghiệp vụ" name="notes">
            <Input.TextArea rows={2} placeholder="Tình trạng sách khi giao, lưu ý đặc biệt..." style={radiusStyle} />
          </Form.Item>

          <Form.Item style={{ marginTop: 'var(--sp-6)' }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={readerEligibility ? !readerEligibility.isEligible : false}
                style={primaryButtonStyle}
              >
                Hoàn tất & Cấp sách
              </Button>
              <Button onClick={() => navigate('/admin/loans')} style={radiusStyle}>Hủy bỏ</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
