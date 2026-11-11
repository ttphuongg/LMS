import { useCallback, useState } from 'react'
import { Form } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { catalogApi } from '../api'
import type { BookDto, LocationDto } from '../types'
import { getErrorMessage } from '@/shared/utils/format'

/** Trạng thái + hành động của modal "Bổ sung bản sao vào kệ" sử dụng vị trí thực tế từ API. */
export function useAddCopies(onSuccess: () => void) {
  const [open, setOpen] = useState(false)
  const [book, setBook] = useState<BookDto | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [locationsError, setLocationsError] = useState<string | null>(null)

  const loadLocations = useCallback(async () => {
    try {
      setLocationsLoading(true)
      setLocationsError(null)
      const list = await catalogApi.getLocations(true)
      setLocations(list)
    } catch (err: unknown) {
      setLocations([])
      setLocationsError(getErrorMessage(err, 'Không thể tải danh sách vị trí kệ sách'))
    } finally {
      setLocationsLoading(false)
    }
  }, [])

  const openFor = (target: BookDto) => {
    setBook(target)
    form.resetFields()
    form.setFieldsValue({ quantity: 1, locationId: undefined, condition: 'Good' })
    setOpen(true)
    loadLocations()
  }

  const close = () => setOpen(false)

  const submit = async () => {
    if (!book) return
    try {
      setSubmitting(true)
      const values = await form.validateFields()
      const result = await catalogApi.addCopies(book.id, {
        quantity: values.quantity,
        locationId: values.locationId ?? null,
        condition: values.condition,
      })

      if (result.failCount === 0) {
        message.success(`Đã bổ sung thành công ${result.successCount} bản sao cho cuốn "${book.title}"!`)
      } else {
        message.warning(
          `Bổ sung một phần: Đã tạo ${result.successCount}/${result.totalRequested} bản sao cho "${book.title}". Thất bại: ${result.failCount} (${result.errors[0] || ''})`
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

  return {
    open,
    book,
    form,
    submitting,
    locations,
    locationsLoading,
    locationsError,
    reloadLocations: loadLocations,
    openFor,
    close,
    submit,
  }
}

export type AddCopiesState = ReturnType<typeof useAddCopies>
