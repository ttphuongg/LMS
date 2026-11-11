import React from 'react'
import { Form, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { catalogApi } from '../api'
import type { AuthorDto } from '../types'
import { SimpleCreateListPage } from '../components/SimpleCreateListPage'

const columns: ColumnsType<AuthorDto> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
    render: (id: string) => <span className="tabular-numbers">#{id}</span>,
  },
  {
    title: 'Tên tác giả',
    dataIndex: 'name',
    key: 'name',
    render: (name: string) => <strong>{name}</strong>,
  },
  {
    title: 'Tiểu sử tóm tắt',
    dataIndex: 'bio',
    key: 'bio',
    render: (bio: string) => bio || 'Chưa có thông tin',
  },
]

export const AdminAuthorsPage: React.FC = () => (
  <SimpleCreateListPage<AuthorDto, Omit<AuthorDto, 'id'>>
    title="Danh Mục Tác Giả"
    subtitle="Quản lý thông tin các học giả, nhà văn và tác giả tài liệu"
    breadcrumbTitle="Tác giả"
    addButtonLabel="Thêm tác giả"
    modalTitle="Thêm Tác Giả Mới"
    okText="Lưu tác giả"
    fetchItems={catalogApi.getAuthors}
    createItem={catalogApi.createAuthor}
    columns={columns}
    messages={{
      loadError: 'Lỗi khi tải danh sách tác giả',
      createSuccess: 'Đã thêm tác giả vào danh mục!',
      createError: 'Lỗi khi thêm tác giả',
    }}
    formFields={
      <>
        <Form.Item
          label="Họ và tên tác giả"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên tác giả' }]}
        >
          <Input placeholder="VD: Robert C. Martin" />
        </Form.Item>

        <Form.Item label="Tiểu sử / Ghi chú" name="bio">
          <Input.TextArea rows={3} placeholder="Tóm tắt công trình, đóng góp..." />
        </Form.Item>
      </>
    }
  />
)
