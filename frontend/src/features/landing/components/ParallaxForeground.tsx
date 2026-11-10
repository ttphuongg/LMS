import React from 'react'
import { motion, MotionValue } from 'motion/react'

interface ParallaxForegroundProps {
  x: MotionValue<string>
}

export const ParallaxForeground: React.FC<ParallaxForegroundProps> = ({ x }) => {
  return (
    <motion.div
      className="parallax-layer-foreground"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '500vw',
        x,
        pointerEvents: 'none',
        zIndex: 20,
        willChange: 'transform',
        filter: 'blur(1.2px) contrast(1.1)',
      }}
      aria-hidden="true"
    >
      <div style={{ position: 'relative', width: '500vw', height: '100%' }}>
        {/* Item 1: Classic Library Rolling Ladder (between Bay 1 & Bay 2 ~ 95vw) */}
        <div
          style={{
            position: 'absolute',
            left: '92vw',
            bottom: '10vh',
            width: '140px',
            height: '680px',
          }}
        >
          <svg width="140" height="680" viewBox="0 0 140 680" fill="none">
            {/* Top Hook Wheels on brass brass rail */}
            <circle cx="28" cy="18" r="14" fill="#B08D3C" stroke="#2A2118" strokeWidth="2.5" />
            <circle cx="112" cy="18" r="14" fill="#B08D3C" stroke="#2A2118" strokeWidth="2.5" />
            <rect x="0" y="16" width="140" height="4" fill="#B08D3C" />

            {/* Ladder Stems (Dark Oak Wood) */}
            <rect x="22" y="24" width="12" height="630" rx="3" fill="#24180F" stroke="#120A05" strokeWidth="2" />
            <rect x="106" y="24" width="12" height="630" rx="3" fill="#24180F" stroke="#120A05" strokeWidth="2" />

            {/* Ladder Rungs */}
            {[70, 120, 170, 220, 270, 320, 370, 420, 470, 520, 570, 620].map((y) => (
              <g key={y}>
                <rect x="22" y={y} width="96" height="8" rx="2" fill="#2E2015" stroke="#120A05" strokeWidth="1" />
                <circle cx="28" cy={y + 4} r="2" fill="#B08D3C" />
                <circle cx="112" cy={y + 4} r="2" fill="#B08D3C" />
              </g>
            ))}

            {/* Bottom Caster Wheels */}
            <circle cx="28" cy="660" r="12" fill="#B08D3C" stroke="#120A05" strokeWidth="2" />
            <circle cx="112" cy="660" r="12" fill="#B08D3C" stroke="#120A05" strokeWidth="2" />
          </svg>
        </div>


        {/* Item 3: Tall Brass Floor Reading Lamp (between Bay 3 & Bay 4 ~ 292vw) */}
        <div
          style={{
            position: 'absolute',
            left: '290vw',
            bottom: '10vh',
            width: '180px',
            height: '640px',
          }}
        >
          <svg width="180" height="640" viewBox="0 0 180 640" fill="none">
            {/* Round Weighted Base */}
            <ellipse cx="90" cy="625" rx="50" ry="12" fill="#7D6124" stroke="#332408" strokeWidth="2.5" />
            <ellipse cx="90" cy="620" rx="35" ry="8" fill="#B08D3C" stroke="#332408" strokeWidth="1.5" />

            {/* Lamp Stem */}
            <rect x="87" y="160" width="6" height="460" fill="#99772C" stroke="#332408" strokeWidth="1" />

            {/* Goose Neck Curve */}
            <path
              d="M90,160 Q90,90 140,80"
              fill="none"
              stroke="#B08D3C"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Classic Banker Green Shade */}
            <path
              d="M110,80 L165,80 L175,115 L100,115 Z"
              fill="#183626"
              stroke="#0E2217"
              strokeWidth="3"
            />
            {/* Shade Brass Rim */}
            <line x1="98" y1="115" x2="177" y2="115" stroke="#B08D3C" strokeWidth="3" />
          </svg>
        </div>

        {/* Item 4: Classical Antique Desk Globus on Brass Stand (between Bay 4 & Bay 5 ~ 392vw) */}
        <div
          style={{
            position: 'absolute',
            left: '390vw',
            bottom: '12vh',
            width: '160px',
            height: '380px',
          }}
        >
          <svg width="160" height="380" viewBox="0 0 160 380" fill="none">
            {/* Wooden Base */}
            <ellipse cx="80" cy="365" rx="44" ry="12" fill="#24170E" stroke="#120A05" strokeWidth="2" />
            <rect x="76" y="270" width="8" height="95" fill="#B08D3C" stroke="#3A2805" strokeWidth="1.5" />

            {/* Brass Meridian Ring */}
            <circle cx="80" cy="180" r="70" fill="none" stroke="#B08D3C" strokeWidth="5" />

            {/* Earth Globe Sphere */}
            <circle cx="80" cy="180" r="62" fill="#D9C9A3" stroke="#2A2118" strokeWidth="1.5" />
            {/* Continent silhouetted bands */}
            <path d="M40,165 Q70,140 100,160 Q130,170 140,195 Q100,210 60,190 Z" fill="#2E4A3B" opacity="0.85" />
            <path d="M50,195 Q80,225 110,215 Q125,230 115,240 Q75,235 50,195 Z" fill="#2E4A3B" opacity="0.85" />
            {/* Axis pin */}
            <line x1="38" y1="120" x2="122" y2="240" stroke="#7A5C1F" strokeWidth="2.5" />
          </svg>
        </div>
      </div>
    </motion.div>
  )
}
