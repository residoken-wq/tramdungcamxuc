# Backlog – Ý tưởng & Tính năng ngoài phạm vi hiện tại

> Nơi ghi lại các ý tưởng phát sinh, cải tiến kỹ thuật hoặc yêu cầu ngoài phạm vi task hiện tại.
> Nguyên tắc: Không tự ý làm tính năng ngoài task. Mọi ý tưởng đều ghi vào đây để Planning Manager và Hana xem xét.

---

## 1. Tính năng sản phẩm & nghiệp vụ

- [ ] **B2B Tracker cho đội ngũ**: Phiên bản mở rộng của Habit Tracker cho doanh nghiệp (dự kiến GĐ 4).
- [ ] **Đa ngôn ngữ (Song ngữ Anh - Việt)**: Tùy chọn mở rộng cho khách hàng nước ngoài.
- [ ] **Mobile App PWA / Native**: Nghiên cứu sau khi bản web đạt traction ổn định.
- [ ] **Tự động đối soát ngân hàng**: Kết nối API ngân hàng sâu hơn khi khối lượng giao dịch lớn.
- [x] **Thêm trường `topic` cho collection `products`** (T1-09; field xong SM-01, `/thu-vien` đọc field ở SM-02): Hiện tại `products` chưa có trường chủ đề riêng; trang Thư viện `/thu-vien` đang suy luận chủ đề theo `web` (`habit` / `eq`) và `type` (`package` → `career`). Cần migration thêm select `topic` (eq / habit / career) vào `Products` để Hana tự gắn trong admin CMS.
- [ ] **Tự động gửi link tải tài nguyên qua email sau khi submit LeadForm** (T1-03 / T1-07): Hiện tại khối Puck `LeadForm` chọn sản phẩm tài nguyên miễn phí chỉ lưu ID và tạo lead kèm tag `resource:<slug>`. Logic tự động gửi email đính kèm link tải file có hạn sẽ được kết nối sau khi task T1-07 (giao tài liệu có ký hạn và queue email) được merge vào main.
- [ ] **Gửi bản tin tự động (Newsletter Dispatch)** (SM-05): Tự động hóa gửi bản tin định kỳ tới danh sách khách tiềm năng có gắn thẻ `newsletter` trong `leads`. Hiện tại form đăng ký lưu thông tin và cho phép xuất CSV để gửi thủ công qua các nền tảng email marketing bên ngoài.
- [x] **Cấu hình CTA kết quả quiz trong CMS** (T1-14; xong SM-01 – `siteSettings.quizCtaPath`): Cho phép Hana tự cấu hình CTA kết quả quiz trong CMS (cần trường trong `siteSettings`, triển khai sau khi nhả khóa Migration). Tạm thời CTA đang trỏ cố định tới `GROWTH_MIRROR_PATH` ('/coaching/growth-mirror').
- [ ] **Cấu hình liên kết hướng dẫn CMS trong SiteSettings** (CM-02): Hiện tại 5 liên kết tài liệu hướng dẫn trên Dashboard admin được cấu hình bằng hằng số trong code (`CMS_DASHBOARD_GUIDES`). Khi mở khóa migration, bổ sung mảng trường `adminGuideLinks` (title, description, url) vào global `siteSettings` để Hana có thể tự cập nhật hoặc bổ sung tài liệu mới trực tiếp từ giao diện CMS.

---

## 2. Kỹ thuật & Hạ tầng

- [ ] **`down` của migration `20261007_025629_private_files` lỗi** (thấy ở SM-01, 17/10): lùi cả lô trên DB mới migrate một lần báo `constraint "products_files_file_id_private_files_id_fk" … does not exist`. Thêm `IF EXISTS` / kiểm tên constraint thật. Không ảnh hưởng `up`.
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
- [x] **Ghi nhận sự kiện `resource_downloaded` phía server (T1-15)**: Bổ sung track sự kiện phân tích chuyển đổi khi khách hàng tải tập tin thành công tại route `/api/download/[token]`, kết nối GA4 / Plausible trong task tối ưu hiệu năng và đo lường T1-15 (xong T2-22).
- [x] ~~**Cron hết hạn đơn chạy trên Vercel**~~ (bỏ – D2 chốt 10/10 chạy server riêng, crontab dùng `POST`) (IT duyệt T1-12, 08/10): Vercel Cron gọi bằng `GET`, route `/api/cron/expire-orders` hiện chỉ có `POST` (crontab Docker dùng `curl -X POST`). Thêm `GET` dùng chung kiểm `CRON_SECRET` khi chốt deploy Vercel (D1/D2).

