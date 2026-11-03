# Thư Viện Trí Tri — Hệ Thống Quản Lý Thư Viện (Frontend)

Dự án Frontend được xây dựng theo kiến trúc **MONOLITH + VERTICAL SLICE** bằng công nghệ:
- **React 19 + Vite + TypeScript (Strict)**
- **Ant Design 6 (antd)** (bộ UI component duy nhất)
- **TanStack React Query + Axios + Dayjs**

Phong cách thị giác: **Thẻ mục lục thư viện cổ điển (Catalog Card) & Nhãn gáy sách (Spine Label)** với tông màu Giấy (`#F3ECDC`, `#FBF7EC`), Mực (`#2A2118`, `#6B5B4B`), Xanh chai (`#1F3A2E`), Đỏ rượu (`#7A2E2B`), Đồng thau (`#B08D3C`).

---

## 1. Hướng Dẫn Cài Đặt & Khởi Chạy

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các thư viện phụ thuộc
npm install

# Khởi chạy môi trường phát triển (Dev server)
npm run dev

# Kiểm tra quy tắc kiến trúc (ESLint no-restricted-imports)
npm run lint

# Kiểm tra biên dịch TypeScript & đóng gói sản phẩm
npm run build
```

Mở trình duyệt tại: `http://localhost:5173`

---

## 2. Bật / Tắt Dữ Liệu Giả (Mock Mode)

Trong file `.env`:
```env
# URL kết nối tới backend ASP.NET Core
VITE_API_BASE_URL=http://localhost:5000

# Chế độ Mock:
# - true:  Dùng mock data mẫu đầy đủ cho tất cả các trang (tiện cho việc code UI độc lập khi backend chưa chạy).
# - false: Gọi trực tiếp API backend thật theo đúng hợp đồng DTO.
VITE_USE_MOCK=true
```

---

## 3. Kiến Trúc Vertical Slice & Quy Ước 5 Thành Viên

> ⚠️ **QUY TẮC BẮT BUỘC**:
> 1. Mỗi thành viên **CHỈ SỬA TRONG THƯ MỤC `features/<tên_mình>`**.
> 2. Mỗi feature có file `index.ts` là **Public API duy nhất**.
> 3. Tuyệt đối **KHÔNG import file nội bộ của feature khác** (ví dụ: `features/circulation/components/...` là bị cấm). Chỉ được import qua Public API `@/features/<tên_feature>`. Đã có quy tắc ESLint `no-restricted-imports` tự động kiểm tra và báo lỗi nếu vi phạm.
> 4. Thư mục `shared/` **KHÔNG được import từ `features/`**.

| STT | Thành viên | Thư mục Feature | Trách nhiệm & Tuyến đường (Routes) | Public API xuất ra (`index.ts`) |
|:---:|:---|:---|:---|:---|
| **1** | **Người 1** | `src/features/identity/` | Đăng nhập (`/login`), Đăng ký (`/register`), Hồ sơ (`/profile`), Đổi mật khẩu (`/change-password`), Auth Store, Route Guard | `identityRoutes`, `useAuth`, `PrivateRoute`, `initAuthAdapter`, DTO types |
| **2** | **Người 2** | `src/features/catalog/` | Mục lục sách (`/books`), Chi tiết sách (`/books/:id`), Quản lý sách (`/admin/books`, `/new`, `/:id/edit`), Tác giả (`/admin/authors`), Thể loại (`/admin/categories`) | `catalogRoutes`, `catalogApi`, `BookCard`, DTO types |
| **3** | **Người 3** | `src/features/circulation/` | Sách mượn của tôi (`/my-loans`), Sổ mượn trả (`/admin/loans`), Lập phiếu mượn (`/admin/loans/borrow`), Thu hồi & sự cố (`/admin/loans/return`), Đặt trước (`/admin/reservations`), Duyệt gia hạn (`/admin/renewals`) | `circulationRoutes`, `ReserveButton`, DTO types |
| **4** | **Người 4** | `src/features/billing/` | Tiền phạt của tôi (`/my-fines`), Danh sách phạt (`/admin/fines`), Lập phiếu phạt mới (`/admin/fines/new`) | `billingRoutes`, DTO types |
| **5** | **Người 5** | `src/features/notifications/` | Chuông & dropdown thông báo (`<NotificationBell />`), Hòm thư (`/notifications`), Quản lý tài khoản & phân quyền (`/admin/users`), Tổng quan hệ thống (`/admin/dashboard`) | `notificationRoutes`, `NotificationBell`, DTO types |

---

