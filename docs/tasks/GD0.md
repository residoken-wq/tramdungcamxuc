# GĐ 0 – Nền móng: task card cho Antigravity

> Mục tiêu GĐ 0: admin chạy trên preview, đủ collections, phân quyền đúng, kéo thả được 5 khối đầu tiên.
> **Cổng GĐ 0**: Hana đăng nhập `/admin`, thấy đủ collection, tự tạo 1 sản phẩm, tự kéo thả dựng 1 trang thử từ 5 khối rồi xuất bản, trang công khai hiện đúng.
> Tham chiếu chung: `AGENTS.md`, `docs/plan/GAPS_AND_QUESTIONS.md`.

---

## T0-01 – Khởi tạo repo

**Mục tiêu**: một app Next.js (App Router) + Payload CMS 3 + Postgres + Tailwind chạy được ở local, đúng cấu trúc thư mục AGENTS.md mục 6.

**Phạm vi**

1. Chuyển `agent/AGENTS.md` ra gốc repo (`git mv`), xóa thư mục `agent/` nếu rỗng.
2. Khởi tạo bằng công cụ chính thức của Payload (`create-payload-app`, template blank, adapter Postgres). Dùng **pnpm**. TypeScript `strict: true`.
3. Tailwind CSS (bản stable mới nhất, đọc docs cấu hình với Next.js hiện tại).
4. ESLint + Prettier; script `lint`, `typecheck`, `format`, `test` (để trống, T0-02 điền).
5. Tạo khung thư mục theo mục 6 (thư mục rỗng có `.gitkeep`): `src/app/(site)`, `(habit)/habit`, `(eq)/eq-buddy`, `(account)/tai-khoan`, `src/collections`, `src/globals`, `src/puck/{blocks,templates,migrations}`, `src/components/{ui,brand,site,habit,eq}`, `src/lib/{payments,email,video,analytics,auth,i18n}`, `src/emails`, `tests/{unit,e2e}`, `seed/`, `public/brand/`.
6. `src/lib/i18n/vi.ts` khởi tạo với vài nhãn UI ("Gửi", "Đăng nhập").
7. `docker-compose.yml` chạy Postgres local cho dev.
8. `.env.example` đủ biến cần cho bước này (`DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`), `.gitignore` chặn `.env*` trừ `.env.example`.
9. Tạo `docs/DECISIONS.md` (ghi phiên bản Next.js, Payload, Node, pnpm và lý do), `docs/BACKLOG.md`, `docs/RUNBOOK.md` (khung: chạy local).
10. `README.md` ngắn: cách chạy local trong 5 bước.

**Không làm**: collections nghiệp vụ, UI, deploy.

**Tiêu chí nghiệm thu**

- [ ] `docker compose up -d && pnpm install && pnpm dev` → `/admin` hiện màn hình tạo user đầu tiên.
- [ ] `pnpm lint` và `pnpm typecheck` không lỗi.
- [ ] `AGENTS.md` nằm ở gốc repo.
- [ ] `docs/DECISIONS.md` có bảng phiên bản.

---

## T0-02 – CI và bộ khung test

**Phụ thuộc**: T0-01 · **Song song được với**: T0-03

**Phạm vi**

1. Vitest cho unit test (`tests/unit`), 1 test mẫu.
2. Playwright cho e2e (`tests/e2e`), 1 test smoke: mở `/admin` trả 200. Cấu hình viewport 375 và 1440.
3. GitHub Actions `ci.yml`: trên mỗi PR chạy install (cache pnpm) → lint → typecheck → vitest → build → playwright (dùng service Postgres trong CI).
4. Script `pnpm test`, `pnpm test:e2e`.

**Tiêu chí nghiệm thu**

- [ ] Mở PR thử thấy CI chạy và xanh.
- [ ] Cố ý làm hỏng 1 test → CI đỏ.

---

## T0-03 – Design tokens, font, brand SVG, `/styleguide`

**Phụ thuộc**: T0-01 · **Song song được với**: T0-02, T0-06

**Phạm vi**

