export type CopyCondition = 'Good' | 'MinorDamage' | 'MajorDamage' | 'Lost'
export type CopyStatus = 'Available' | 'Reserved' | 'Borrowed' | 'Maintenance' | 'Lost' | 'Inactive'
export type BookStatus = 'Active' | 'Inactive'

export interface BookCopyDto {
  id: string
  copyId?: number
  bookId: string
  bookIdInt?: number
  barcode: string
  status: CopyStatus
  condition?: CopyCondition | string
  locationId?: number | null
  location?: string | null
  locationLabel?: string | null
  acquiredDate?: string
  notes?: string
}

export interface AuthorDto {
  id: string
  authorId?: number
  name: string
  biography?: string
  bio?: string // Tương thích ngược
}

export interface CategoryDto {
  id: string
  categoryId?: number
  name: string
  description?: string
  bookCount?: number
}

export interface LocationCopyItem {
  id: number
  barcode: string
  bookId: number
  bookTitle: string
  status: CopyStatus | string
  condition: CopyCondition | string
}

export interface LocationDto {
  id: number
  aisle: string
  shelf: string
  rowLevel: number
  maxCapacity?: number
  isActive: boolean
  currentCount?: number
  copies?: LocationCopyItem[]
}

export interface AddLocationRequest {
  aisle: string
  shelf: string
  rowLevel: number
  maxCapacity?: number
}

export interface UpdateLocationRequest {
  locationId?: number
  aisle: string
  shelf: string
  rowLevel: number
  maxCapacity?: number
  isActive: boolean
}

export interface BookDto {
  id: string
  bookId?: number
  title: string
  isbn: string
  authorId?: string
  authorIds?: number[]
  authorName: string
  authors?: string[]
  categoryId?: string
  categoryIds?: number[]
  categoryName: string
  categories?: string[]
  publisher?: string
  publishedYear?: number
  description?: string
  language?: string
  pageCount?: number
  bookValue?: number
  totalCopies: number
  availableCopies: number
  status?: BookStatus | string
  coverImage?: string
  coverImageUrl?: string
  copies?: BookCopyDto[]
  copiesError?: boolean
}

export interface CreateBookRequest {
  title: string
  isbn: string
  authorId?: string
  authorIds?: number[]
  categoryId?: string
  categoryIds?: number[]
  publisher?: string
  publishedYear?: number
  description?: string
  language?: string
  pageCount?: number
  bookValue?: number
  coverImageUrl?: string
  initialCopies?: number
  initialLocationId?: number | null
}

export interface UpdateBookRequest {
  title: string
  isbn: string
  authorId?: string
  authorIds?: number[]
  categoryId?: string
  categoryIds?: number[]
  publisher?: string
  publishedYear?: number
  description?: string
  language?: string
  pageCount?: number
  bookValue?: number
  coverImageUrl?: string
}

export interface AddCopyRequest {
  bookId: number
  barcode: string
  locationId?: number | null
  acquiredDate?: string
  condition?: CopyCondition
}

export interface AddBookCopiesRequest {
  quantity: number
  barcode?: string
  locationId?: number | null
  condition?: CopyCondition
}

export interface AddCopiesBatchResult {
  totalRequested: number
  successCount: number
  failCount: number
  errors: string[]
  copies: BookCopyDto[]
}

export interface UpdateCopyStatusRequest {
  status: CopyStatus
  notes?: string
}

export interface CopyLookupDto {
  id: number
  bookId: number
  barcode: string
  locationId?: number | null
  locationLabel?: string | null
  status: CopyStatus | string
  condition: CopyCondition | string
  acquiredDate?: string
  bookTitle?: string | null
}
