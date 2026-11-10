import React from 'react'
import { motion, MotionValue } from 'motion/react'

interface ParallaxBackgroundProps {
  x: MotionValue<string>
}

export const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({ x }) => {
  return (
    <motion.div
      className="parallax-layer-wall"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '500vw',
        x,
        pointerEvents: 'none',
        zIndex: 1,
        willChange: 'transform',
      }}
      aria-hidden="true"
    >
      <div style={{ display: 'flex', width: '500vw', height: '100%' }}>
        {/* Bay 1 Background Wall: Tall Arched Stained Glass Window with Sunlight Rays */}
        <div className="wall-bay wall-bay-1" style={{ width: '100vw', height: '100%', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none">
            {/* Soft architectural plaster tint */}
            <rect width="1440" height="900" fill="#EAE0C9" opacity="0.6" />
            {/* Library Arched Window */}
            <path
              d="M320,680 L320,260 A180,180 0 0,1 680,260 L680,680 Z"
              fill="#F9F5EC"
              stroke="#B08D3C"
              strokeWidth="5"
              opacity="0.75"
            />
            {/* Window muntins & mullions */}
            <line x1="500" y1="80" x2="500" y2="680" stroke="#B08D3C" strokeWidth="3" opacity="0.6" />
            <line x1="320" y1="260" x2="680" y2="260" stroke="#B08D3C" strokeWidth="3" opacity="0.6" />
            <line x1="320" y1="420" x2="680" y2="420" stroke="#B08D3C" strokeWidth="2" opacity="0.4" />
            <line x1="320" y1="560" x2="680" y2="560" stroke="#B08D3C" strokeWidth="2" opacity="0.4" />

          </svg>
        </div>

        {/* Bay 2 Background Wall: Classical Pilaster Column & Wood Panel Molding */}
        <div className="wall-bay wall-bay-2" style={{ width: '100vw', height: '100%', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none">
            <rect width="1440" height="900" fill="#E8DEC6" opacity="0.65" />
            {/* Classical wall molding panels */}
            <rect x="220" y="140" width="460" height="540" rx="4" stroke="#D1C3A5" strokeWidth="4" fill="none" opacity="0.4" />
            <rect x="240" y="160" width="420" height="500" rx="2" stroke="#B08D3C" strokeWidth="1.5" fill="none" opacity="0.3" />
            <rect x="880" y="140" width="460" height="540" rx="4" stroke="#D1C3A5" strokeWidth="4" fill="none" opacity="0.4" />
            {/* Architectural Column */}
            <rect x="740" y="0" width="80" height="900" fill="#DFCFAة" stroke="#C9B693" strokeWidth="2" opacity="0.35" />
            <line x1="760" y1="0" x2="760" y2="900" stroke="#B08D3C" strokeWidth="1" opacity="0.3" />
            <line x1="800" y1="0" x2="800" y2="900" stroke="#B08D3C" strokeWidth="1" opacity="0.3" />
          </svg>
        </div>

        {/* Bay 3 Background Wall: Twin Archways & Vaulted Ceiling */}
        <div className="wall-bay wall-bay-3" style={{ width: '100vw', height: '100%', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none">
            <rect width="1440" height="900" fill="#EAE0C9" opacity="0.6" />
            {/* Twin Arched Windows */}
            <path d="M260,640 L260,280 A120,120 0 0,1 500,280 L500,640 Z" fill="#F8F3E6" stroke="#C4B392" strokeWidth="3" opacity="0.5" />
            <path d="M600,640 L600,280 A120,120 0 0,1 840,280 L840,640 Z" fill="#F8F3E6" stroke="#C4B392" strokeWidth="3" opacity="0.5" />

          </svg>
        </div>

        {/* Bay 4 Background Wall: Decorative Brickwork & High Vault */}
        <div className="wall-bay wall-bay-4" style={{ width: '100vw', height: '100%', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none">
            <rect width="1440" height="900" fill="#E5DAC0" opacity="0.6" />
            {/* Subtle vintage brick grid lines */}
            <pattern id="brick-pat" width="60" height="24" patternUnits="userSpaceOnUse">
              <path d="M0,24 L60,24 M30,0 L30,24" stroke="#D1C19F" strokeWidth="0.8" opacity="0.25" />
            </pattern>
            <rect x="180" y="100" width="1080" height="600" fill="url(#brick-pat)" />
          </svg>
        </div>

        {/* Bay 5 Background Wall: Central Grand Library Arch & Clock */}
        <div className="wall-bay wall-bay-5" style={{ width: '100vw', height: '100%', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none">
            <rect width="1440" height="900" fill="#EAE0C9" opacity="0.65" />
            {/* Large Grand Central Arch */}
            <path d="M420,700 L420,280 A300,300 0 0,1 1020,280 L1020,700 Z" stroke="#B08D3C" strokeWidth="5" fill="#F9F6ED" opacity="0.6" />
            {/* Library Antique Roman Numerals Clock Silhouette */}
            <circle cx="720" cy="220" r="60" stroke="#1F3A2E" strokeWidth="4" fill="#FBF7EC" opacity="0.85" />
            <circle cx="720" cy="220" r="52" stroke="#B08D3C" strokeWidth="1" fill="none" opacity="0.7" />
            <line x1="720" y1="220" x2="720" y2="185" stroke="#2A2118" strokeWidth="3" strokeLinecap="round" />
            <line x1="720" y1="220" x2="746" y2="228" stroke="#2A2118" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </motion.div>
  )
}