1. 8 màu brand (AGENTS.md mục 5) thành CSS variables + Tailwind theme. **Không** để màu mặc định Tailwind (red, blue…) dùng được trong class — cấu hình thay thế palette, chỉ giữ `white`, `transparent`, `current` và 8 màu brand (+ biến thể opacity).
2. Font qua `next/font/google`, subset `vietnamese` + `latin`: Anton (H1/H2), Montserrat 400/600/700 (UI, đoạn văn), Playfair Display Italic (quote). Biến font: `--font-display`, `--font-ui`, `--font-quote`.
3. Thang spacing theo mục 5 "Khoảng thở"; bo góc `card` 16–24px; bóng nhẹ một mức.
4. Gradient nền pastel (tím – hồng – be – trắng) làm utility `bg-brand-gradient`.
5. SVG brand placeholder trong `src/components/brand/`: `HeartLine`, `ThinLine`, `Valve`, `Butterfly`, `Leaf`, `Logo` (đọc PNG từ `public/brand/`, nếu chưa có thì hiện khung chữ "LOGO – chờ file từ Hana"; min width 120px).
6. Trang `/styleguide` (chỉ hiện ở môi trường không phải production hoặc khi đăng nhập admin): bảng màu, mọi cỡ chữ với câu mẫu tiếng Việt có dấu đầy đủ ("Trạm Dừng Cảm Xúc – Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng."), tiêu đề 2 tầng màu, icon brand.

**Tiêu chí nghiệm thu**

- [ ] `/styleguide` hiển thị Anton có dấu tiếng Việt đúng (chụp ảnh "Ữ, Ộ, Ặ, Ỷ" trong PR).
- [ ] Dùng class `bg-red-500` → không có hiệu lực / lint báo.
- [ ] Đẹp ở 375px và 1440px.

---

## T0-04 – UI primitives

**Phụ thuộc**: T0-03

**Phạm vi** (`src/components/ui/`, mỗi component có variant hiển thị trên `/styleguide`):
`Button` (primary accent-pink / secondary / ghost; size S/M/L; trạng thái loading, disabled; render được dạng link) · `Card` · `SectionHeader` (seriesLabel + title dòng 1 navy + title dòng 2 magenta + emotionLine Playfair) · `QuoteBlock` · `PriceTag` (giá gốc gạch ngang + giá ưu đãi, định dạng `250.000đ` bằng một hàm `formatVnd` dùng chung, có unit test) · `StatusBadge` (5 `saleStatus`) · `Modal` · `Toast`.

Yêu cầu chung: điều hướng bàn phím, focus ring rõ, tương phản WCAG AA (ghi cặp màu nào đạt/không đạt vào DECISIONS.md), không nhận prop màu tự do — chỉ nhận token brand.

**Tiêu chí nghiệm thu**

- [ ] Tất cả hiện trên `/styleguide` ở 375 và 1440.
- [ ] Unit test `formatVnd` (0, 149000, 1750000, null).
- [ ] Modal đóng bằng Esc và trả focus về nút mở.

---

## T0-05 – UI composites

**Phụ thuộc**: T0-04

**Phạm vi**: `ProductCard` (nhận object product, chưa gắn logic CTA – T1-08 làm) · `TestimonialCard` (không hiện `role` nếu `consent` false – logic ở component, có test) · `LeadForm` (UI thuần: tên, email, checkbox consent, nút gửi; nhận `onSubmit`, chưa gọi API) · `EmotionPicker` (bộ cảm xúc cố định khai báo trong `src/lib/emotions.ts`) · `ProgressGrid` (21 ô, trạng thái done / missed / today / future / locked) · `Navbar`, `Footer` (khung tĩnh, dữ liệu truyền qua props; T1-05 nối CMS).

**Tiêu chí nghiệm thu**

- [ ] Tất cả hiện trên `/styleguide` với dữ liệu giả.
- [ ] `ProgressGrid` không cho bấm ô `future`.
- [ ] Navbar mobile có menu mở/đóng, dùng được bằng bàn phím.

