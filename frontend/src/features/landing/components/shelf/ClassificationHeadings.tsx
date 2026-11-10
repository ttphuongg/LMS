import React from 'react'
import { motion } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { BAY_CLASS_CODES } from './bays'

/** Layer 2: các số phân loại lớn, mờ, trượt theo parallax phía sau kệ. */
export const ClassificationHeadings: React.FC<{ x: MotionValue<string> }> = ({ x }) => (
  <motion.div
    className="parallax-layer-headings"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '500vw',
      x,
      pointerEvents: 'none',
      zIndex: 3,
      willChange: 'transform',
    }}
    aria-hidden="true"
  >
    <div
      style={{
        display: 'flex',
        width: '500vw',
        height: '100%',
      }}
    >
      {BAY_CLASS_CODES.map((code, idx) => (
        <div
          key={idx}
          style={{
            width: '100vw',
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            padding: '8vh 8vw 0 0',
            boxSizing: 'border-box',
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(5rem, 14vw, 15rem)',
              fontWeight: 700,
              color: 'rgba(176, 141, 60, 0.12)',
              lineHeight: 0.8,
              userSelect: 'none',
            }}
          >
            {code}
          </span>
        </div>
      ))}
    </div>
  </motion.div>
)
