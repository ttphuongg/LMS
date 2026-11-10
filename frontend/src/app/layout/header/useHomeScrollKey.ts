import { useEffect, useState } from 'react'
import { HEADER_HEIGHT } from './constants'

/**
 * Mục menu đang active ở trang chủ của khách, tính theo vị trí cuộn:
 * 'home' | 'about' | 'contact' | null (đang ở khu kệ sách, không thuộc mục nào).
 */
export function useHomeScrollKey(path: string, isAuthenticated: boolean): string | null {
  const [homeKey, setHomeKey] = useState<string | null>('home')

  useEffect(() => {
    if (path !== '/' || isAuthenticated) return
    const compute = () => {
      const line = HEADER_HEIGHT + 80 // vạch đo, hơi thấp hơn header
      const footer = document.getElementById('footer')
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 40
      const footerInView = footer ? footer.getBoundingClientRect().top < window.innerHeight * 0.6 : atBottom
      const intro = document.getElementById('gioi-thieu')?.getBoundingClientRect()

      if (footerInView) setHomeKey('contact')
      else if (intro && intro.top <= line && intro.bottom > line) setHomeKey('about')
      else if (!intro || intro.top > line) setHomeKey('home')
      else setHomeKey(null) // đang ở khu kệ sách, không thuộc mục nào
    }
    compute()
    window.addEventListener('scroll', compute, { passive: true })
    window.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('scroll', compute)
      window.removeEventListener('resize', compute)
    }
  }, [path, isAuthenticated])

  return homeKey
}
