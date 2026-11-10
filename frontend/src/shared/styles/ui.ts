import type { CSSProperties } from 'react'

/**
 * Các style inline dùng lặp lại ở nhiều trang (theo design token trong index.css).
 * Gom về một chỗ để đổi giao diện không phải sửa từng file.
 */

/** Bo góc chuẩn cho Button/Input/Card... */
export const radiusStyle: CSSProperties = { borderRadius: 'var(--radius)' }

/** Nút chính (type="primary") theo tông Xanh chai. */
export const primaryButtonStyle: CSSProperties = {
  background: 'var(--primary)',
  borderColor: 'var(--primary)',
  borderRadius: 'var(--radius)',
}

/** Nút viền (outline) màu chủ đạo. */
export const outlineButtonStyle: CSSProperties = {
  borderColor: 'var(--border-strong)',
  color: 'var(--primary)',
  borderRadius: 'var(--radius)',
}

/** Tiêu đề serif trong Modal. */
export const modalTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: 18,
  color: 'var(--primary)',
}

/** Chữ phụ (xám). */
export const mutedTextStyle: CSSProperties = { color: 'var(--muted-foreground)' }
export const mutedText12Style: CSSProperties = { fontSize: 12, color: 'var(--muted-foreground)' }
export const mutedText13Style: CSSProperties = { fontSize: 13, color: 'var(--muted-foreground)' }

/** Chữ nhấn (đậm). */
export const strongTextStyle: CSSProperties = { fontWeight: 600, color: 'var(--foreground)' }

/** Font mono cho mã số. */
export const monoStyle: CSSProperties = { fontFamily: 'var(--font-mono)' }

/** Nền thẻ (Card) kiểu "thẻ mục lục". */
export const cardStyle: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
}

/** Thẻ (Tag) nền xanh chai, chữ sáng, không viền. */
export const primaryTagStyle: CSSProperties = {
  background: 'var(--primary)',
  color: 'var(--primary-foreground)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
}
