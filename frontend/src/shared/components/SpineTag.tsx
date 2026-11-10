import React from 'react'

export interface SpineTagProps {
  children: React.ReactNode
  variant?: 'primary' | 'warning' | 'danger' | 'neutral'
  className?: string
  title?: string
}

export const SpineTag: React.FC<SpineTagProps> = ({
  children,
  variant = 'primary',
  className = '',
  title,
}) => {
  const variantClass =
    variant === 'warning'
      ? 'warning'
      : variant === 'danger'
      ? 'danger'
      : variant === 'neutral'
      ? 'neutral'
      : ''

  return (
    <span
      className={`spine-label ${variantClass} ${className}`}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        letterSpacing: '0.04em',
        userSelect: 'none',
      }}
    >
      {children}
    </span>
  )
}
