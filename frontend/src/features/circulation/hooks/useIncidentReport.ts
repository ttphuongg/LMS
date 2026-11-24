import { useState } from 'react'
import { Form } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { circulationApi } from '../api'
import type { LoanDetailDto } from '../types'
import { getErrorMessage } from '@/shared/utils/format'
import { calculateIncidentCompensation } from '@/features/billing/utils/fineCalculation'

/** Trạng thái + hành động của modal "Biên bản sự cố tài liệu". */
export function useIncidentReport(onSuccess?: () => void | Promise<void>) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<LoanDetailDto | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const openFor = (dtl: LoanDetailDto) => {
    setDetail(dtl)
    // Tự động tính toán số tiền bồi thường ban đầu theo Điều 8 Quy chế
    const calc = calculateIncidentCompensation('Damaged', 'Minor', dtl.bookValue)
    form.setFieldsValue({
      incidentType: 'Damaged',
      severity: 'Minor',
      description: 'Sách bị xước bìa, sờn mép hoặc vết bẩn nhẹ',
      compensationAmount: calc.amount,
    })
    setOpen(true)
  }

  const close = () => setOpen(false)

  const submit = async () => {
    if (!detail) return
    try {
      setSubmitting(true)
      const values = await form.validateFields()
      await circulationApi.reportIncident({
        loanSlipDetailId: detail.id,
        ...values,
      })
      message.success('Đã lập biên bản sự cố và chuyển kết xuất phí bồi hoàn theo quy định!')
      setOpen(false)
      if (onSuccess) {
        await onSuccess()
      }
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi lập biên bản sự cố'))
    } finally {
      setSubmitting(false)
    }
  }

  return { open, detail, form, submitting, openFor, close, submit }
}

export type IncidentReportState = ReturnType<typeof useIncidentReport>
