import React from 'react'

export interface BookSpineProps {
  height?: number
  width?: number
  color?: string
  accentColor?: string
  title?: string
  callNumber?: string
  tilt?: number
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

const PALETTE = [
  { bg: '#1F3A2E', accent: '#B08D3C', text: '#FBF7EC' }, // Xanh chai + đồng thau
  { bg: '#7A2E2B', accent: '#DECFAA', text: '#FBF7EC' }, // Đỏ rượu + giấy ngà
  { bg: '#3B2A1E', accent: '#B08D3C', text: '#DECFAA' }, // Gỗ sẫm + chỉ vàng
  { bg: '#2A2118', accent: '#8A8174', text: '#F3ECDC' }, // Mực đen cổ điển
  { bg: '#4A3B2C', accent: '#DECFAA', text: '#FBF7EC' }, // Da bò cổ
  { bg: '#23392F', accent: '#DECFAA', text: '#FBF7EC' }, // Xanh rêu
  { bg: '#5C2422', accent: '#B08D3C', text: '#FBF7EC' }, // Đỏ gạch nung
  { bg: '#8A8174', accent: '#2A2118', text: '#FBF7EC' }, // Xám đá thư viện
]

export const BookSpineSvg: React.FC<BookSpineProps> = ({
  height = 240,
  width = 34,
  color,
  accentColor,
  title = 'DDC',
  callNumber = '000.1',
  tilt = 0,
  className = '',
  onClick,
  style = {},
}) => {
  // Hash title to choose consistent variation from palette if not provided
  const hash = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const theme = PALETTE[hash % PALETTE.length]
  const baseColor = color || theme.bg
  const gold = accentColor || theme.accent
  const textColor = theme.text
  const gradId = `spineShine-${Math.abs(hash)}-${width}-${height}`

  return (
    <div
      className={`book-spine-item ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        transformOrigin: 'bottom center',
        transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
      aria-label={`Gáy sách: ${title}`}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.06" />
            <stop offset="18%" stopColor="#fff" stopOpacity="0.06" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="75%" stopColor="#000" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Base Book Spine Body */}
        <rect
          x="1"
          y="2"
          width={width - 2}
          height={height - 2}
          rx="2"
          fill={baseColor}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="1"
        />

        {/* 3D Spine Curvature Highlight Overlay */}
        <rect
          x="1"
          y="2"
          width={width - 2}
          height={height - 2}
          rx="2"
          fill={`url(#${gradId})`}
          pointerEvents="none"
        />

        {/* Embossed Decorative Top & Bottom Bands */}
        <line x1="3" y1="16" x2={width - 3} y2="16" stroke={gold} strokeWidth="1.5" strokeOpacity="0.85" />
        <line x1="3" y1="20" x2={width - 3} y2="20" stroke={gold} strokeWidth="0.8" strokeOpacity="0.6" />

        <line x1="3" y1={height - 44} x2={width - 3} y2={height - 44} stroke={gold} strokeWidth="0.8" strokeOpacity="0.6" />
        <line x1="3" y1={height - 40} x2={width - 3} y2={height - 40} stroke={gold} strokeWidth="1.5" strokeOpacity="0.85" />

        {/* Spine Call Number Label Plate */}
        <rect
          x="4"
          y={height - 34}
          width={width - 8}
          height="22"
          rx="1"
          fill="#FBF7EC"
          stroke={gold}
          strokeWidth="0.8"
        />
        <text
          x={width / 2}
          y={height - 20}
          textAnchor="middle"
          fill="#2A2118"
          fontSize={Math.min(9, width * 0.28)}
          fontWeight="700"
          fontFamily="'Be Vietnam Pro', sans-serif"
          letterSpacing="0.02em"
        >
          {callNumber.slice(0, 7)}
        </text>

        {/* Spine Title (Vertical or Abbreviated) */}
        {width >= 24 && height >= 140 && (
          <g transform={`translate(${width / 2 + 3}, 38) rotate(90)`}>
            <text
              x="0"
              y="0"
              fill={textColor}
              fontSize={Math.min(10, width * 0.32)}
              fontWeight="600"
              fontFamily="'Playfair Display', Georgia, serif"
              letterSpacing="0.04em"
              opacity="0.9"
            >
              {title.length > 22 ? `${title.slice(0, 20)}…` : title}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

/** Predefined row of random authentic decorative books for filling empty shelf space */
export const ShelfBookCluster: React.FC<{ count?: number; startTilt?: number }> = ({ count = 8, startTilt = 0 }) => {
  const booksData = [
    { height: 260, width: 34, title: 'Bách Khoa Thư', callNumber: '030.1', color: '#1F3A2E' },
    { height: 230, width: 28, title: 'Lịch Sử Văn Minh', callNumber: '909.2', color: '#7A2E2B' },
    { height: 245, width: 38, title: 'Nhập Môn Triết Học', callNumber: '100.4', color: '#3B2A1E' },
    { height: 275, width: 32, title: 'Toán Học Đại Cương', callNumber: '510.5', color: '#2A2118' },
    { height: 220, width: 26, title: 'Vật Lý Hiện Đại', callNumber: '530.8', color: '#4A3B2C' },
    { height: 255, width: 36, title: 'Thiết Kế Hệ Thống', callNumber: '004.2', color: '#1F3A2E' },
    { height: 240, width: 30, title: 'Ngữ Học Khảo Luận', callNumber: '400.1', color: '#8A8174' },
    { height: 265, width: 42, title: 'Kinh Tế Vi Mô', callNumber: '330.0', color: '#5C2422' },
    { height: 235, width: 28, title: 'Hội Họa & Điêu Khắc', callNumber: '700.3', color: '#3B2A1E' },
    { height: 250, width: 34, title: 'Văn Học Cổ Điển', callNumber: '800.9', color: '#7A2E2B' },
  ]

  const items = booksData.slice(0, count)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
      {items.map((b, i) => (
        <BookSpineSvg
          key={i}
          height={b.height}
          width={b.width}
          title={b.title}
          callNumber={b.callNumber}
          color={b.color}
          tilt={i === 0 && startTilt ? startTilt : 0}
        />
      ))}
    </div>
  )
}
