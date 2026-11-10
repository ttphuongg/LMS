import React from 'react'

interface BookDescriptionProps {
  description?: string | null
}

/**
 * Định dạng và hiển thị phần tóm tắt nội dung sách kèm khối thông tin chi tiết (nếu có).
 * Hỗ trợ tách đoạn theo xuống dòng, danh sách gạch đầu dòng (•) và trích xuất bảng thông số xuất bản.
 */
export const BookDescription: React.FC<BookDescriptionProps> = ({ description }) => {
  if (!description || !description.trim()) {
    return (
      <p style={{ color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
        Chưa có thông tin mô tả chi tiết cho đầu sách này trong mục lục.
      </p>
    )
  }

  const markerMatch = description.match(/Thông tin chi tiết\s*:/i)
  const summaryRaw = markerMatch && markerMatch.index !== undefined
    ? description.slice(0, markerMatch.index).trim()
    : description.trim()
  const detailsRaw = markerMatch && markerMatch.index !== undefined
    ? description.slice(markerMatch.index + markerMatch[0].length).trim()
    : ''

  const summaryBlocks = summaryRaw
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  const detailItems = detailsRaw
    ? detailsRaw
        .split(/\r?\n+|(?=\s*•\s+)/)
        .map((line) => line.replace(/^[•\-*]\s*/, '').trim())
        .filter(Boolean)
        .map((line) => {
          const colonIdx = line.indexOf(':')
          if (colonIdx > 0 && colonIdx < 45) {
            return {
              label: line.slice(0, colonIdx).trim(),
              value: line.slice(colonIdx + 1).trim(),
            }
          }
          return { label: '', value: line }
        })
    : []

  return (
    <div>
      {summaryBlocks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {summaryBlocks.map((block, idx) => {
            const isBullet = /^[•\-*]\s+/.test(block)
            if (isBullet) {
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--sp-2)',
                    paddingLeft: 'var(--sp-2)',
                    color: 'var(--muted-foreground)',
                    fontSize: 14,
                    lineHeight: 1.75,
                    textAlign: 'justify',
                  }}
                >
                  <span style={{ color: 'var(--primary)', fontWeight: 700, lineHeight: 1.6 }}>•</span>
                  <span>{block.replace(/^[•\-*]\s+/, '')}</span>
                </div>
              )
            }

            return (
              <p
                key={idx}
                style={{
                  color: 'var(--muted-foreground)',
                  fontSize: 14,
                  lineHeight: 1.75,
                  textAlign: 'justify',
                  margin: 0,
                }}
              >
                {block}
              </p>
            )
          })}
        </div>
      )}

      {detailItems.length > 0 && (
        <div
          style={{
            marginTop: 'var(--sp-5)',
            padding: 'var(--sp-3) var(--sp-4)',
            background: 'var(--muted)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--foreground)',
              marginBottom: 'var(--sp-2)',
            }}
          >
            Thông tin chi tiết
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '6px var(--sp-4)',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {detailItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
                {item.label ? (
                  <span>
                    <span style={{ color: 'var(--muted-foreground)' }}>{item.label}: </span>
                    <strong style={{ color: 'var(--foreground)', fontWeight: 600 }}>{item.value}</strong>
                  </span>
                ) : (
                  <span style={{ color: 'var(--foreground)' }}>{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
