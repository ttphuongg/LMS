import React from 'react'
import '../landing.css'
import { HeroSection } from '../components/HeroSection'
import { IntroSection } from '../components/IntroSection'
import { HorizontalBookshelf } from '../components/HorizontalBookshelf'
import { useSectionSnap } from '../hooks/useSectionSnap'

// Các mốc dừng sau hero: giới thiệu, rồi đầu khu kệ sách
const SNAP_SECTIONS = ['gioi-thieu', 'shelf-track']

export const LandingPage: React.FC = () => {
  useSectionSnap(SNAP_SECTIONS)

  return (
    <div
      className="landing-page-wrapper"
      style={{
        width: '100%',
        overflow: 'visible',
        position: 'relative',
        background: 'var(--background)',
      }}
    >
      {/* 1. HERO (100vh) */}
      <HeroSection />

      {/* 2. GIỚI THIỆU (nút "Giới thiệu" trên nav trỏ tới #gioi-thieu) */}
      <IntroSection />

      {/* 3. VÙNG ĐI NGANG: Walking Along Library Bookshelves (500vh stage, sticky 100vh viewport) */}
      <HorizontalBookshelf />
    </div>
  )
}