import { useCallback, useLayoutEffect, useRef } from 'react'

/**
 * Trả về hàm có identity ổn định nhưng luôn gọi phiên bản mới nhất của `fn`
 * (đọc state/props mới nhất tại thời điểm gọi).
 *
 * Dùng cho hàm tải dữ liệu: effect chỉ chạy khi các "trigger" thật sự đổi
 * (trang, bộ lọc...), còn các giá trị khác (vd. từ khoá đang gõ) vẫn được đọc mới nhất.
 */
export function useStableCallback<Args extends unknown[], R>(
  fn: (...args: Args) => R,
): (...args: Args) => R {
  const ref = useRef(fn)
  useLayoutEffect(() => {
    ref.current = fn
  })
  return useCallback((...args: Args) => ref.current(...args), [])
}
