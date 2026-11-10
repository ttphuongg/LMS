import React from 'react'
import { Form, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { catalogApi } from '../api'
import type { CategoryDto } from '../types'
import { SimpleCreateListPage } from '../components/SimpleCreateListPage'
import { SpineTag } from '@/shared/components/SpineTag'

const columns: ColumnsType<CategoryDto> = [
  {
    title: 'Mã phân loại DDC',
    dataIndex: 'code',
    key: 'code',
    width: 160,
    render: (code: string) => (code ? <SpineTag variant="primary">{code}</SpineTag> : '—'),
  },
  {
    title: 'Tên thể loại',
    dataIndex: 'name',
    key: 'name',
    render: (name: string) => <strong>{name}</strong>,
  },
  {
    title: 'Mô tả phạm vi',
    dataIndex: 'description',
    key: 'description',
    render: (desc: string) => desc || '—',
  },
]

export const AdminCategoriesPage: React.FC = () => (
  <SimpleCreateListPage<CategoryDto, Omit<CategoryDto, 'id'>>
    title="Danh Mục Thể Loại Phân Loại"
    subtitle="Hệ thống phân loại Dewey (DDC) tổ chức kho tàng tri thức theo chuyên ngành"
    breadcrumbTitle="Thể loại"
    addButtonLabel="Thêm thể loại"
    modalTitle="Thêm Thể Loại Phân Loại Mới"
    okText="Lưu thể loại"
    fetchItems={catalogApi.getCategories}
    createItem={catalogApi.createCategory}
    columns={columns}
    messages={{
      loadError: 'Lỗi khi tải danh sách thể loại',
      createSuccess: 'Đã thêm thể loại phân loại thành công!',
      createError: 'Lỗi khi thêm thể loại',
    }}
    formFields={
      <>
        <Form.Item
          label="Mã phân loại DDC"
          name="code"
          rules={[{ required: true, message: 'Vui lòng nhập mã DDC' }]}
        >
          <Input placeholder="VD: 005.1 hoặc 330" />
        </Form.Item>

        <Form.Item
          label="Tên thể loại / Chuyên ngành"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên thể loại' }]}
        >
          <Input placeholder="VD: Khoa học Máy tính & Phần mềm" />
        </Form.Item>

        <Form.Item label="Mô tả phạm vi tài liệu" name="description">
          <Input.TextArea rows={3} placeholder="Phạm vi chủ đề bao quát..." />
        </Form.Item>
      </>
    }
  />
)
