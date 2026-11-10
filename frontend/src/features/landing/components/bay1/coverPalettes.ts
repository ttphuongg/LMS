export interface CoverPalette {
  bg: string
  gold: string
  pattern: string
}

/** Góc nghiêng mặc định của từng cuốn sách trên kệ (độ). */
export const DEFAULT_TILTS = [-4, 3, -6, 2, -3, 4]

/** Bảng màu bìa, dùng xoay vòng theo thứ tự sách. */
export const COVER_PALETTES: CoverPalette[] = [
  { bg: '#1F3A2E', gold: '#B08D3C', pattern: 'circle' },
  { bg: '#7A2E2B', gold: '#DECFAA', pattern: 'stripe' },
  { bg: '#3B2A1E', gold: '#B08D3C', pattern: 'grid' },
  { bg: '#2A2118', gold: '#B08D3C', pattern: 'arch' },
  { bg: '#4A3B2C', gold: '#DECFAA', pattern: 'circle' },
  { bg: '#23392F', gold: '#B08D3C', pattern: 'stripe' },
]
