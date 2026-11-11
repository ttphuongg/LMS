import React from 'react'

export interface CatalogCodeProps {
  code: string
  label?: string
  className?: string
}

export const CatalogCode: React.FC<CatalogCodeProps> = ({ code, label, className = '' }) => {
  return (
    <span
      className={`catalog-call-number ${className}`}
      title={label ? `${label}: ${code}` : code}
    >
      {label ? `${label}: ` : ''}
      {code}
    </span>
  )
}
