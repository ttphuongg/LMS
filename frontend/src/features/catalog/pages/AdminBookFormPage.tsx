import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Select, InputNumber, Row, Col, Space } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { useParams, useNavigate } from 'react-router-dom'
import { catalogApi } from '../api'
import type { AuthorDto, CategoryDto, CreateBookRequest, UpdateBookRequest } from '../types'
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
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)
  const [initialFormValues, setInitialFormValues] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    Promise.all([catalogApi.getAuthors(), catalogApi.getCategories()])
      .then(([aList, cList]) => {
        setAuthors(aList)
        setCategories(cList)

        if (isEdit && id) {
          catalogApi
            .getBookById(id)
            .then((b) => {
              const matchedAuthor = aList.find(
                (a) => a.id === b.authorId || b.authors?.includes(a.name) || a.name === b.authorName
              )
              const matchedCategory = cList.find(
                (c) => c.id === b.categoryId || b.categories?.includes(c.name) || c.name === b.categoryName
              )
              setInitialFormValues({
                title: b.title,
                isbn: b.isbn,
                callNumber: b.callNumber,
                authorId: matchedAuthor ? matchedAuthor.id : b.authorId,
                categoryId: matchedCategory ? matchedCategory.id : b.categoryId,
                publisher: b.publisher,
                publishedYear: b.publishedYear,
                description: b.description,
                language: b.language || 'vi',
                pageCount: b.pageCount,
                bookValue: b.bookValue,
                coverImageUrl: b.coverImageUrl || b.coverImage,
              })
            })
            .catch(() => message.error('Không thể tải thông tin sách'))
            .finally(() => setInitialLoading(false))
        }
      })
      .catch(() => {
        message.error('Không thể tải danh mục tác giả/thể loại')
        setInitialLoading(false)
      })
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
        await catalogApi.createBook(values)
        message.success('Nhập tài liệu mới vào mục lục thành công!')
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

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Chỉnh Sửa Thông Tin Sách' : 'Nhập Sách Mới Vào Mục Lục'}
        subtitle="Khai báo số hiệu phân loại DDC, mã ISBN và các thông số thư mục"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Danh mục sách', href: '/admin/books' },
          { title: isEdit ? 'Chỉnh sửa' : 'Nhập mới' },
        ]}
      />

      <Card className="catalog-card" style={{ ...cardStyle, maxWidth: 840 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                label="Tên tài liệu / Sách"
                name="title"
                rules={[{ required: true, message: 'Vui lòng nhập tên sách' }]}
              >
                <Input placeholder="VD: Clean Code" style={radiusStyle} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Số hiệu phân loại (Call number)"
                name="callNumber"
                rules={[{ required: true, message: 'Vui lòng nhập Call number' }]}
              >
                <Input placeholder="VD: 005.133 M385C" style={radiusStyle} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tác giả"
                name="authorId"
                rules={[{ required: true, message: 'Vui lòng chọn tác giả' }]}
              >
                <Select
                  placeholder="Chọn tác giả biên soạn"
                  options={authors.map((a) => ({ label: a.name, value: a.id }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Thể loại / Chuyên ngành"
                name="categoryId"
                rules={[{ required: true, message: 'Vui lòng chọn thể loại' }]}
              >
                <Select
                  placeholder="Chọn thể loại phân loại"
                  options={categories.map((c) => ({
                    label: `${c.code ? `[${c.code}] ` : ''}${c.name}`,
                    value: c.id,
                  }))}
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
            <Form.Item
              label="Số lượng bản sao nhập đợt đầu"
              name="initialCopies"
              initialValue={1}
              rules={[{ required: true, message: 'Nhập số lượng bản sao' }]}
            >
              <InputNumber min={1} max={100} style={{ width: 200, borderRadius: 'var(--radius)' }} />
            </Form.Item>
          )}

          <Form.Item label="Tóm tắt nội dung tài liệu" name="description">
            <Input.TextArea rows={4} placeholder="Nhập tóm lược nội dung..." style={radiusStyle} />
          </Form.Item>

          <Form.Item style={{ marginTop: 'var(--sp-6)' }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} style={primaryButtonStyle}>
                {isEdit ? 'Lưu cập nhật' : 'Hoàn tất nhập mục lục'}
              </Button>
              <Button onClick={() => navigate('/admin/books')} style={radiusStyle}>Hủy bỏ</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
