# Runbook – Hướng dẫn vận hành hệ thống

> Tài liệu hướng dẫn cài đặt, chạy local, kiểm thử, triển khai và xử lý sự cố.

---

## 1. Môi trường phát triển Local

### Yêu cầu tiên quyết

- **Node.js**: `>= 20.9.0` (Khuyên dùng Node 22 LTS)
- **pnpm**: `>= 9.0.0`
- **Docker & Docker Compose** (hoặc một dịch vụ PostgreSQL chạy ở cổng 5432 / Neon PostgreSQL)

### Các bước chạy local trong 5 bước

1. **Cài đặt thư viện phụ thuộc:**
   ```bash
   pnpm install
   ```
2. **Khởi tạo file cấu hình môi trường:**
   Sao chép `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
3. **Khởi động Cơ sở dữ liệu PostgreSQL:**
   - Dùng Docker Compose:
     ```bash
     docker compose up -d
     ```
   - Hoặc kết nối tới cơ sở dữ liệu PostgreSQL cục bộ / Neon qua chuỗi kết nối `DATABASE_URI` trong `.env`.
4. **Khởi động máy chủ phát triển:**
   ```bash
   pnpm dev
   ```
5. **Truy cập ứng dụng:**
   - Trang người dùng: `http://localhost:3000`
   - Bảng quản trị CMS: `http://localhost:3000/admin` (tạo tài khoản quản trị đầu tiên trong lần đăng nhập đầu)

---

## 2. Các lệnh kiểm tra chất lượng code (Lint & Typecheck)

- Kiểm tra lỗi cú pháp và quy chuẩn code:
  ```bash
  pnpm lint
  ```
- Kiểm tra kiểu dữ liệu TypeScript:
  ```bash
  pnpm typecheck
  ```
- Định dạng code tự động:
  ```bash
  pnpm format
  ```

---

## 3. Quản lý Cơ sở dữ liệu & Migrations (Payload CMS)

- Tạo migration mới khi thay đổi schema collection/global:
  ```bash
  pnpm payload migrate:create
  ```
- Chạy migrations đang chờ:
  ```bash
  pnpm payload migrate
  ```
- Sinh types TypeScript cho các collection:
  ```bash
  pnpm generate:types
  ```

---

## 4. Xử lý sự cố thường gặp (Troubleshooting)

- **Lỗi kết nối cơ sở dữ liệu (`ECONNREFUSED 127.0.0.1:5432`)**:
  - Kiểm tra container Postgres đã chạy chưa: `docker ps`
  - Khởi động lại: `docker compose restart postgres`
  - Kiểm tra chuỗi kết nối `DATABASE_URI` trong `.env`.
- **Lỗi cache Next.js / build cũ**:
  - Chạy `pnpm devsafe` để xóa thư mục `.next` và khởi động lại sạch sẽ.
