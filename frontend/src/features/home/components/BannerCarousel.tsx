import React, { useState, useEffect, useCallback, useRef } from 'react'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'

interface BannerItem {
  id: number
  src: string
  alt: string
  title?: string
  objectPosition?: string
  objectFit?: 'cover' | 'contain'
}

// 7 ảnh banner thực tế từ thư mục public/banner kèm vị trí hiển thị và chế độ fit tối ưu
const BANNER_ITEMS: BannerItem[] = [
  {
    id: 1,
    src: '/banner/1795011154386_6348592233343472004_6348592233343472004_96e4fb897d7e2bbef3b03234a033e603.jpg',
    alt: 'Hội sách Book Fair - Tìm kiếm cuốn sách tuyệt vời tiếp theo của bạn',
    title: 'Hội sách Book Fair',
    objectPosition: 'center 16%',
  },
  {
    id: 2,
    src: '/banner/1795011154545_6348592233343472004_6348592233343472004_53de8cbb6f14683e2764725ff03ce8a9.jpg',
    alt: 'Câu lạc bộ sách Book Club - Không gian đọc sách và chia sẻ tri thức',
    title: 'Book Club',
    objectPosition: 'center 22%',
  },
  {
    id: 3,
    src: '/banner/1795011154767_6348592233343472004_6348592233343472004_5c60d5c0698e2dc7bb93f9f380bc8896.jpg',
    alt: 'Sự kiện và hoạt động văn hóa đọc tại thư viện LIBRI',
    title: 'Văn hóa đọc LIBRI',
    objectPosition: 'center 15%',
  },
  {
    id: 4,
    src: '/banner/1795011154973_6348592233343472004_6348592233343472004_2b0e97fb68366ba1f72ac870516b2695.jpg',
    alt: 'Góc chia sẻ sách hay và kết nối cộng đồng bạn đọc',
    title: 'Góc bạn đọc',
    objectPosition: 'center 12%',
  },
  {
    id: 5,
    src: '/banner/1795011155189_6348592233343472004_6348592233343472004_d7b271e9b78ac45fc578188a7481ecb7.jpg',
    alt: 'Khám phá thế giới tri thức vô tận cùng thư viện',
    title: 'Khám phá tri thức',
    objectPosition: 'center 26%',
  },
  {
    id: 6,
    src: '/banner/1795011155389_6348592233343472004_6348592233343472004_765b9080f159ba065141d0555dc8fc5c.jpg',
    alt: 'Chương trình giới thiệu sách mới hàng tháng',
    title: 'Sách mới hàng tháng',
    objectPosition: 'center 25%',
  },
  {
    id: 7,
    src: '/banner/1795011155601_6348592233343472004_6348592233343472004_647816128652492a078f6bd354bade78.jpg',
    alt: 'Lan tỏa văn hóa đọc cùng các đầu sách kinh điển',
    title: 'Lan tỏa văn hóa đọc',
    objectPosition: 'center 46%',
  },
]

const AUTOPLAY_INTERVAL = 6000 // 6 giây tự động chuyển ảnh

export const BannerCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === BANNER_ITEMS.length - 1 ? 0 : prev + 1))
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? BANNER_ITEMS.length - 1 : prev - 1))
  }, [])

  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
  }

  // Tự động chuyển ảnh sau mỗi 6s, tạm dừng khi hover hoặc focus
  useEffect(() => {
    if (isPaused || BANNER_ITEMS.length <= 1) return

    const timer = setInterval(() => {
      handleNext()
    }, AUTOPLAY_INTERVAL)

    return () => clearInterval(timer)
  }, [isPaused, handleNext])

  // Hỗ trợ phím mũi tên trái/phải khi focus
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      handlePrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      handleNext()
    }
  }

  // Hỗ trợ vuốt trên thiết bị di động
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
    touchStartX.current = null
  }

  const currentBanner = BANNER_ITEMS[currentIndex]

  return (
    <section
      className="home-banner-carousel"
      aria-label="Banner thông tin sự kiện thư viện"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="home-banner-wrapper">
        <div className="home-banner-image-container">
          <img
            key={currentBanner.id}
            src={currentBanner.src}
            alt={currentBanner.alt}
            className="home-banner-img"
            style={{
              objectFit: currentBanner.objectFit || 'cover',
              objectPosition: currentBanner.objectPosition || 'center',
            }}
            loading="lazy"
          />
        </div>

        {/* Nút điều hướng mũi tên trái */}
        <button
          type="button"
          className="home-banner-nav-btn prev"
          onClick={(e) => {
            e.stopPropagation()
            handlePrev()
          }}
          aria-label="Xem banner trước"
        >
          <LeftOutlined />
        </button>

        {/* Nút điều hướng mũi tên phải */}
        <button
          type="button"
          className="home-banner-nav-btn next"
          onClick={(e) => {
            e.stopPropagation()
            handleNext()
          }}
          aria-label="Xem banner tiếp theo"
        >
          <RightOutlined />
        </button>
      </div>

      {/* Chỉ báo ảnh dạng dấu chấm bên dưới banner */}
      <div className="home-banner-dots" role="tablist" aria-label="Chọn banner">
        {BANNER_ITEMS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`home-banner-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`Chuyển đến banner ${index + 1}: ${item.title || item.alt}`}
          />
        ))}
      </div>
    </section>
  )
}
