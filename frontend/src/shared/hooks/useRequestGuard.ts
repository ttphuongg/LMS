import { useMemo, useRef } from 'react'

/**
 * Chống race condition khi gọi API liên tiếp: chỉ phản hồi của lần gọi mới nhất
 * mới được phép ghi vào state.
 *
 *   const id = guard.next()
 *   const data = await api()
 *   if (!guard.isLatest(id)) return
 */
export function useRequestGuard() {
  const counter = useRef(0)
  return useMemo(
    () => ({
      next: () => ++counter.current,
      isLatest: (id: number) => id === counter.current,
    }),
    [],
  )
}
