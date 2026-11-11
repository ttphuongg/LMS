import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Select, InputNumber, Row, Col, Space } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { useParams, useNavigate } from 'react-router-dom'
import { catalogApi } from '../api'
import type { AuthorDto, CategoryDto, CreateBookRequest, LocationDto, UpdateBookRequest } from '../types'
import { PageHeader } from '@/shared/components/PageHeader'
import { LoadingState } from '@/shared/components/LoadingState'
import { cardStyle, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'
import { API_BASE_URL } from '@/shared/api/client'

export const AdminBookFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form] = Form.useForm()
  const [authors, setAuthors] = useState<AuthorDto[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [initialFormValues, setInitialFormValues] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const loadRefData = Promise.all([
      catalogApi.getAuthors(),
      catalogApi.getCategories(),
      !isEdit ? catalogApi.getLocations(true).catch(() => []) : Promise.resolve([]),
    ])

    loadRefData
      .then(async ([aList, cList, lList]) => {
        setAuthors(aList)
        setCategories(cList)
        setLocations(lList)

        if (isEdit && id) {
          try {
            const b = await catalogApi.getBookById(id)
            const authorIds =
              b.authorIds && b.authorIds.length > 0
                ? b.authorIds
                : aList.filter((a) => b.authors?.includes(a.name)).map((a) => Number(a.id))
            const categoryIds =
              b.categoryIds && b.categoryIds.length > 0
                ? b.categoryIds
                : cList.filter((c) => b.categories?.includes(c.name)).map((c) => Number(c.id))

            setInitialFormValues({
              title: b.title,
              isbn: b.isbn,
              authorIds,
              categoryIds,
              publisher: b.publisher,
              publishedYear: b.publishedYear,
              description: b.description,
              language: b.language || 'vi',
              pageCount: b.pageCount,
              bookValue: b.bookValue,
              coverImageUrl: b.coverImageUrl || b.coverImage,
            })
          } catch {
            message.error('Không thể tải thông tin sách')
          }
        }
      })
      .catch(() => {
        message.error('Không thể tải danh mục tác giả/thể loại')
      })
      .finally(() => setInitialLoading(false))
  }, [id, isEdit])

  useEffect(() => {
    if (!initialLoading && initialFormValues) {
      form.setFieldsValue(initialFormValues)
    }
  }, [initialLoading, initialFormValues, form])

  const handleSubmit = async (values: CreateBookRequest & UpdateBookRequest) => {
    try {
      setLoading(true)
      if (isEdit && id) {
        await catalogApi.updateBook(id, values)
        message.success('Cập nhật tài liệu thành công!')
      } else {
        const res = await catalogApi.createBook(values)
        if (res.initialCopyErrors && res.initialCopyErrors.length > 0) {
          message.warning(
            `Đã tạo đầu sách mới, nhưng có ${res.initialCopyErrors.length} bản sao ban đầu chưa tạo được: ${res.initialCopyErrors[0]}`
          )
        } else {
          message.success('Nhập tài liệu mới vào mục lục thành công!')
        }
      }
      navigate('/admin/books')
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi lưu tài liệu'))
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return <LoadingState tip="Đang tải dữ liệu biểu mẫu sách..." />
  }

  const locationOptions = locations.map((loc) => {
    const count = loc.currentCount ?? 0
    const isFull = loc.maxCapacity != null && count >= loc.maxCapacity
    const capText = loc.maxCapacity != null ? `${count}/${loc.maxCapacity} cuốn` : `${count} cuốn`
    return {
      value: loc.id,
      disabled: isFull,
      label: `${loc.aisle} - ${loc.shelf} - Tầng ${loc.rowLevel} (${capText}${isFull ? ' - Đã đầy' : ''})`,
    }
  })

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Chỉnh Sửa Thông Tin Sách' : 'Nhập Sách Mới Vào Mục Lục'}
        subtitle="Khai báo thông tin thư mục, mã ISBN, tác giả và thể loại tài liệu"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Danh mục sách', href: '/admin/books' },
          { title: isEdit ? 'Chỉnh sửa' : 'Nhập mới' },
        ]}
      />

      <Card className="catalog-card" style={{ ...cardStyle, maxWidth: 840 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Tên tài liệu / Sách"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tên sách' }]}
          >
            <Input placeholder="VD: Clean Code" style={radiusStyle} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tác giả"
                name="authorIds"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất một tác giả' }]}
              >
                <Select
                  mode="multiple"
                  allowClear
                  optionFilterProp="label"
                  placeholder="Chọn một hoặc nhiều tác giả"
                  options={authors.map((a) => ({ label: a.name, value: Number(a.id) }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Thể loại / Chuyên ngành"
                name="categoryIds"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất một thể loại' }]}
              >
                <Select
                  mode="multiple"
                  allowClear
                  optionFilterProp="label"
                  placeholder="Chọn một hoặc nhiều thể loại"
                  options={categories.map((c) => ({ label: c.name, value: Number(c.id) }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Mã chuẩn ISBN"
                name="isbn"
                rules={[{ required: true, message: 'Vui lòng nhập mã ISBN' }]}
              >
                <Input placeholder="978-0132350884" style={radiusStyle} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Nhà xuất bản" name="publisher">
                <Input placeholder="VD: Prentice Hall" style={radiusStyle} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Năm xuất bản"
                name="publishedYear"
                rules={[
                  {
                    validator: async (_, value) => {
                      if (value === null || value === undefined || value === '') {
                        return Promise.resolve()
                      }
                      const num = Number(value)
                      if (!Number.isInteger(num) || num < 1000 || num > 2100) {
                        return Promise.reject(new Error('Năm xuất bản phải là số nguyên từ 1000 đến 2100'))
                      }
                      return Promise.resolve()
                    },
                  },
                ]}
              >
                <InputNumber min={1000} max={2100} precision={0} step={1} style={{ width: '100%', borderRadius: 'var(--radius)' }} placeholder="VD: 2024" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Ngôn ngữ" name="language" initialValue="vi">
                <Input placeholder="VD: vi, en" style={radiusStyle} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Số trang" name="pageCount">
                <InputNumber min={1} style={{ width: '100%', borderRadius: 'var(--radius)' }} placeholder="VD: 350" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Định giá (VNĐ)" name="bookValue">
                <InputNumber
                  min={0}
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(val: string | undefined) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0) as 0}
                  style={{ width: '100%', borderRadius: 'var(--radius)' }}
                  placeholder="VD: 150000"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Đường dẫn ảnh bìa (Cover Image URL)" name="coverImageUrl">
            <Input placeholder="https://example.com/cover.jpg" style={radiusStyle} />
          </Form.Item>

          <Form.Item shouldUpdate={(prev, curr) => prev.coverImageUrl !== curr.coverImageUrl} noStyle>
            {({ getFieldValue }) => {
              const rawUrl = getFieldValue('coverImageUrl') as string | undefined
              const url = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${API_BASE_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`) : ''
              return url ? (
                <div style={{ marginBottom: 16 }}>
                  <img
                    src={url}
                    alt="Preview bìa sách"
                    style={{ maxHeight: 120, objectFit: 'contain', borderRadius: 4, border: '1px solid #d9d9d9' }}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              ) : null
            }}
          </Form.Item>

          {!isEdit && (
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Số lượng bản sao nhập đợt đầu"
                  name="initialCopies"
                  initialValue={1}
                  rules={[{ required: true, message: 'Nhập số lượng bản sao' }]}
                >
                  <InputNumber min={0} max={100} style={{ width: '100%', borderRadius: 'var(--radius)' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={16}>
                <Form.Item
                  label="Vị trí kệ xếp sách ban đầu"
                  name="initialLocationId"
                  extra="Để trống nếu chưa xếp kệ ngay."
                >
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn vị trí kệ từ hệ thống..."
                    options={locationOptions}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item label="Tóm tắt nội dung tài liệu" name="description">
            <Input.TextArea rows={4} placeholder="Nhập tóm lược nội dung..." style={radiusStyle} />
          </Form.Item>

          <Form.Item style={{ marginTop: 'var(--sp-6)' }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} style={primaryButtonStyle}>
                {isEdit ? 'Lưu thay đổi' : 'Nhập sách vào kho'}
              </Button>
              <Button onClick={() => navigate('/admin/books')} style={radiusStyle}>Hủy bỏ</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
