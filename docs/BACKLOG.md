# Backlog – Ý tưởng & Tính năng ngoài phạm vi hiện tại

> Nơi ghi lại các ý tưởng phát sinh, cải tiến kỹ thuật hoặc yêu cầu ngoài phạm vi task hiện tại.
> Nguyên tắc: Không tự ý làm tính năng ngoài task. Mọi ý tưởng đều ghi vào đây để Planning Manager và Hana xem xét.

---

## 1. Tính năng sản phẩm & nghiệp vụ

- [ ] **B2B Tracker cho đội ngũ**: Phiên bản mở rộng của Habit Tracker cho doanh nghiệp (dự kiến GĐ 4).
- [ ] **Đa ngôn ngữ (Song ngữ Anh - Việt)**: Tùy chọn mở rộng cho khách hàng nước ngoài.
- [ ] **Mobile App PWA / Native**: Nghiên cứu sau khi bản web đạt traction ổn định.
- [ ] **Tự động đối soát ngân hàng**: Kết nối API ngân hàng sâu hơn khi khối lượng giao dịch lớn.
- [ ] **Thêm trường `topic` cho collection `products`** (T1-09): Hiện tại `products` chưa có trường chủ đề riêng; trang Thư viện `/thu-vien` đang suy luận chủ đề theo `web` (`habit` / `eq`) và `type` (`package` → `career`). Cần migration thêm select `topic` (eq / habit / career) vào `Products` để Hana tự gắn trong admin CMS.
- [ ] **Tự động gửi link tải tài nguyên qua email sau khi submit LeadForm** (T1-03 / T1-07): Hiện tại khối Puck `LeadForm` chọn sản phẩm tài nguyên miễn phí chỉ lưu ID và tạo lead kèm tag `resource:<slug>`. Logic tự động gửi email đính kèm link tải file có hạn sẽ được kết nối sau khi task T1-07 (giao tài liệu có ký hạn và queue email) được merge vào main.
- [ ] **Cấu hình CTA kết quả quiz trong CMS** (T1-14): Cho phép Hana tự cấu hình CTA kết quả quiz trong CMS (cần trường trong `siteSettings`, triển khai sau khi nhả khóa Migration). Tạm thời CTA đang trỏ cố định tới `GROWTH_MIRROR_PATH` ('/coaching/growth-mirror').

---

## 2. Kỹ thuật & Hạ tầng

- [ ] **Favicon chính thức**: Hiện thiếu `favicon.ico` (404 trên browser console). Chờ file logo chính thức từ Hana để tạo trọn bộ icon/favicon chuẩn.
- [ ] **Tối ưu build cache trên CI**: Tăng tốc độ pipeline GitHub Actions với Turborepo / pnpm cache.
- [ ] **Automated Performance Testing**: Tự động test điểm Lighthouse trên mỗi PR preview.
- [x] **CI build image → GHCR, server chỉ pull** (đề xuất 05/10, → task **T0-10c** trong `docs/tasks/GD0.md`): GitHub Actions build image sau khi CI xanh trên `main`, đẩy lên `ghcr.io/residoken-wq/tramdungcamxuc` (tag `latest` + `sha-<commit>`, kèm image `tools-*` cho seed). Server demo bỏ bước build, chỉ `docker compose pull && up -d`; rollback bằng `APP_TAG`. Lợi ích: server không cần RAM để build, cập nhật nhanh, chạy đúng image CI đã test.
- [ ] **Hỗ trợ multi-architecture Docker image (linux/arm64)**: Hiện CI chỉ build `linux/amd64` để tối ưu thời gian build và cache. Khi có nhu cầu chạy trên server ARM64 (Graviton, Oracle Ampere, Apple Silicon), thêm QEMU / multi-platform matrix vào workflow Docker.
- [ ] **Database Read Replicas**: Dự phòng khi lượng truy cập tăng vọt trong các đợt chiến dịch.

