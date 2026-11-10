import React from 'react'

interface ShelfRulerNavProps {
  currentBayIndex: number
  onSelectBay: (index: number) => void
  visible: boolean
}

const BAYS = [
  { label: 'Tra cứu', index: 0 },
  { label: 'Đặt trước', index: 1 },
  { label: 'Mượn & Gia hạn', index: 2 },
  { label: 'Biểu phí & Phạt', index: 3 },
  { label: 'Quầy thủ thư', index: 4 },
]

export const ShelfRulerNav: React.FC<ShelfRulerNavProps> = ({ currentBayIndex, onSelectBay, visible }) => {
  if (!visible) return null

  return (
    <nav
      className="shelf-ddc-ruler-nav"
      aria-label="Thước điều hướng phân loại DDC"
      style={{
        position: 'fixed',
        bottom: 'var(--sp-5)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        /* Nền xanh ngọc bảo thẫm với độ trong suốt 82% */
        background: 'rgba(15, 35, 26, 0.82)',
        /* Hiệu ứng kính mờ Glassmorphism mạnh (16px) */
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        /* Viền sáng mỏng màu ngọc nhạt */
        border: '1px solid rgba(163, 194, 178, 0.25)',
        boxShadow: '0 8px 32px rgba(10, 25, 18, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Nhãn DDC Ruler */}
      <div
        style={{
          fontSize: 10,
          color: '#B08D3C',
          fontWeight: 700,
          letterSpacing: '0.1em',
          marginRight: '4px',
          paddingLeft: '6px',
          fontFamily: "'Playfair Display', Georgia, serif",
          borderRight: '1px solid rgba(163, 194, 178, 0.2)',
          paddingRight: '10px',
        }}
      >
        DDC RULER
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {BAYS.map((bay) => {
          const isActive = currentBayIndex === bay.index

          return (
            <button
              key={bay.index}
              type="button"
              onClick={() => onSelectBay(bay.index)}
              className={`ruler-bay-btn ${isActive ? 'active' : ''}`}
              style={{
                /* Nút active nổi bật hẳn với màu giấy ngà #FBF7EC và viền đồng */
                background: isActive ? '#FBF7EC' : 'transparent',
                color: isActive ? '#1F3A2E' : '#A3C2B2',
                border: '1px solid',
                borderColor: isActive ? '#B08D3C' : 'transparent',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: isActive ? '0 4px 12px rgba(0, 0, 0, 0.25)' : 'none',
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
              aria-label={`Chuyển đến khoang ${bay.label}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="ruler-bay-label" style={{ fontSize: 11 }}>
                {bay.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}