import React, { useRef, useState } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
} from 'motion/react'

import { ParallaxBackground } from './ParallaxBackground'
import { ParallaxForeground } from './ParallaxForeground'
import { ShelfRulerNav } from './ShelfRulerNav'
import { ClassificationHeadings } from './shelf/ClassificationHeadings'
import { useShelfEnvironment } from './shelf/useShelfEnvironment'
import { BAYS, LAST_BAY_INDEX } from './shelf/bays'

export const HorizontalBookshelf: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  const [currentBayIndex, setCurrentBayIndex] = useState(0)
  const [isRulerVisible, setIsRulerVisible] = useState(false)
  const { isMobile, prefersReducedMotion } = useShelfEnvironment()

  // Track vertical scrolling through the five horizontal bays.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  })

  // Parallax layer movement.
  const trackX = useTransform(smoothProgress, [0, 1], ['0vw', '-400vw'])
  const wallX = useTransform(smoothProgress, [0, 1], ['0vw', '-140vw'])
  const headingX = useTransform(smoothProgress, [0, 1], ['0vw', '-340vw'])
  const foregroundX = useTransform(smoothProgress, [0, 1], ['0vw', '-560vw'])

  // Update active bay and ruler visibility.
  useMotionValueEvent(smoothProgress, 'change', (val) => {
    const nextIdx = Math.min(LAST_BAY_INDEX, Math.max(0, Math.round(val * 4)))

    setCurrentBayIndex((prev) => (prev !== nextIdx ? nextIdx : prev))

    setIsRulerVisible(val > 0.01 && val < 0.99)
  })

  // Scroll to a specific bay.
  const scrollToBay = (index: number) => {
    if (!containerRef.current) return

    const containerTop = containerRef.current.getBoundingClientRect().top + window.scrollY

    const totalDistance = containerRef.current.offsetHeight - window.innerHeight

    const targetY = containerTop + (index / 4) * totalDistance

    window.scrollTo({
      top: targetY,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  // Keep keyboard focus from unexpectedly triggering scrolling
  // when reduced motion is enabled.
  const handleBayFocus = (index: number) => {
    if (!prefersReducedMotion) {
      scrollToBay(index)
    }
  }

  // Mobile layout: vertically stacked bays.
  // Desktop keeps the horizontal parallax layout.
  if (isMobile) {
    return (
      <div id="shelf-track" className="shelf-mobile-vertical-stack">
        {BAYS.map((Bay, index) => (
          <div key={index} className="mobile-bay-item" onFocus={() => handleBayFocus(index)}>
            <Bay />
          </div>
        ))}
      </div>
    )
  }

  // Desktop: pinned horizontal bookshelf with parallax.
  // Reduced-motion preference does not remove the layout.
  return (
    <div
      id="shelf-track"
      ref={containerRef}
      className="horizontal-shelf-section-outer"
      style={{
        position: 'relative',
        height: '500vh',
        width: '100%',
        background: '#F3ECDC',
      }}
    >
      <div
        className="horizontal-shelf-sticky-stage"
        style={{
          position: 'sticky',
          top: 64,
          left: 0,
          width: '100%',
          height: 'calc(100vh - 64px)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* Layer 1: Background wall */}
        <ParallaxBackground x={wallX} />

        {/* Layer 2: Classification headings */}
        <ClassificationHeadings x={headingX} />

        {/* Layer 3: Main bookshelf track */}
        <motion.div
          className="horizontal-shelf-track"
          style={{
            display: 'flex',
            width: '500vw',
            height: '100%',
            x: trackX,
            position: 'relative',
            zIndex: 10,
            willChange: 'transform',
          }}
        >
          {BAYS.map((Bay, index) => (
            <div
              key={index}
              className={`shelf-bay-wrapper bay-wrapper-${index + 1}`}
              style={{
                width: '100vw',
                height: '100%',
                flexShrink: 0,
              }}
              onFocusCapture={() => handleBayFocus(index)}
            >
              <Bay />
            </div>
          ))}
        </motion.div>

        {/* Layer 4: Foreground elements */}
        <ParallaxForeground x={foregroundX} />

        {/* Fixed bottom ruler navigation */}
        <ShelfRulerNav
          currentBayIndex={currentBayIndex}
          onSelectBay={scrollToBay}
          visible={isRulerVisible}
        />
      </div>
    </div>
  )
}
