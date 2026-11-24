import Fuse from 'fuse.js'
import type { BookDto } from '../types'

/**
 * Chuẩn hóa chuỗi: bỏ dấu tiếng Việt, chuyển chữ thường, loại bỏ ký tự phân tách
 * để so sánh tên sách chính xác tuyệt đối.
 */
export const normalizeForCompare = (str?: string | null): string => {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-\s_.,:;()]+/g, ' ')
    .trim()
}

/**
 * Chuẩn hóa mã ISBN: loại bỏ dấu gạch ngang và khoảng trắng.
 */
export const normalizeIsbn = (str?: string | null): string => {
  if (!str) return ''
  return str.replace(/[-\s]/g, '').toLowerCase()
}

/**
 * Khởi tạo chỉ mục Fuse.js với các trọng số trường tối ưu cho sách thư viện.
 */
export const createBookFuse = (books: BookDto[]): Fuse<BookDto> => {
  return new Fuse(books, {
    keys: [
      { name: 'title', weight: 0.45 },
      { name: 'authorName', weight: 0.25 },
      { name: 'authors', weight: 0.2 },
      { name: 'isbn', weight: 0.15 },
      { name: 'categoryName', weight: 0.1 },
      { name: 'publisher', weight: 0.1 },
      { name: 'description', weight: 0.05 },
    ],
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  })
}

/**
 * Thuật toán tìm kiếm phân tầng:
 * 1. Khớp tuyệt đối ISBN (nếu đúng ISBN -> chỉ hiển thị 1 cuốn đó)
 * 2. Khớp tuyệt đối Tên sách (nếu nhập đầy đủ tên -> chỉ hiển thị cuốn đó)
 * 3. Tìm mờ Fuse.js (kèm bộ lọc Score Gap loại bỏ kết quả nhiễu)
 */
export const filterBooksByKeyword = (
  books: BookDto[],
  fuse: Fuse<BookDto>,
  keyword: string
): BookDto[] => {
  const trimmed = keyword.trim()
  if (!trimmed) return books

  const cleanIsbnQuery = normalizeIsbn(trimmed)
  const normQuery = normalizeForCompare(trimmed)

  // ƯU TIÊN 1: Khớp chính xác mã ISBN
  const exactIsbnMatches = books.filter(
    (b) => b.isbn && normalizeIsbn(b.isbn) === cleanIsbnQuery
  )
  if (exactIsbnMatches.length > 0) {
    return exactIsbnMatches
  }

  // ƯU TIÊN 2: Khớp chính xác toàn bộ tên sách
  const exactTitleMatches = books.filter(
    (b) => normalizeForCompare(b.title) === normQuery
  )
  if (exactTitleMatches.length > 0) {
    return exactTitleMatches
  }

  // Khi gõ 1 ký tự: tìm kiếm chuỗi con đơn giản
  if (trimmed.length === 1) {
    const lower = trimmed.toLowerCase()
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(lower) ||
        b.authorName.toLowerCase().includes(lower) ||
        b.isbn.toLowerCase().includes(lower)
    )
  }

  // ƯU TIÊN 3: Fuse.js kèm bộ lọc Score Gap
  const searchResults = fuse.search(trimmed)
  if (searchResults.length === 0) return []

  const bestScore = searchResults[0].score ?? 1
  if (bestScore <= 0.12) {
    return searchResults
      .filter((r) => (r.score ?? 1) <= 0.18)
      .map((r) => r.item)
  }

  return searchResults.map((r) => r.item)
}

