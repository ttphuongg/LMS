import libraryLogo from '@/assets/logotv.png'
import libraryLogoDark from '@/assets/logotv-dark.png'

/**
 * Hằng số thương hiệu và thông tin liên hệ dùng chung cho toàn bộ hệ thống Thư viện
 */
export const BRAND = {
  name: 'Libri',
  shortName: 'Libri',
  uppercaseName: 'LIBRI',
  tagline: 'Hệ thống Quản lý Thư viện',
  subtitle: 'HỆ THỐNG MỤC LỤC',
  logo: libraryLogo,
  logoDark: libraryLogoDark,
  contact: {
    address: 'Tầng 1–5, Tòa nhà Trung tâm Libri',
    phone: '(024) 3869 1234',
    email: 'thuvien@library.edu.vn',
    hours: 'Thứ Hai – Thứ Bảy (08:00 – 21:00)',
  },
} as const
