import React from 'react'
import { Breadcrumb } from 'antd'

interface BreadcrumbItem {
  title: React.ReactNode
  href?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  extra?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  extra,
  breadcrumbs,
}) => {
  return (
    <div
      style={{
        marginBottom: 'var(--sp-6)',
        paddingBottom: 'var(--sp-4)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          items={breadcrumbs.map((b) => ({
            title: b.href ? <a href={b.href}>{b.title}</a> : b.title,
          }))}
          style={{ marginBottom: 'var(--sp-3)', fontSize: 'var(--text-sm)' }}
        />
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--sp-3)',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--text-2xl)',
              margin: 0,
              color: 'var(--foreground)',
              fontWeight: 600,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ margin: 'var(--sp-1) 0 0', color: 'var(--muted-foreground)', fontSize: 'var(--text-base)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {extra && <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>{extra}</div>}
      </div>
    </div>
  )
}
