import { useState } from 'react'
import { Form } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { circulationApi } from '../api'
import type { LoanDetailDto } from '../types'
import { getErrorMessage } from '@/shared/utils/format'

/** Giá trị điền sẵn khi mở biên bản sự cố. */
const DEFAULT_INCIDENT_VALUES = {
  incidentType: 'Damaged',
  severity: 'Minor',
  description: 'Sách bị rách một số trang nội dung',
  compensationAmount: 50000,
}

/** Trạng thái + hành động của modal "Biên bản sự cố tài liệu". */
export function useIncidentReport() {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<LoanDetailDto | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const openFor = (dtl: LoanDetailDto) => {
    setDetail(dtl)
    form.setFieldsValue(DEFAULT_INCIDENT_VALUES)
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
      message.success('Đã lập biên bản sự cố và chuyển kết xuất phí bồi hoàn!')
      setOpen(false)
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi lập biên bản sự cố'))
    } finally {
      setSubmitting(false)
    }
  }

  return { open, detail, form, submitting, openFor, close, submit }
}

export type IncidentReportState = ReturnType<typeof useIncidentReport>
