import { useEffect, useState } from 'react'

/**
 * Theo dõi kích thước màn hình (mobile < 768px) và tuỳ chọn giảm chuyển động
 * của người dùng, tách biệt nhau.
 */
export function useShelfEnvironment() {
  const [isMobile, setIsMobile] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const checkMode = () => {
      setIsMobile(window.innerWidth < 768)
      setPrefersReducedMotion(motionQuery.matches)
    }

    checkMode()

    window.addEventListener('resize', checkMode)
    motionQuery.addEventListener('change', checkMode)

    return () => {
      window.removeEventListener('resize', checkMode)
      motionQuery.removeEventListener('change', checkMode)
    }
  }, [])

  return { isMobile, prefersReducedMotion }
}
