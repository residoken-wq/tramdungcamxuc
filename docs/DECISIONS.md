# Bảng ghi nhận các quyết định kiến trúc & phiên bản (DECISIONS)

> File lưu trữ các quyết định kỹ thuật đã chốt trong dự án Trạm Dừng Cảm Xúc.

---

## 1. Bảng phiên bản công nghệ chuẩn (Cập nhật T0-01)

| Thành phần           | Phiên bản                                               | Lý do lựa chọn                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Node.js**          | `>=20.9.0` (Khuyên dùng Node 22 LTS, hiện tại v22.22.3) | Phiên bản LTS ổn định, hỗ trợ đầy đủ các tính năng ESM và tương thích Payload 3 / Next.js.                                                                                                                         |
| **Package Manager**  | `pnpm` (`>=9`, khuyến nghị v10 / v12)                   | Theo quyết định D3 trong `docs/plan/GAPS_AND_QUESTIONS.md`. Quản lý dependency nhanh, tiết kiệm đĩa và hỗ trợ monorepo / strict hoisting tốt.                                                                      |
| **Framework**        | Next.js `16.3.3` (App Router) + TypeScript strict       | Bản App Router mới nhất tích hợp với Payload CMS 3.x blank template.                                                                                                                                               |
| **React**            | `19.2.6`                                                | Đi kèm với Next.js 16 và Payload 3.90+.                                                                                                                                                                            |
| **CMS**              | Payload CMS `3.90.2`                                    | Tích hợp native vào Next.js App Router, cung cấp `/admin`, Live Preview, Local API, hook và typesafe schema.                                                                                                       |
| **Database Adapter** | `@payloadcms/db-postgres` `3.90.2` (PostgreSQL 16)      | Một cơ sở dữ liệu quan hệ chuẩn cho toàn bộ sản phẩm, nội dung, đơn hàng và phân quyền. Tương thích môi trường local Docker và Neon serverless trên cloud.                                                         |
| **CSS / Styling**    | Tailwind CSS `3.4.17` + PostCSS + Autoprefixer          | Bản Tailwind CSS 3.x ổn định với Next.js App Router. Cho phép cấu hình thay thế hoàn toàn bảng màu mặc định (`theme.colors`) bằng 8 màu Brand Book ở task T0-03 mà không rò rỉ các màu mặc định như `red`, `blue`. |
| **Page Builder**     | `@puckeditor/core` (MIT)                                | Kéo thả trực quan kiểu visual builder nhúng trong admin cho Hana (sẽ cài đặt ở task T0-09).                                                                                                                        |

---

## 2. Quyết định kiến trúc & cấu trúc thư mục

1. **Một codebase duy nhất cho cả 3 web và CMS:**
   - Web 1: Landing page (`/`, `/ve-hana`, `/coaching`, `/doanh-nghiep`, `/tai-nguyen`, `/blog`) đặt trong route group `(site)`.
   - Web 2: Habit Formation đặt trong route group `(habit)/habit`.
   - Web 3: EQ Buddy đặt trong route group `(eq)/eq-buddy`.
   - Tài khoản: đặt trong `(account)/tai-khoan`.
   - Admin CMS: đặt trong `(payload)/admin`.
2. **Quản lý biến môi trường:**
   - Chặn toàn bộ `.env*` trừ `.env.example` qua `.gitignore`.
   - Kết nối DB hỗ trợ cả `DATABASE_URI` (chuẩn dự án) và fallback `DATABASE_URL`.