- [x] E2E `live-preview.test.ts` (375px) thỉnh thoảng lỗi lần đầu, qua khi chạy lại (thấy ở CI PR #74, 11/10) – tìm gốc, không tăng timeout (xong T2-14).

- [x] Phiên khách (T2-01): thu hồi phiên phía server khi đăng xuất / đổi email (hiện chỉ xóa cookie, hạn 30 ngày) (xong T2-20).
- [x] **Phiên khách đè phiên admin** (thấy 15/10, review CM-01): `customer-auth` chạy trước JWT admin nên trình duyệt có cookie `tdcx_customer_token` vào `/admin` bị báo không có quyền. Sửa trong `customerAuthStrategy` (bỏ qua khi có phiên admin hợp lệ) + e2e (xong T2-20).
- [x] T2-01: server chặn đăng nhập khi khách cũ chưa có `consentAt` (form đã chặn) (xong T2-14).
- [x] Xóa tài khoản khách (AGENTS 8.4): `orders`, `entitlements`, `savedCards`, `certificates`, `lessonProgress` có `customer` NOT NULL + `ON DELETE SET NULL` → xóa khách có dữ liệu sẽ lỗi DB. Phải xóa / ẩn danh dữ liệu con trước (xong T2-16).
- [x] Email nhắc workshop (T2-10): thêm link hủy nhận nhắc (xong T2-21).
- [x] T2-08: khóa chống tạo 2 đơn song song đang ở bộ nhớ tiến trình (`withOrderLock`). Đổi sang `pg_advisory_xact_lock(customerId, productId)` (xong T2-19).
- [x] T2-03: bọc lưu kế hoạch + tạo lead trong 1 transaction (lead lỗi → kế hoạch trùng khi gửi lại) (xong T2-17).
- [x] T2-03: cân nhắc không lưu tên/email vào nháp `localStorage` (xong T2-18).
- [x] T2-17: gửi Habit Loop lần 2 sau khi đã thành công vẫn tạo thêm 1 kế hoạch + 1 lead (chống gửi trùng phía server) (xong T2-18).
- [x] T2-04: chuyển chữ trong `TrialWelcomeEmail.tsx` vào `vi.ts` (xong T2-17).
- [x] T2-04: banner/trang `/dung-thu` phân biệt "quyền mua có hạn đã hết" với "dùng thử đã hết" (khi có `accessDurationDays`); `trialDays` ≤ 3 thì mail ngày 18 gửi ngay (xong T2-18).
- [x] Route `/api/download/[token]`: còn vài câu lỗi tiếng Việt ghi cứng (có từ T1-07) → chuyển vào `vi.ts` (xong T2-18).
- [x] T2-07: validate `customers.name` ở mức collection (chặn `< > { }`, ký tự điều khiển) – hiện chỉ action nhận chứng nhận kiểm (xong T2-16).
- [x] T2-09: giới hạn body webhook ở reverse proxy (request chunked không có `Content-Length`); demo phải chạy sau proxy để `X-Forwarded-For` đáng tin (ghi vào RUNBOOK, xong T2-21).
- [x] T2-09: gói `markOrderPaid` (đổi `paid` + cấp quyền) trong 1 transaction ("đã thanh toán ⇔ đã cấp quyền"); email gửi sau commit, nút gửi lại email xác nhận cho owner (xong T2-19).
- [x] T2-07: chống cấp 2 chứng nhận cho 1 kế hoạch đang dựa vào khóa trong bộ nhớ (`withCertLock`, một tiến trình). Khi có migration tiếp theo → thêm unique cho `certificates.plan` (xong T2-16).
- [x] T2-16: `trialUsage.product` NOT NULL nhưng khóa ngoại `ON DELETE SET NULL` → xóa hẳn một sản phẩm đã có dấu vết dùng thử sẽ lỗi. Khi có migration tiếp theo: đổi sang `CASCADE` (hoặc cho phép null) (xong T2-20, cho phép null).
- [x] T2-16: đổi `PAYLOAD_SECRET` làm mọi `trialUsage.emailHash` cũ mất tác dụng (khách đã xóa có thể dùng thử lại) – ghi vào RUNBOOK khi có quy trình xoay khóa (ghi vào RUNBOOK, xong T2-21).

- (SM-04 review 19/10) Editor Puck: nút đặt phiên / "Chọn gói này" luôn hiện ghi chú "Chưa có sản phẩm phiên trải nghiệm đang bán" vì editor không có `_resolved.bookingProductId` – thêm hook client hoặc đổi ghi chú (SM-07).
- [x] (SM-04 review 19/10) `/styleguide`: thêm ví dụ `HanaStory` kiểu `letter` có `greeting` + `signatureName` (xong SM-08).
- (SM-05 review 19/10) `CTASection` chỉ có 1 nút – cân nhắc thêm nút thứ 2 (VD: quiz + đặt phiên) cho dải CTA nền tối trang Tài nguyên.
- [x] (SM-05 review 19/10) Bỏ link `?tab=noi-dung` còn sót ở `PostDetail.tsx` và `tai-nguyen/[slug]/page.tsx`; đổi placeholder "Ví dụ: Minh Anh" của form newsletter (xong SM-08).
- [x] (SM-06 review 20/10) `ContactInfo` chỉ có 1 mục → căn giữa thay vì dồn trái (xong SM-08).
- [x] (SM-06 review 20/10) `ContactForms` bố cục 2 cột ở 1440px: chữ dài trong ô chọn (dịch vụ / chương trình) bị cắt (xong SM-08).
- (SM-08 review 20/10) Lighthouse mobile trang chủ 85/100 (mục tiêu ≥ 90, đo local): LCP 4,1 s, JS không dùng ~0,45 s, audit "redirects" ~0,6 s – đo lại trên server thật rồi tối ưu (ảnh hero `priority`, tách JS khối dưới màn hình đầu).
- (HB-03 review 24/10) Migration SM-07 / SM-08 dùng `ALTER TYPE … ADD VALUE` với `down` trống → `migrate:down` rồi `migrate` lại báo enum đã có. Đổi sang `ADD VALUE IF NOT EXISTS`.
- [x] (HB-03 review 24/10) `certificate.server.ts`: đọc chứng nhận `depth: 1` + `overrideAccess` kéo theo kế hoạch (có field riêng tư) – đã lọc khi trả ra, hạ `depth: 0` khi làm HB-06 (xong ở HB-06).

- [x] (PK-05 QA 24/10) Ô chọn dịch vụ / gói trong builder Puck hiện "Sản phẩm ID: N" thay vì tên – đổi `getItemSummary` của external field sang tên (xong PK-06).
- [x] (PK-05 QA 24/10) Breadcrumb cột phải builder bị chữ chồng khi tên khối dài (xong PK-06).
- [x] (PK-06 24/10) Kéo một khối con (Thẻ, Ô số liệu…) ra ngoài khối cha thì Puck cho thả ở cấp gốc trang → lưu một khối con đứng lẻ. Vùng gốc của Puck không nhận `disallow` qua cấu hình; cần đổi cách render vùng gốc hoặc chặn khi lưu (`normalizePuckData` / `publishPageAction`). (xong PK-07: vùng gốc `disallow` khối con khi sửa).
- [x] (PK-06 24/10) Kéo ngang trên canvas không đổi chỗ khi canvas thu nhỏ ≤ ~52% (khổ 1440px + 2 thanh bên, mặc định). Đo bằng Playwright; cần người kiểm tay. Nếu đúng: báo Puck / thử bản Puck mới, hoặc mở builder với cột phải thu gọn. (PK-07: không phải lỗi – do test di chuột bước 15 px; chuột di ~3 px như người dùng thì kéo đúng ở zoom 52%).
- (PK-06 24/10) Tab "Cấu trúc": mọi khối con đều tên "Thẻ" / "Thẻ gói"… – khó biết thẻ nào; vùng con rỗng ghi "Chưa có khối nào trên trang" (nên là "…trong vùng này"). – PK-07: đã đổi chữ vùng rỗng thành "Chưa có khối nào"; tên riêng từng lớp: Puck 0.23 lấy cố định `label` của loại khối, không có chỗ ghi đè cho từng lớp (chờ Puck hỗ trợ).
- [x] (PK-06 24/10) E2E `puck-{card,faq,format,stat-step,templates,service-package}` chờ xuất bản bằng `getByText(/Đã xuất bản/)` – khớp luôn nhãn trạng thái trên đầu trang nên không chờ thật; đang đúng nhờ `toPass` tải lại trang công khai. Đổi sang chờ thông báo "Đã xuất bản thành công" như `puck-drag.test.ts`. (xong PK-07).
