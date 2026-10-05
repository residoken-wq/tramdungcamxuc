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
3. **Cấu hình `legacy-peer-deps=true` trong `.npmrc`:**
   - Hệ thống dùng React 19 (`react@19.2.6`, `react-dom@19.2.6`) và Payload 3.90.2. Khi chạy các lệnh qua `npm` hoặc `npx`, một số thư viện trong hệ sinh thái (như `@testing-library/react` v16 hoặc một số plugin/eslint phụ trợ) vẫn khai báo `peerDependencies` giới hạn ở `react: "^18.0.0"`, khiến npm ném lỗi `ERESOLVE unable to resolve dependency tree`.
   - Dù dự án đã chốt dùng `pnpm` (`pnpm-lock.yaml`) làm trình quản lý gói chính (không bị phụ thuộc cờ này), cấu hình `legacy-peer-deps=true` trong `.npmrc` được giữ lại để đảm bảo an toàn nếu lập trình viên hoặc công cụ tự động vô tình gọi `npm` / `npx` trên máy local mà không làm gãy dependency tree.
4. **Chiến lược Schema & Database Migrations (Task T0-02b):**
   - Không sử dụng `push: true` (hoặc chế độ tự động đồng bộ schema khi thiếu cờ) ở bất kỳ môi trường nào, kể cả dev local. Cấu hình tường minh `push: false` trong `postgresAdapter` tại `src/payload.config.ts`.
   - Toàn bộ thay đổi cấu trúc bảng dữ liệu được quản lý qua Payload Migrations (`src/migrations/`), sinh mã tự động bằng `pnpm migrate:create <name>` và theo dõi trong Git.
   - Script chạy migrations: `pnpm migrate` (sử dụng CLI `payload migrate`).
   - Môi trường CI và Production / Preview bắt buộc chạy bước `pnpm migrate` trước khi chạy `pnpm build` để đảm bảo cơ sở dữ liệu đồng bộ chính xác với codebase.
   - Smoke test E2E kiểm tra tính toàn vẹn của database thật thông qua endpoint `/api/users/init` và form tạo user ban đầu, bắt buộc fail nếu cơ sở dữ liệu chưa được migrate.

## T0-06

- Giữ Payload `3.90.2`, Next.js `16.3.3`; chỉ thêm `@payloadcms/storage-s3@3.90.2`. Đối chiếu tài liệu hooks, Local API và migrations tại tag `v3.90.2`, README và mã nguồn package đã cài; đọc tài liệu biến môi trường trong `node_modules/next/dist/docs/`.
- Đăng ký 13 collection nội dung, globals `siteSettings` và `navigation`. Dùng `_status` do Payload drafts cung cấp, không tạo thêm trường `status` trùng nghĩa. Mọi collection nội dung có `isSample` ẩn; không seed dữ liệu trong task này.
- `pages` dùng slug duy nhất, chấp nhận `/`, JSON `puckData`, versions và autosave 30 giây. Các collection còn lại có drafts và versions. Nhãn collection, field, mô tả và lỗi validate do dự án khai báo đều bằng tiếng Việt.
- `computePackageValue()` dùng tổng `quantity × unitValue`, ưu tiên `salePrice` khác null, rồi `price`; không dùng `retailPrice` hay tự bỏ ưu đãi theo `saleEndsAt`. Tổng giá trị bằng 0 hoặc thiếu giá bán cho phần trăm null; phần trăm làm tròn và không âm. Hook `beforeChange` luôn ghi đè hai giá trị tính toán, kể cả khi gửi qua API; hỗ trợ cập nhật một phần.
- `qrSlug` duy nhất; khi đã lưu `printedAt` thì khóa cả QR và ngày in để không thể xóa ngày in rồi đổi QR. Trường QR đã in hiển thị chỉ đọc trong admin. Lỗi API: “Thẻ đã in, không được đổi mã QR”. Testimonial thiếu consent được lưu nháp nhưng không xuất bản được.
- Access tạm chỉ gồm `authenticated` và `publishedOrAuthenticated`: quản trị viên thuộc collection `users` được thao tác; public chỉ đọc bản published. Chưa thêm role owner/editor. Các điểm access đã đánh dấu `REVIEW-REQUIRED`. Tạm ẩn `products.files`, `lessons.videoId`, `lessons.downloadables` và `workshops.joinUrl` với public; quyền theo entitlement và giao file ký hạn thuộc task sau.
- R2 bật khi có bucket, endpoint, access key và secret key; `S3_REGION` rỗng dùng `auto`. Thiếu cấu hình thì lưu local theo Payload. Bật `alwaysInsertFields` để schema `media.prefix` giống nhau ở cả local và R2, không phát sinh migration khi đổi môi trường. Không thử upload R2 thật vì chưa có tài khoản/cấu hình R2.
- Chỉ tạo một migration `20261005_031311_content_collections`; đã chạy trên DB có `initial`, và drop/create riêng DB `tramdungcamxuc_codex` rồi chạy lại cả hai migration thành công. `push: false` giữ nguyên.
- Test Local API dùng PostgreSQL thật, áp dụng danh sách migration đã import trước khi chạy vì CI hiện đặt unit test trước migrate. Chỉ xóa các bản ghi do chính test tạo, đóng kết nối khi xong. Playwright tạo admin đầu tiên một lần, kiểm tra cả desktop/mobile trong cùng test để tránh tranh chấp DB giữa hai project; tự xóa tài khoản test.
- Tài liệu đã đối chiếu: [Payload hooks 3.90.2](https://github.com/payloadcms/payload/blob/v3.90.2/docs/hooks/collections.mdx), [Local API 3.90.2](https://github.com/payloadcms/payload/blob/v3.90.2/docs/local-api/overview.mdx), [migrations 3.90.2](https://github.com/payloadcms/payload/blob/v3.90.2/docs/database/migrations.mdx).
