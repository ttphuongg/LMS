import type React from 'react'
import { Bay1Catalog } from '../Bay1Catalog'
import { Bay2Reservation } from '../Bay2Reservation'
import { Bay3BorrowRules } from '../Bay3BorrowRules'
import { Bay4Fines } from '../Bay4Fines'
import { Bay5LibrarianDesk } from '../Bay5LibrarianDesk'

/** Năm "khoang" của kệ sách, theo thứ tự từ trái sang phải (khớp chỉ số trong ShelfRulerNav). */
export const BAYS: React.FC[] = [Bay1Catalog, Bay2Reservation, Bay3BorrowRules, Bay4Fines, Bay5LibrarianDesk]

/** Mã phân loại Dewey hiển thị mờ phía sau từng khoang. */
export const BAY_CLASS_CODES = ['000', '100', '300', '500', '700']

export const LAST_BAY_INDEX = BAYS.length - 1