---

## T0-06 – Collections nội dung, globals, media

**Phụ thuộc**: T0-01 · **Song song được với**: T0-03..05 (khác thư mục)

**Phạm vi** (theo AGENTS.md mục 7 + GAPS mục A/B):

1. `media` + plugin storage S3 tương thích (Cloudflare R2); local disk khi thiếu biến môi trường. `alt` bắt buộc.
2. Collections: `products`, `services`, `programs`, `posts`, `testimonials`, `eqCards`, `courseModules`, `lessons`, `diagnosticQuestions`, `techniques`, `legalPages`, `workshops` (GAPS A1), `pages` (là collection – GAPS B1; `puckData` JSON, `template`, `seo`, bật drafts + versions + autosave).
3. `products`: `totalValue` và `discountPercent` là field **chỉ đọc, tính bằng hook** từ `components[]` và giá bán. Viết hàm thuần `computePackageValue()` trong `src/lib/pricing.ts` + unit test khớp bảng 3 gói (2.500.000 / 5.800.000 / 10.800.000; 30% / 50% / 60%). Field `trialDays`, `accessDurationDays`, `saleEndsAt`, `externalUrl`, `externalLabel` đầy đủ.
4. `eqCards.printedAt` + hook khóa `qrSlug` khi đã in (GAPS A7), có test.
5. `testimonials`: validate – không publish được nếu `consent` false.
6. Field ẩn `isSample` ở các collection nội dung (GAPS A9).
7. Globals: `siteSettings` (gộp, chia tab – GAPS B7, gồm `brandAscii`, `domain`, `shopeeStoreUrl`, `trialCreditApplies=false`, VietQR, `zaloChatUrl`, `showFloatingChat`, `certificateMinDays=15`, `sellerInfo`, analytics), `navigation` (menu chính + footer, mục trỏ tới `pages` hoặc URL).
8. Nhãn admin tiếng Việt (label collection, field, description giúp Hana hiểu field dùng làm gì). Nhóm collection trong sidebar: Nội dung / Bán hàng / Khóa học / EQ Buddy / Hệ thống.
9. Access: public chỉ đọc `published`; tạm thời admin đã đăng nhập toàn quyền (T0-07 làm phân quyền chi tiết).
10. Migration Payload cho toàn bộ schema.

**Tiêu chí nghiệm thu**

- [ ] Vào `/admin` thấy đủ collection, nhãn tiếng Việt, nhóm sidebar.
- [ ] Tạo gói thử với 3 cấu phần → `totalValue`, `discountPercent` tự tính, không sửa tay được.
- [ ] Unit test pricing + khóa qrSlug xanh.
- [ ] Upload ảnh không có alt → bị chặn.

---

## T0-07 – Collections người dùng, giao dịch và phân quyền **[REVIEW]**

**Phụ thuộc**: T0-06

**Phạm vi**

1. `users` (admin) với role `owner` / `editor`; user đầu tiên tự là `owner`.
2. `customers` (chưa bật login OTP – GĐ 2), `entitlements` (index duy nhất `customer + product` khi `source = trial`; enforce bằng DB constraint **và** hook), `orders` (+ `termsAcceptedAt`, `createdByAdmin`, `payToken` – GAPS A5, A8; `paymentRef` duy nhất), `discountCodes`, `leads`, `habitPlans`, `habitCheckins` (duy nhất plan+day), `savedCards`, `diagnosticResults`, `certificates` (+ `isPublic` – A6), `lessonProgress` (A2), `otpCodes` (A3, ẩn khỏi admin), `paymentEvents`, `auditLogs` (A4).
3. Hàm access tập trung trong `src/lib/auth/access.ts`: `isOwner`, `isEditorOrOwner`, `isSelfCustomer`, `publishedOnly`. Áp đúng bảng phân quyền AGENTS.md mục 7:
   - `editor`: sửa nội dung; không xóa `orders`, không sửa tab Thanh toán của `siteSettings`, không đọc `paymentEvents`/`auditLogs`.
   - Dữ liệu cảm xúc (`habitCheckins.emotion`, `note`, `savedCards.reflection`) **ẩn với editor** (field-level access).
   - Customer chỉ đọc/sửa dữ liệu của chính mình.
