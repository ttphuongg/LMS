import React, { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/** Cuộn lên đầu trang khi chuyển sang route mới.
 *  - Chỉ chạy khi pathname đổi (đổi query ?q=... không bị kéo lên đầu).
 *  - Bỏ qua nút Back/Forward (POP) để trình duyệt tự khôi phục vị trí cuộn cũ. */
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    if (navType === 'POP') return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, navType])

  return null
}
