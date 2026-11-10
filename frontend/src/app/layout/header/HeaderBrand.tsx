import React from 'react'
import { BRAND } from '@/shared/constants/brand'

export const HeaderBrand: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      cursor: 'pointer',
      userSelect: 'none',
      flexShrink: 0,
      overflow: 'visible',
    }}
  >
    <img
      src={BRAND.logo}
      alt={BRAND.name}
      className="library-brand-logo"
      style={{
        width: 42,
        height: 42,
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
        transition: 'width 0.2s ease, height 0.2s ease',
      }}
    />
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'visible' }}>
      <span
        className="library-brand-title"
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 18,
          fontWeight: 700,
          color: '#FBF7EC',
          letterSpacing: '0.02em',
          display: 'block',
          lineHeight: 1.3,
          overflow: 'visible',
          whiteSpace: 'nowrap',
        }}
      >
        {BRAND.uppercaseName}
      </span>
      <span
        className="library-brand-subtitle"
        style={{ fontSize: 10, color: '#B08D3C', letterSpacing: '0.08em', lineHeight: 1.2, whiteSpace: 'nowrap' }}
      >
        {BRAND.subtitle}
      </span>
    </div>
  </div>
)