4. `paymentRef` generator: `TDCX` + 5 ký tự không nhầm lẫn (bỏ 0/O/1/I), kiểm tra trùng. Unit test.
5. `orders`: không có field hoàn tiền, không có địa chỉ giao hàng.
6. Đánh dấu `// REVIEW-REQUIRED:` ở mọi hàm access và hook liên quan entitlement/order.
7. Test bắt buộc (`tests/unit/access.test.ts`) dùng Local API: editor không xóa được order; editor không đọc được emotion; anonymous không đọc được draft; tạo trial entitlement lần 2 cùng customer+product → lỗi.

**Tiêu chí nghiệm thu**

- [ ] Toàn bộ test phân quyền xanh, liệt kê trong báo cáo.
- [ ] Đăng nhập bằng tài khoản editor: không thấy nút xóa đơn, không thấy tab Thanh toán.
- [ ] IT đã review và approve PR.

---

## T0-08 – Seed dữ liệu MẪU

**Phụ thuộc**: T0-07

**Phạm vi**

1. Script `pnpm seed` (idempotent; chạy 2 lần không nhân đôi). **Chỉ tạo/sửa/xóa bản ghi `isSample = true`**; từ chối chạy khi `NODE_ENV=production` trừ khi có cờ `--allow-prod`.
2. Nội dung seed:
   - 13 offer theo bảng danh mục trong file Planning (giá tạm như AGENTS.md; `saleStatus` đúng; Thinking Mirror và 2 chương trình B2B = `consult`).
   - 3 gói CLEAR / BUILD / SHINE với `components[]` đúng bảng, `grantsProduct` trỏ tới Habit Tracker số và EQ Buddy số.
   - Habit Tracker số và EQ Buddy số: `price` 250000, `salePrice` 178000, `trialDays` 21.
   - Bộ thẻ vật lý: `type = physical_external`, `externalUrl` = placeholder Shopee.
   - 16 `diagnosticQuestions`, 11 `techniques`, 20 `lessons` trong 4 module: lấy từ file Excel Habit Hack ở `docs/source/` nếu có; **nếu không có, tạo placeholder ghi rõ "[MẪU] Tình huống 1"…** và báo trong báo cáo.
   - 6 `legalPages` có tiêu đề + slug đúng AGENTS.md 8.1, nội dung rỗng.
   - 3 `eqCards` mẫu, 3 `testimonials` mẫu (`consent=false`, tên "[MẪU]").
   - `siteSettings` mặc định, `navigation` với menu đúng mục 8.1.
3. Mọi text mẫu bắt đầu bằng `[MẪU]` để Hana nhận ra.

**Tiêu chí nghiệm thu**

- [ ] DB trống → `pnpm seed` → admin có đủ dữ liệu; chạy lần 2 không nhân đôi.
- [ ] Tạo 1 product thật (không `isSample`) → chạy seed → product đó còn nguyên.
- [ ] Báo cáo liệt kê dữ liệu nào là placeholder do thiếu file nguồn.

---

## T0-09 – Puck editor + 5 khối đầu tiên **[SPIKE]**

**Phụ thuộc**: T0-05, T0-06

**Spike (làm trước, tối đa 2 giờ, ghi kết quả vào DECISIONS.md)**: đặt editor tại `/admin/builder/[pageId]` song song với route catch-all của Payload có chạy ổn không (layout riêng, auth). Nếu không ổn → dùng `/builder/[pageId]` hoặc custom view của Payload. Báo phương án chọn trước khi làm tiếp.

**Phạm vi**

