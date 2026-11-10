import { useEffect, useState } from 'react'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { useStableCallback } from './useStableCallback'

/**
 * Tải dữ liệu một lần khi component mount và cho phép tải lại (`reload`).
 *
 * - `loading` bắt đầu là `true`, được bật lại mỗi lần `reload`.
 * - Nếu truyền `errorMessage`: lỗi được báo bằng `message.error(errorMessage)`.
 *   Nếu không truyền: lỗi được ném tiếp ra ngoài (giống try/finally thuần).
 * - `setData` cho phép cập nhật cục bộ (vd. xoá/đánh dấu một dòng) mà không tải lại.
 */
export function useLoadOnMount<T>(fetcher: () => Promise<T>, initial: T, errorMessage?: string) {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)

  const reload = useStableCallback(async () => {
    try {
      setLoading(true)
      setData(await fetcher())
    } catch (err) {
      if (errorMessage === undefined) throw err
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    reload()
  }, [reload])

  return { data, setData, loading, reload }
}
