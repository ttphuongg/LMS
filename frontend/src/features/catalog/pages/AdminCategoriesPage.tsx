import React from 'react'
import { Form, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { catalogApi } from '../api'
import type { CategoryDto } from '../types'
import { SimpleCreateListPage } from '../components/SimpleCreateListPage'
import { SpineTag } from '@/shared/components/SpineTag'

const columns: ColumnsType<CategoryDto> = [
  {
    title: 'Mã danh mục',
    dataIndex: 'id',
    key: 'id',
    width: 120,
    render: (id: string) => <SpineTag variant="neutral">#{id}</SpineTag>,
  },
  {
    title: 'Tên thể loại',
    dataIndex: 'name',
    key: 'name',
    render: (name: string) => <strong>{name}</strong>,
  },
  {
    title: 'Số đầu sách',
    dataIndex: 'bookCount',
    key: 'bookCount',
    width: 130,
    render: (count?: number) => <SpineTag variant="primary">{count ?? 0} đầu sách</SpineTag>,
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
    title="Danh Mục Thể Loại Tài Liệu"
    subtitle="Quản lý các nhóm chuyên ngành và phạm vi tài liệu trong mục lục thư viện"
    breadcrumbTitle="Thể loại"
    addButtonLabel="Thêm thể loại"
    modalTitle="Thêm Thể Loại Mới"
    okText="Lưu thể loại"
    fetchItems={catalogApi.getCategories}
    createItem={catalogApi.createCategory}
    columns={columns}
    messages={{
      loadError: 'Lỗi khi tải danh sách thể loại',
      createSuccess: 'Đã thêm thể loại thành công!',
      createError: 'Lỗi khi thêm thể loại',
    }}
    formFields={
      <>
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