1. Cài `@puckeditor/core` (đọc docs puckeditor.com cho đúng phiên bản). Cấu hình `src/puck/config.ts`.
2. Route editor chỉ cho user Payload đã đăng nhập (kiểm tra session phía server) **[REVIEW nhẹ: guard route]**.
3. Nút **"Chỉnh sửa trực quan"** trong màn hình sửa `pages` của Payload, mở editor.
4. 5 khối: `HeroTwoEntries`, `SectionHeader`, `RichText`, `ImageText`, `CTAButton`. Mỗi khối render bằng component trong `src/components/`; có field `version`.
5. Brand-safe fields: màu = dropdown 8 màu; spacing / cỡ chữ = S/M/L; ảnh chọn từ collection `media` (bắt buộc alt). Không color picker, không ô CSS.
6. Lưu nháp / Xuất bản tách riêng, dùng drafts của Payload. Trang công khai chỉ đọc bản published.
7. Viewport preview 375 / 768 / 1440.
8. Trang công khai `src/app/(site)/[...slug]/page.tsx` + trang chủ `/` render `puckData` bằng `<Render>`; revalidate khi xuất bản (`revalidatePath`/tag).
9. Nhãn editor tiếng Việt (tên khối, field, nút).
10. Test: snapshot render 5 khối; Playwright "kéo Hero vào trang trống → sửa tiêu đề → xuất bản → trang công khai hiện đúng".

**Không làm**: khối còn lại, mẫu trang, khóa khối, autosave 30s (T1-04).

**Tiêu chí nghiệm thu**

- [ ] Người không biết code dựng được 1 trang từ 5 khối và xuất bản (Planning tự thử).
- [ ] Sửa nháp sau khi xuất bản → trang công khai chưa đổi cho tới khi bấm Xuất bản.
- [ ] Chưa đăng nhập vào URL editor → chuyển về trang login.
- [ ] Playwright xanh trên CI.

---

## T0-10 – Deploy preview

**Phụ thuộc**: T0-01, tài khoản do IT cấp (GAPS D1, D2) · **Song song được với**: mọi task sau T0-01

**Phạm vi**

1. Kết nối repo với Vercel; preview cho mỗi PR, production từ `main`.
2. Neon Postgres: DB production + branch cho preview (nếu dùng tích hợp Neon–Vercel). Chạy migration tự động lúc build (`payload migrate`).
3. Cloudflare R2 bucket cho media; biến môi trường trên Vercel.
4. Cập nhật `docs/RUNBOOK.md`: deploy, rollback (Vercel instant rollback), backup DB (Neon PITR / snapshot hằng ngày giữ 14 ngày), khôi phục, nơi đặt secret.
5. `.env.example` cập nhật đủ biến.

**Tiêu chí nghiệm thu**

- [ ] Link preview của một PR mở được `/admin` và `/styleguide`.
- [ ] Upload ảnh trên preview → file nằm trong R2.
- [ ] RUNBOOK có các bước rollback mà IT làm theo được.

---

## T0-11 – Ước lượng GĐ 1–4 + hướng dẫn CMS nháp **[HANA]**

**Phụ thuộc**: tất cả task GĐ 0

**Phạm vi**

1. Ước lượng từng task GĐ 1 (`docs/tasks/GD1.md`) và từng epic GĐ 2–4 (`docs/plan/MASTER_PLAN.md` mục 5) theo ngày công, ghi rủi ro kỹ thuật. Đề xuất tách / gộp task nếu cần. Ghi vào `docs/plan/ESTIMATES.md`.
2. `docs/HUONG_DAN_CMS.md` bản nháp cho đúng phạm vi cổng GĐ 0: đăng nhập, tạo sản phẩm, dựng trang bằng kéo thả, xuất bản. Tiếng Việt, câu ngắn, có ảnh chụp màn hình.
3. Chuẩn bị tài khoản `owner` cho Hana trên preview (gửi lời mời qua email, không gửi mật khẩu qua chat).

**Tiêu chí nghiệm thu (= cổng GĐ 0)**

- [ ] Hana tự đăng nhập, tạo 1 sản phẩm, dựng 1 trang từ 5 khối và xuất bản theo hướng dẫn, không cần hỗ trợ.
- [ ] `ESTIMATES.md` được Planning duyệt; Master Plan cập nhật lịch.