## 4. Sơ Đồ Phụ Thuộc Giữa Các Feature (Dependency Graph)

```
                    ┌────────────────────────┐
                    │       src/app/         │
                    │  (router, providers,   │
                    │      layout chung)     │
                    └───────────┬────────────┘
                                │
        ┌───────────────┬───────┴───────┬───────────────┐
        ▼               ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   landing    │ │   catalog    │ │ circulation  │ │ notifications│
└───────┬──────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
        │               │                │                │
        │               │ (ReserveButton)│                │
        │               ├───────────────►│                │
        │ (catalogApi,  │                │                │
        │  BookCard)    │                │                │
        ├──────────────►│                │                │
        │               │                │                │
        │ (useAuth)     │ (PrivateRoute) │ (PrivateRoute, │ (PrivateRoute)
        │               │                │  useAuth)      │
        ▼               ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       features/identity                         │
│             (useAuth, PrivateRoute, identityRoutes)             │
└───────────────────────────────┬─────────────────────────────────┘
                                │ (setAuthAdapter đăng ký lúc init)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                           src/shared/                           │
│     (api/client.ts, components/, constants/, utils/, types/)     │
│             *TUYỆT ĐỐI KHÔNG IMPORT NGƯỢC FEATURE*             │
└─────────────────────────────────────────────────────────────────┘
```

---

### Ghi chú cấu trúc

- `src/features/landing/` (trang giới thiệu cho khách) và `src/features/home/` (trang chủ bạn đọc) **không có route riêng**: route `/` do `src/app/RootGate.tsx` chọn giữa hai trang này theo trạng thái đăng nhập.
- `src/shared/styles/ui.ts` chứa các style inline dùng lặp lại (nút chính, nút viền, tiêu đề modal, thẻ Card, chữ phụ...) và `src/shared/components/BookTitleCell.tsx` là ô bảng "tên sách + số hiệu" dùng chung.
- `src/shared/hooks/` chứa hook dùng chung: `useStableCallback` (hàm tải dữ liệu luôn đọc state mới nhất mà không làm effect chạy lại) và `useRequestGuard` (bỏ qua phản hồi API cũ khi có lần gọi mới hơn). Ngoài ra có `useLoadOnMount` (tải danh sách khi mở trang + tải lại + báo lỗi tuỳ chọn); `getErrorMessage` trong `shared/utils/format.ts` lấy thông báo lỗi để hiển thị.

---

## 5. Danh Sách Các Thành Phần Đánh Dấu `MOCK-ONLY`

Đối chiếu với hợp đồng backend thật, các tính năng sau đây được gắn thẻ comment `// MOCK-ONLY` do backend chưa cung cấp hoặc là giả lập giao diện:

1. **Giữ chỗ 48 giờ & Điểm nhận sách** (`src/features/circulation/api.ts`):
   - Backend chỉ nhận `{ bookId }` và trả về thông tin đặt trước.
   - Các trường `expiresAt` (thời hạn giữ 48h) và `pickupLocation` (quầy thủ thư) được giao diện mock giả lập.
2. **Thanh toán chuyển khoản VietQR & VNPay** (`src/features/billing/components/FinePaymentModal.tsx` & `api.ts`):
   - Backend chỉ có endpoint ghi nhận thanh toán `POST /api/billing/fines/{id}/payments`.
   - Giao diện quét mã VietQR và cổng trực tuyến VNPay là mock giả lập quy trình trải nghiệm người dùng.
3. **Thống kê Dashboard Tổng quan** (`src/features/notifications/api.ts` & `AdminDashboardPage.tsx`):
   - Backend chưa có API tổng hợp số liệu dashboard (`/api/admin/dashboard/stats`).
   - Giao diện sử dụng mock tổng hợp số liệu để phục vụ hiển thị.
4. **Phân loại Dewey DDC & Call Number** (`src/features/catalog/mock.ts`):
   - Mã số hiệu phân loại DDC (như `005.133 M385C`) và mã DDC thể loại được mock nhằm phục vụ phong cách thẻ mục lục thư viện cổ điển.

---

## 6. Tài Khoản Kiểm Thử Mẫu (DEV Mode Only)

Tại trang `/login`, khối nút điền nhanh tài khoản chỉ hiển thị khi `import.meta.env.DEV` là `true`:
1. **Bạn đọc (Reader)**: `reader@library.edu.vn` / Mật khẩu: `Password123!`
2. **Thủ thư (Librarian)**: `librarian@library.edu.vn` / Mật khẩu: `Password123!`
3. **Quản trị viên (Admin)**: `admin@library.edu.vn` / Mật khẩu: `Password123!`
