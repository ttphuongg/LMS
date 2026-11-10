import React, { useState } from 'react'
import { Table, Button, Modal, Form } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined } from '@ant-design/icons'
import { PageHeader } from '@/shared/components/PageHeader'
import { useLoadOnMount } from '@/shared/hooks'
import { getErrorMessage } from '@/shared/utils/format'
import { modalTitleStyle, primaryButtonStyle, radiusStyle } from '@/shared/styles/ui'

interface SimpleCreateListPageProps<T, V> {
  /** Tiêu đề + mô tả + breadcrumb của trang */
  title: string
  subtitle: string
  breadcrumbTitle: string
  /** Nhãn nút mở modal, tiêu đề modal, nhãn nút lưu */
  addButtonLabel: string
  modalTitle: string
  okText: string
  /** Dữ liệu */
  fetchItems: () => Promise<T[]>
  createItem: (values: V) => Promise<unknown>
  columns: ColumnsType<T>
  /** Các `Form.Item` trong modal */
  formFields: React.ReactNode
  /** Thông báo hiển thị cho người dùng */
  messages: {
    loadError: string
    createSuccess: string
    createError: string
  }
}

/**
 * Trang "danh sách + modal thêm mới" dùng chung cho Tác giả và Thể loại.
 */
export function SimpleCreateListPage<T extends { id: string | number }, V>({
  title,
  subtitle,
  breadcrumbTitle,
  addButtonLabel,
  modalTitle,
  okText,
  fetchItems,
  createItem,
  columns,
  formFields,
  messages,
}: SimpleCreateListPageProps<T, V>) {
  const { data: items, loading, reload: loadItems } = useLoadOnMount(fetchItems, [] as T[], messages.loadError)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<V>()

  const handleCreate = async () => {
    try {
      setSubmitting(true)
      const values = await form.validateFields()
      await createItem(values)
      message.success(messages.createSuccess)
      form.resetFields()
      setModalOpen(false)
      loadItems()
    } catch (err: unknown) {
      message.error(getErrorMessage(err, messages.createError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: breadcrumbTitle },
        ]}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            style={primaryButtonStyle}
          >
            {addButtonLabel}
          </Button>
        }
      />

      <Table
        columns={columns}
        dataSource={items}
        rowKey="id"
        loading={loading}
        bordered
        scroll={{ x: 600 }}
      />

      <Modal
        title={<span style={modalTitleStyle}>{modalTitle}</span>}
        open={modalOpen}
        onOk={handleCreate}
        confirmLoading={submitting}
        onCancel={() => setModalOpen(false)}
        okText={okText}
        cancelText="Hủy"
        okButtonProps={{ style: primaryButtonStyle }}
        cancelButtonProps={{ style: radiusStyle }}
      >
        <Form form={form} layout="vertical">
          {formFields}
        </Form>
      </Modal>
    </div>
  )
}
