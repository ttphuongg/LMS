/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '@/shared/api/client'
import type { ApiResponse, PagedResult } from '@/shared/api/types'
import type {
  BookDto,
  BookCopyDto,
  AuthorDto,
  CategoryDto,
  LocationDto,
  AddLocationRequest,
  UpdateLocationRequest,
  CreateBookRequest,
  UpdateBookRequest,
  AddBookCopiesRequest,
  AddCopiesBatchResult,
  UpdateCopyStatusRequest,
} from './types'

export const catalogApi = {
  // Lấy danh sách sách phân trang
  getBooks: async (params?: {
    keyword?: string
    categoryId?: number | string
    category?: number | string
    page?: number
    pageSize?: number
  }): Promise<PagedResult<BookDto>> => {
    const queryParams: Record<string, unknown> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
    }
    if (params?.keyword) queryParams.keyword = params.keyword.trim()
    const rawCat = params?.categoryId ?? params?.category
    if (rawCat !== undefined && rawCat !== null && rawCat !== '' && !isNaN(Number(rawCat))) {
      const catNum = Number(rawCat)
      if (catNum > 0) {
        queryParams.categoryId = catNum
      }
    }

    const res = await apiClient.get<ApiResponse<{ items: any[]; totalCount: number }>>('/api/catalog/books', {
      params: queryParams,
    })
    const data = res.data.data
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const totalCount = data?.totalCount || 0

    // Mapping SearchBookResult (BookSummary) sang BookDto cho giao diện
    const items: BookDto[] = (data?.items || []).map((b: any) => ({
      id: String(b.id),
      bookId: b.id,
      title: b.title,
      isbn: b.isbn || '',
      callNumber: b.callNumber || '000 DDC',
      authorName: b.authorName || (Array.isArray(b.authors) && b.authors.length > 0 ? b.authors.join(', ') : 'Chưa rõ tác giả'),
      categoryName: b.categoryName || (Array.isArray(b.categories) && b.categories.length > 0 ? b.categories.join(', ') : 'Chung'),
      publisher: b.publisher,
      publishedYear: b.publishedYear,
      description: b.description,
      coverImageUrl: b.coverImageUrl,
      coverImage: b.coverImageUrl,
      availableCopies: b.availableCopies ?? 1,
      totalCopies: b.totalCopies ?? b.availableCopies ?? 1,
    }))

    return {
      items,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize) || 1,
    }
  },

  // Chi tiết sách (Tự động gọi song song /api/catalog/books/{id}/copies để gộp bản sao vào book.copies)
  getBookById: async (id: string): Promise<BookDto> => {
    const [bookRes, copiesRes] = await Promise.all([
      apiClient.get<ApiResponse<any>>(`/api/catalog/books/${id}`),
      apiClient.get<ApiResponse<any[]>>(`/api/catalog/books/${id}/copies`).catch(() => ({ data: { data: [] } })),
    ])

    const d = bookRes.data.data
    const rawCopies = copiesRes.data.data || []
    const authors = Array.isArray(d.authors) ? (d.authors as string[]) : []
    const categories = Array.isArray(d.categories) ? (d.categories as string[]) : []

    const copies: BookCopyDto[] = rawCopies.map((c: any) => ({
      id: String(c.id),
      copyId: c.id,
      bookId: String(d.id),
      bookIdInt: d.id,
      barcode: c.barcode,
      status: c.status,
      condition: c.condition,
      locationId: c.locationId,
      location: c.locationLabel || 'Kệ chính - Phòng đọc',
      locationLabel: c.locationLabel,
      acquiredDate: c.acquiredDate ? String(c.acquiredDate) : undefined,
    }))

    return {
      id: String(d.id),
      bookId: d.id,
      title: d.title,
      isbn: d.isbn || '',
      callNumber: d.callNumber || '000 DDC',
      authorName: authors.length > 0 ? authors.join(', ') : (d.authorName || 'Chưa rõ tác giả'),
      categoryName: categories.length > 0 ? categories.join(', ') : (d.categoryName || 'Chung'),
      authors,
      categories,
      publisher: d.publisher,
      publishedYear: d.publishedYear,
      description: d.description,
      language: d.language,
      pageCount: d.pageCount,
      bookValue: d.bookValue,
      coverImageUrl: d.coverImageUrl,
      coverImage: d.coverImageUrl,
      availableCopies: copies.length > 0 ? copies.filter((c) => c.status === 'Available').length : 1,
      totalCopies: copies.length > 0 ? copies.length : 1,
      copies,
    }
  },

  // Lấy danh sách bản sao của sách
  getBookCopies: async (bookId: string): Promise<BookCopyDto[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>(`/api/catalog/books/${bookId}/copies`)
    const rawList = res.data.data || []
    return rawList.map((c: any) => ({
      id: String(c.id),
      copyId: c.id,
      bookId,
      bookIdInt: Number(bookId),
      barcode: c.barcode,
      status: c.status,
      condition: c.condition,
      locationId: c.locationId,
      location: c.locationLabel || 'Kệ lưu thông chính',
      locationLabel: c.locationLabel,
      acquiredDate: c.acquiredDate ? String(c.acquiredDate) : undefined,
    }))
  },

  // Thêm sách mới (Staff)
  createBook: async (data: CreateBookRequest): Promise<BookDto> => {
    // BE AddBookRequest(Title, Isbn, Description, PublishedYear, Publisher, Language, PageCount, BookValue, CoverImageUrl, AuthorIds, CategoryIds)
    const authorIds = data.authorIds && data.authorIds.length > 0
      ? data.authorIds
      : (data.authorId && !isNaN(Number(data.authorId)) ? [Number(data.authorId)] : [])
    const categoryIds = data.categoryIds && data.categoryIds.length > 0
      ? data.categoryIds
      : (data.categoryId && !isNaN(Number(data.categoryId)) ? [Number(data.categoryId)] : [])

    const payload = {
      title: data.title,
      isbn: data.isbn || null,
      description: data.description || null,
      publishedYear: (data.publishedYear !== undefined && data.publishedYear !== null && !isNaN(Number(data.publishedYear))) ? Number(data.publishedYear) : null,
      publisher: data.publisher || null,
      language: data.language || 'vi',
      pageCount: data.pageCount ? Number(data.pageCount) : null,
      bookValue: data.bookValue ? Number(data.bookValue) : null,
      coverImageUrl: data.coverImageUrl || null,
      authorIds,
      categoryIds,
    }

    const res = await apiClient.post<ApiResponse<number>>('/api/catalog/books', payload)
    const newBookId = res.data.data

    // Nếu người dùng yêu cầu số bản sao ban đầu, adapter tuân thủ quy trình BE tạo tiếp các bản sao
    if (data.initialCopies && data.initialCopies > 0) {
      for (let i = 0; i < data.initialCopies; i++) {
        try {
          const barcode = `BC-${newBookId}-${Date.now().toString().slice(-4)}-${i + 1}`
          await apiClient.post(`/api/catalog/books/${newBookId}/copies`, {
            bookId: newBookId,
            barcode,
            condition: 0, // Good
          })
        } catch {
          // Bỏ qua lỗi bản sao phụ để không làm gián đoạn
        }
      }
    }

    return await catalogApi.getBookById(String(newBookId))
  },

  // Sửa sách (Staff)
  updateBook: async (id: string, data: UpdateBookRequest): Promise<BookDto> => {
    const authorIds = data.authorIds && data.authorIds.length > 0
      ? data.authorIds
      : (data.authorId && !isNaN(Number(data.authorId)) ? [Number(data.authorId)] : [])
    const categoryIds = data.categoryIds && data.categoryIds.length > 0
      ? data.categoryIds
      : (data.categoryId && !isNaN(Number(data.categoryId)) ? [Number(data.categoryId)] : [])

    const payload = {
      title: data.title,
      isbn: data.isbn || null,
      description: data.description || null,
      publishedYear: (data.publishedYear !== undefined && data.publishedYear !== null && !isNaN(Number(data.publishedYear))) ? Number(data.publishedYear) : null,
      publisher: data.publisher || null,
      language: data.language || 'vi',
      pageCount: data.pageCount ? Number(data.pageCount) : null,
      bookValue: data.bookValue ? Number(data.bookValue) : null,
      coverImageUrl: data.coverImageUrl || null,
      authorIds,
      categoryIds,
    }

    await apiClient.put<ApiResponse<boolean>>(`/api/catalog/books/${id}`, payload)
    return await catalogApi.getBookById(id)
  },

  // Thêm bản sao (Staff)
  addCopies: async (bookId: string, data: AddBookCopiesRequest): Promise<AddCopiesBatchResult> => {
    const count = Math.max(Number(data.quantity) || 1, 1)
    const conditionMap: Record<string, number> = { Good: 0, MinorDamage: 1, MajorDamage: 2, Lost: 3 }
    const conditionNum = typeof data.condition === 'number' ? data.condition : (data.condition ? conditionMap[data.condition] ?? 0 : 0)

    const now = Date.now()
    const salt = Math.random().toString(36).substring(2, 6).toUpperCase()

    // Chuẩn bị các request thêm bản sao song song qua Promise.allSettled
    const tasks = Array.from({ length: count }, (_, i) => {
      // Đảm bảo barcode là duy nhất cho mỗi bản sao
      const barcode = data.barcode && count === 1
        ? data.barcode
        : `BC-${bookId}-${now.toString().slice(-4)}${salt}-${i + 1}`

      return apiClient.post(`/api/catalog/books/${bookId}/copies`, {
        bookId: Number(bookId),
        barcode,
        locationId: data.locationId || null,
        condition: conditionNum,
      }).then(() => barcode)
    })

    const settled = await Promise.allSettled(tasks)
    const successes = settled.filter((r) => r.status === 'fulfilled')
    const failures = settled.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]
    const errors = failures.map((f) => f.reason?.message || 'Lỗi không xác định khi tạo bản sao')

    const successCount = successes.length
    const failCount = failures.length

    // Nếu toàn bộ thất bại, ném lỗi rõ ràng
    if (successCount === 0) {
      const firstErr = errors[0] || 'Tất cả các bản sao đều không thể tạo được'
      throw new Error(`Tạo ${count} bản sao thất bại: ${firstErr}`)
    }

    // Tải lại danh sách bản sao mới nhất sau khi thêm
    const copies = await catalogApi.getBookCopies(bookId).catch(() => [])

    return {
      totalRequested: count,
      successCount,
      failCount,
      errors,
      copies,
    }
  },

  // Đổi trạng thái bản sao (Staff)
  updateCopyStatus: async (copyId: string, data: UpdateCopyStatusRequest): Promise<void> => {
    await apiClient.patch<ApiResponse>(`/api/catalog/copies/${copyId}/status`, {
      copyId: Number(copyId),
      newStatus: data.status,
    })
  },

  // Tra cứu bản sao qua mã vạch (Barcode lookup)
  lookupCopyByBarcode: async (barcode: string): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>(`/api/catalog/copies/lookup?barcode=${encodeURIComponent(barcode.trim())}`)
    return res.data.data
  },

  // Tác giả
  getAuthors: async (): Promise<AuthorDto[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/api/catalog/authors')
    const list = res.data.data || []
    return list.map((a: any) => ({
      id: String(a.id),
      authorId: a.id,
      name: a.name,
      biography: a.biography,
      bio: a.biography,
    }))
  },

  createAuthor: async (data: Omit<AuthorDto, 'id'>): Promise<AuthorDto> => {
    const payload = {
      name: data.name,
      biography: data.biography || data.bio || null,
    }
    const res = await apiClient.post<ApiResponse<number>>('/api/catalog/authors', payload)
    return {
      id: String(res.data.data),
      authorId: res.data.data,
      name: data.name,
      biography: data.biography || data.bio,
      bio: data.biography || data.bio,
    }
  },

  // Thể loại
  getCategories: async (): Promise<CategoryDto[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/api/catalog/categories')
    const list = res.data.data || []
    return list.map((c: any) => ({
      id: String(c.id),
      categoryId: c.id,
      name: c.name,
      description: c.description,
      code: c.id ? `DDC-${c.id}` : undefined,
    }))
  },

  createCategory: async (data: Omit<CategoryDto, 'id'>): Promise<CategoryDto> => {
    const payload = {
      name: data.name,
      description: data.description || null,
    }
    const res = await apiClient.post<ApiResponse<number>>('/api/catalog/categories', payload)
    return {
      id: String(res.data.data),
      categoryId: res.data.data,
      name: data.name,
      description: data.description,
    }
  },

  // Vị trí kệ sách (ManageLocations)
  getLocations: async (activeOnly?: boolean): Promise<LocationDto[]> => {
    const params: Record<string, unknown> = {}
    if (activeOnly !== undefined) {
      params.activeOnly = activeOnly
    }
    const res = await apiClient.get<ApiResponse<LocationDto[]>>('/api/catalog/locations', {
      params,
    })
    return res.data.data || []
  },

  getLocationById: async (id: number): Promise<LocationDto> => {
    const res = await apiClient.get<ApiResponse<LocationDto>>(`/api/catalog/locations/${id}`)
    return res.data.data
  },

  createLocation: async (data: AddLocationRequest): Promise<number> => {
    const res = await apiClient.post<ApiResponse<number>>('/api/catalog/locations', data)
    return res.data.data
  },

  updateLocation: async (id: number, data: UpdateLocationRequest): Promise<boolean> => {
    const res = await apiClient.put<ApiResponse<boolean>>(`/api/catalog/locations/${id}`, data)
    return res.data.data
  },
}
