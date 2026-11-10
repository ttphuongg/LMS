import { useEffect } from 'react'

const HEADER_HEIGHT = 64 // Header sticky cao 64px
const SETTLE_MS = 140 // Thời gian không cuộn để coi là đã dừng
const TOLERANCE = 2 // Sai số px, coi như đã khít

/**
 * Khi người dùng ngừng cuộn trong khoảng Hero -> Giới thiệu -> đầu Kệ sách,
 * tự trượt mượt về mốc gần nhất để section khít ngay dưới thanh nav.
 * Từ khu kệ sách trở đi (cuộn ngang) và trên mobile thì không can thiệp.
 */
export function useSectionSnap(sectionIds: string[]) {
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer: number | undefined

    const getPoints = () => {
      const points = [0]
      sectionIds.forEach((id) => {
        const el = document.getElementById(id)
        if (el) {
          points.push(el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT)
        }
      })
      return points.sort((a, b) => a - b)
    }

    const snap = () => {
      if (window.innerWidth < 768 || motionQuery.matches) return

      const points = getPoints()
      const y = window.scrollY
      const last = points[points.length - 1]

      // Ngoài vùng snap (đã vào kệ sách hoặc xuống footer): không can thiệp
      if (y < 0 || y > last + TOLERANCE) return

      let nearest = points[0]
      for (const pt of points) {
        if (Math.abs(pt - y) < Math.abs(nearest - y)) nearest = pt
      }

      if (Math.abs(nearest - y) > TOLERANCE) {
        window.scrollTo({ top: nearest, behavior: 'smooth' })
      }
    }

    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(snap, SETTLE_MS)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
    }
  }, [sectionIds])
}
