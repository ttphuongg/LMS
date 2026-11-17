# Hướng dẫn Khởi chạy Môi trường CI/CD (Jenkins) cho LMS

Thư mục này chứa toàn bộ cấu hình Docker để thiết lập máy chủ **Jenkins Controller** độc lập, phục vụ quy trình Tích hợp liên tục (Continuous Integration - CI) cho dự án Quản lý Thư viện (LMS).

---

## 1. Yêu cầu tiên quyết (Prerequisites)
* Máy tính đã cài đặt **Docker Desktop** (và đang chạy).
* Kết nối Internet để kéo các Docker Image và mã nguồn từ GitHub.

---

## 2. Các bước khởi chạy máy chủ Jenkins

### Bước 1: Mở terminal tại thư mục `ci/` và khởi chạy container
```bash
# Di chuyển vào thư mục ci (nếu đang ở thư mục gốc LMS)
cd ci

# Build image và khởi động Jenkins ở chế độ chạy ngầm (background)
docker compose up -d --build
```

Container Jenkins sẽ được tạo với:
* **Tên container:** `jenkins-ci`
* **Cổng truy cập:** `http://localhost:8080` (Cổng Agent: `50000`)
* **Dữ liệu lưu trữ:** Volume `jenkins_data` (lưu trữ an toàn cấu hình, tài khoản và lịch sử build)
* **Quyền Docker:** Được chia sẻ qua Docker socket `/var/run/docker.sock` để Jenkins có thể trực tiếp build các container khác.

---

### Bước 2: Lấy mật khẩu khởi tạo ban đầu (Initial Admin Password)
Sau khi container chạy xong, chạy lệnh sau trên terminal để lấy mật khẩu:
```bash
docker exec jenkins-ci cat /var/jenkins_home/secrets/initialAdminPassword
```
*(Sao chép chuỗi mã 32 ký tự in ra trên màn hình)*.

---

### Bước 3: Hoàn tất cài đặt trên trình duyệt Web
1. Mở trình duyệt Web (Chrome / Edge), truy cập vào: **http://localhost:8080**.
2. Dán mật khẩu vừa lấy ở Bước 2 vào ô **Administrator password** $\rightarrow$ Bấm **Continue**.
3. Chọn ô bên trái: **Install suggested plugins** (chờ 1 - 2 phút để Jenkins cài các plugin tiêu chuẩn).
4. Điền thông tin tạo tài khoản quản trị đầu tiên (**Create First Admin User**).
5. Bấm **Save and Finish** $\rightarrow$ **Start using Jenkins**.

---

### Bước 4: Cài đặt thêm Plugin Docker Pipeline
1. Vào **Manage Jenkins** $\rightarrow$ chọn **Plugins** $\rightarrow$ chọn tab **Available plugins**.
2. Tìm kiếm từ khóa: `Docker Pipeline` (plugin id: `docker-workflow`).
3. Tích chọn và bấm **Install**, sau đó tích vào ô **Restart Jenkins when installation is complete**.

---

## 3. Cấu hình Pipeline Job cho dự án LMS

1. Tại trang chủ Jenkins Dashboard, bấm vào **+ New Item** ở menu bên trái.
2. Nhập tên Job: **`LMS-CI`** $\rightarrow$ Chọn kiểu **Pipeline** $\rightarrow$ Bấm **OK**.
3. Kéo xuống phần **Pipeline** ở dưới cùng:
   * **Definition:** Chọn `Pipeline script from SCM`
   * **SCM:** Chọn `Git`
   * **Repository URL:** `https://github.com/ttphuongg/LMS.git`
   * **Branches to build (Branch Specifier):** `*/main`
   * **Script Path:** `Jenkinsfile`
4. Bấm **Save**.

---

## 4. Chạy kiểm thử tự động (CI Build)
* Tại trang của Job `LMS-CI`, bấm vào nút **Build Now** ở menu bên trái.
* Jenkins sẽ tự động thực thi các giai đoạn trong file `Jenkinsfile` ở thư mục gốc:
  1. **Stage 1 (Checkout Code):** Kéo mã nguồn mới nhất từ GitHub.
  2. **Stage 2 (Build Frontend):** Kiểm tra TypeScript (`tsc -b`) và đóng gói Vite production bundle.
  3. **Stage 3 (Build Backend):** Restore dependencies và biên dịch toàn bộ C# .NET 10 Modular Monolith (`Library.Modules.Core` & `Library.Web`).
  4. **Stage 4 (Verify Compose):** Xác thực cú pháp file `docker-compose.yml`.
  5. **Cleanup:** Dọn dẹp an toàn các image thử nghiệm tạm thời.
* Bấm vào số lượt build (ví dụ **#1**) $\rightarrow$ **Console Output** để theo dõi log thực thi theo thời gian thực.

---

## 5. Các lệnh quản lý nhanh container Jenkins

* **Dừng Jenkins khi không sử dụng (tiết kiệm RAM):**
  ```bash
  docker stop jenkins-ci
  # hoặc đứng tại thư mục ci gõ:
  docker compose down
  ```
* **Bật lại Jenkins vào các lần sau:**
  ```bash
  docker start jenkins-ci
  # hoặc đứng tại thư mục ci gõ:
  docker compose up -d
  ```
* **Xem nhật ký hoạt động (Logs):**
  ```bash
  docker logs -f jenkins-ci
  ```

