import React from 'react'
import { SpineTag } from '@/shared/components/SpineTag'
import { getFineStatusMeta } from '../utils/fineStatus'

interface FineStatusTagProps {
  status?: string | null
}

/** Hiển thị thẻ trạng thái chuẩn cho phiếu phạt theo 4 giá trị enum Backend. */
export const FineStatusTag: React.FC<FineStatusTagProps> = ({ status }) => {
  const { label, variant } = getFineStatusMeta(status)
  return <SpineTag variant={variant}>{label}</SpineTag>
}

