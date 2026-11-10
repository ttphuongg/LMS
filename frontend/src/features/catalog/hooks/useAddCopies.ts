import { useState } from 'react'
import { Form } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { catalogApi } from '../api'
import type { BookDto } from '../types'
import { getErrorMessage } from '@/shared/utils/format'

/** Trạng thái + hành động của modal "Bổ sung bản sao vào kệ". */
export function useAddCopies(onSuccess: () => void) {
  const [open, setOpen] = useState(false)
  const [book, setBook] = useState<BookDto | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const openFor = (target: BookDto) => {
    setBook(target)
    form.setFieldsValue({ quantity: 1, location: 'Kệ lưu thông chính - Tầng 2' })
    setOpen(true)
  }

  const close = () => setOpen(false)

  const submit = async () => {
    if (!book) return
    try {
      setSubmitting(true)
      const values = await form.validateFields()
      const result = await catalogApi.addCopies(book.id, values)

      if (result.failCount === 0) {
        message.success(`Đã bổ sung thành công ${result.successCount} bản sao cho cuốn "${book.title}"!`)
      } else {
        message.warning(
          `Bổ sung một phần: Đã tạo ${result.successCount}/${result.totalRequested} bản sao cho "${book.title}". Thất bại: ${result.failCount} bản sao.`
        )
      }

      setOpen(false)
      onSuccess()
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi thêm bản sao'))
    } finally {
      setSubmitting(false)
    }
  }

  return { open, book, form, submitting, openFor, close, submit }
}

export type AddCopiesState = ReturnType<typeof useAddCopies>
