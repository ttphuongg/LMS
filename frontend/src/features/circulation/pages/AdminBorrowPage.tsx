import React, { useState } from 'react'
import { Card, Form, Input, Button, DatePicker, Space, Tag } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { BarcodeOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { circulationApi } from '../api'
import { PageHeader } from '@/shared/components/PageHeader'
import { LIBRARY_RULES } from '@/shared/constants/rules'
import { cardStyle, mutedTextStyle, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

export const AdminBorrowPage: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [barcodes, setBarcodes] = useState<string[]>([])
  const [currentBarcode, setCurrentBarcode] = useState('')

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
        subtitle="Quét mã thẻ bạn đọc và mã vạch các bản sao tài liệu để kích hoạt quyền mượn"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Sổ mượn trả', href: '/admin/loans' },
          { title: 'Lập phiếu mượn' },
        ]}
      />

      <Card className="catalog-card" style={{ ...cardStyle, maxWidth: 720 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            dueDate: dayjs().add(LIBRARY_RULES.standardBorrowDays, 'day'),
          }}
        >
          <Form.Item
            label="Mã số thẻ bạn đọc (ID tài khoản)"
            name="accountId"
            rules={[{ required: true, message: 'Vui lòng nhập ID bạn đọc' }]}
            extra="Nhập ID tài khoản của bạn đọc (số nguyên, ví dụ: 1, 2, 3...)"
          >
            <Input
              prefix={<UserOutlined style={mutedTextStyle} />}
              placeholder="VD: 1"
              style={radiusStyle}
            />
          </Form.Item>

          <Form.Item
            label="Hạn trả tài liệu"
            name="dueDate"
            rules={[{ required: true, message: 'Vui lòng chọn ngày trả' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%', borderRadius: 'var(--radius)' }} />
          </Form.Item>

          {/* Nhập mã vạch bản sao */}
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--sp-1)', fontWeight: 500, color: 'var(--foreground)' }}>
              Quét mã vạch bản sao sách (Tối đa {LIBRARY_RULES.maxConcurrentLoans} cuốn):
            </label>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                prefix={<BarcodeOutlined style={mutedTextStyle} />}
                placeholder="Nhập mã vạch (VD: BC-0051-01)..."
                value={currentBarcode}
                onChange={(e) => setCurrentBarcode(e.target.value)}
                onPressEnter={(e) => {
                  e.preventDefault()
                  handleAddBarcode()
                }}
                style={{ borderRadius: 'var(--radius) 0 0 var(--radius)' }}
              />
              <Button type="primary" onClick={handleAddBarcode} style={{ background: 'var(--primary)', borderColor: 'var(--primary)', borderRadius: '0 var(--radius) var(--radius) 0' }}>
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
            <Input.TextArea rows={3} placeholder="Tình trạng sách khi giao, lưu ý..." style={radiusStyle} />
          </Form.Item>

          <Form.Item style={{ marginTop: 'var(--sp-6)' }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
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