- [ ] **T0-07 / giao tài liệu trả phí**: `media` hiện là thư viện công khai của T0-06. Trước khi đưa tài liệu trả phí thật lên, cần kiểm soát cả API media và URL file trực tiếp, lưu trữ riêng tư và link ký có hạn; chỉ ẩn `products.files` không đủ bảo vệ file gốc.
- [x] **Admin Payload tiếng Việt** (→ T0-12): bật i18n `vi` cho giao diện admin để lỗi mặc định (vd. "Value must be unique") hiện tiếng Việt cho Hana.
- [ ] **Khối RichText định dạng giới hạn** (đậm, nghiêng, link, danh sách – Puck `richtext` đã tắt heading/màu/căn lề): đánh giá ở T1-01 khi có nội dung thật. GĐ 0 dùng `textarea` (quyết định spike T0-09).
- [x] **Tính % ưu đãi gói trong computePackageValue chưa xét saleEndsAt** (`src/lib/pricing.ts`): Đã xử lý ở T1-02a bằng việc tính lúc render qua `getEffectivePrice` và `buildPackageComparison`, tôn trọng thời hạn khuyến mãi `saleEndsAt` mà không lưu dữ liệu tính sẵn vào `puckData`.
- [x] **Font tự host (`next/font/local`)** (xong ở T1-15a): Đã chuyển Anton/Montserrat/Playfair (subset vietnamese + latin) vào repo dạng WOFF2 tĩnh tại `src/fonts/`, cấu hình qua `next/font/local` trong `src/lib/fonts.ts`.
- [ ] **Ghi nhận sự kiện `resource_downloaded` phía server (T1-15)**: Bổ sung track sự kiện phân tích chuyển đổi khi khách hàng tải tập tin thành công tại route `/api/download/[token]`, kết nối GA4 / Plausible trong task tối ưu hiệu năng và đo lường T1-15.
- [x] ~~**Cron hết hạn đơn chạy trên Vercel**~~ (bỏ – D2 chốt 10/10 chạy server riêng, crontab dùng `POST`) (IT duyệt T1-12, 08/10): Vercel Cron gọi bằng `GET`, route `/api/cron/expire-orders` hiện chỉ có `POST` (crontab Docker dùng `curl -X POST`). Thêm `GET` dùng chung kiểm `CRON_SECRET` khi chốt deploy Vercel (D1/D2).

- [x] E2E `live-preview.test.ts` (375px) thỉnh thoảng lỗi lần đầu, qua khi chạy lại (thấy ở CI PR #74, 11/10) – tìm gốc, không tăng timeout (xong T2-14).

- [ ] Phiên khách (T2-01): thu hồi phiên phía server khi đăng xuất / đổi email (hiện chỉ xóa cookie, hạn 30 ngày).
- [x] T2-01: server chặn đăng nhập khi khách cũ chưa có `consentAt` (form đã chặn) (xong T2-14).
- [x] Xóa tài khoản khách (AGENTS 8.4): `orders`, `entitlements`, `savedCards`, `certificates`, `lessonProgress` có `customer` NOT NULL + `ON DELETE SET NULL` → xóa khách có dữ liệu sẽ lỗi DB. Phải xóa / ẩn danh dữ liệu con trước (xong T2-16).
- [ ] Email nhắc workshop (T2-10): thêm link hủy nhận nhắc.
- [ ] T2-08: khóa chống tạo 2 đơn song song đang ở bộ nhớ tiến trình (`withOrderLock`). Khi chạy nhiều bản Next.js → đổi sang `pg_advisory_xact_lock(customerId, productId)`.
- [x] T2-03: bọc lưu kế hoạch + tạo lead trong 1 transaction (lead lỗi → kế hoạch trùng khi gửi lại) (xong T2-17).
- [ ] T2-03: cân nhắc không lưu tên/email vào nháp `localStorage`.
- [ ] T2-17: gửi Habit Loop lần 2 sau khi đã thành công vẫn tạo thêm 1 kế hoạch + 1 lead (chống gửi trùng phía server).
- [x] T2-04: chuyển chữ trong `TrialWelcomeEmail.tsx` vào `vi.ts` (xong T2-17).
- [ ] T2-04: banner/trang `/dung-thu` phân biệt "quyền mua có hạn đã hết" với "dùng thử đã hết" (khi có `accessDurationDays`); `trialDays` ≤ 3 thì mail ngày 18 gửi ngay.
- [ ] Route `/api/download/[token]`: còn vài câu lỗi tiếng Việt ghi cứng (có từ T1-07) → chuyển vào `vi.ts`.
- [x] T2-07: validate `customers.name` ở mức collection (chặn `< > { }`, ký tự điều khiển) – hiện chỉ action nhận chứng nhận kiểm (xong T2-16).
- [ ] T2-09: giới hạn body webhook ở reverse proxy (request chunked không có `Content-Length`); demo phải chạy sau proxy để `X-Forwarded-For` đáng tin.
- [ ] T2-09: gói `markOrderPaid` (đổi `paid` + cấp quyền + email) trong 1 transaction; hiện tiến trình chết giữa chừng → nhãn `paid_incomplete`, email xác nhận không gửi lại.
- [x] T2-07: chống cấp 2 chứng nhận cho 1 kế hoạch đang dựa vào khóa trong bộ nhớ (`withCertLock`, một tiến trình). Khi có migration tiếp theo → thêm unique cho `certificates.plan` (xong T2-16).
