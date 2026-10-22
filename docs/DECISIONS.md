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
| **Page Builder**     | `@puckeditor/core` `0.23.0` (MIT)                       | Trình dựng trang trực quan mã nguồn mở, ghim phiên bản stable 0.23.0 tương thích React 19 / Next.js 16 (Task T0-09).                                                                                               |

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

---

## 3. Bảng tương phản màu sắc thương hiệu & Tiêu chuẩn WCAG AA (Task T0-04)

Đo lường độ tương phản giữa các token màu của Brand Book 2026 trên nền sáng (`warm-ivory`, `white`, `soft-pink`, v.v.):

| Cặp màu (Chữ / Nền)                                 | Tỉ lệ tương phản | AA Chữ thường (≥ 4.5:1) | AA Chữ lớn (≥ 3.0:1) | Ghi chú & Quy tắc áp dụng                                                                                                                                                                                             |
| --------------------------------------------------- | ---------------- | ----------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deep-navy` (#280A60) / `warm-ivory` (#FAF7F4)      | **15.11:1**      | ✅ Đạt                  | ✅ Đạt               | Màu chữ chính cho toàn bộ body, tiêu đề chính, card trên nền trang.                                                                                                                                                   |
| `deep-navy` (#280A60) / `white` (#FFFFFF)           | **16.52:1**      | ✅ Đạt                  | ✅ Đạt               | Chữ trên nền card trắng, modal, input.                                                                                                                                                                                |
| `deep-navy` (#280A60) / `mint-haze` (#D9F1EA)       | **13.92:1**      | ✅ Đạt                  | ✅ Đạt               | Chữ trên badge thành công, tracker trạng thái.                                                                                                                                                                        |
| `deep-navy` (#280A60) / `butter-cream` (#F6E9B8)    | **13.14:1**      | ✅ Đạt                  | ✅ Đạt               | Chữ trên badge tư vấn, highlight.                                                                                                                                                                                     |
| `deep-navy` (#280A60) / `lavender-mist` (#E9DDF9)   | **11.23:1**      | ✅ Đạt                  | ✅ Đạt               | Chữ trên section phụ, card lavender.                                                                                                                                                                                  |
| `deep-navy` (#280A60) / `soft-pink` (#FDE6F6)       | **13.56:1**      | ✅ Đạt                  | ✅ Đạt               | Chữ trên card soft-pink.                                                                                                                                                                                              |
| `bright-magenta` (#BC039E) / `warm-ivory` (#FAF7F4) | **5.40:1**       | ✅ Đạt                  | ✅ Đạt               | Dòng 2 tiêu đề, series label chữ nhỏ, điểm nhấn.                                                                                                                                                                      |
| `bright-magenta` (#BC039E) / `white` (#FFFFFF)      | **5.90:1**       | ✅ Đạt                  | ✅ Đạt               | Tiêu đề tầng 2, link quan trọng trên nền trắng.                                                                                                                                                                       |
| `bright-magenta` (#BC039E) / `soft-pink` (#FDE6F6)  | **4.89:1**       | ✅ Đạt                  | ✅ Đạt               | Nhãn sắp ra mắt trên nền soft-pink.                                                                                                                                                                                   |
| `white` (#FFFFFF) / `deep-navy` (#280A60)           | **16.52:1**      | ✅ Đạt                  | ✅ Đạt               | Nút `secondary` (nền deep-navy chữ trắng), nền tối.                                                                                                                                                                   |
| `white` (#FFFFFF) / `accent-pink` (#EF3B83)         | **3.73:1**       | ❌ Không đạt            | ✅ Đạt (chữ lớn)     | Nút CTA chính `primary`: Bắt buộc dùng **chữ lớn ≥ 18.66px đậm** (Montserrat 700) ở size MD/LG. Size SM tự động fallback sang `secondary`. (Chờ Hana chốt Q13).                                                       |
| `accent-pink` (#EF3B83) / `warm-ivory` (#FAF7F4)    | **3.50:1**       | ❌ Không đạt            | ✅ Đạt (chữ lớn)     | Tuyệt đối **không** dùng `accent-pink` cho chữ thường < 18.66px trên nền sáng. Chỉ dùng cho icon SVG (HeartLine), viền, hoặc link chữ lớn. Link chữ nhỏ dùng `bright-magenta` (5.40:1) hoặc `deep-navy` có gạch chân. |
| `deep-navy/85` / `white` (#FFFFFF)                  | **10.75:1**      | ✅ Đạt                  | ✅ Đạt               | Chữ mô tả nội dung trong card, modal.                                                                                                                                                                                 |
| `deep-navy/75` / `mint-haze` (#D9F1EA)              | **7.01:1**       | ✅ Đạt                  | ✅ Đạt               | Chữ phụ trợ trên thông báo Toast thành công.                                                                                                                                                                          |
| `deep-navy/70` / `white` (#FFFFFF)                  | **6.43:1**       | ✅ Đạt                  | ✅ Đạt               | Giá gốc gạch ngang trong `PriceTag` trên nền trắng (T0-04b).                                                                                                                                                          |
| `deep-navy/70` / `warm-ivory` (#FAF7F4)             | **6.00:1**       | ✅ Đạt                  | ✅ Đạt               | Giá gốc gạch ngang trong `PriceTag` trên nền trang (T0-04b).                                                                                                                                                          |
| `deep-navy/60` / `warm-ivory` (#FAF7F4)             | **4.52:1**       | ✅ Đạt                  | ✅ Đạt               | Chữ phụ trợ cấp 3 (sát ngưỡng tối thiểu 4.5:1).                                                                                                                                                                       |

### Quy tắc bất di bất dịch cho UI components:

1. **Không có bất kỳ cặp chữ thường nào hiển thị với tỉ lệ tương phản < 4.5:1.** (Giá gốc gạch ngang trong `PriceTag` sử dụng tối thiểu `deep-navy/70` đạt 6.43:1, không dùng các mức mờ dưới `/70`).
2. **Nút bấm CTA `primary` luôn có chữ lớn ≥ 18.66px đậm hoặc fallback sang `secondary` (ở size S).**
3. **Toàn bộ logic màu nút được tập trung tại `BUTTON_STYLES` trong `src/components/ui/Button.tsx` để dễ dàng chuyển đổi khi Q13 được Hana phê duyệt.**
4. **Trạng thái focus (`focus-visible`) luôn có viền nét 2px `deep-navy` với `offset 2px`, đảm bảo nhận diện rõ ràng cho người dùng điều hướng bằng bàn phím.**

---

## T0-05 – UI Composites & Bảng màu tương phản mở rộng

### 1. Bộ cảm xúc mẫu cho EmotionPicker (PENDING Q14)

Theo Brand Book 2026 và nguyên tắc `tdcx-brand`, tuyệt đối **không sử dụng emoji** trong hệ thống.
Tạm thời định nghĩa 6 cảm xúc mẫu với biểu tượng SVG nét mảnh (`strokeWidth="1.5"`, `stroke="currentColor"`) trong `src/lib/emotions.ts`:

- `calm`: **Bình yên** (Icon mặt trời mọc trên sóng nước tĩnh lặng)
- `grateful`: **Biết ơn** (Icon trái tim tỏa tia sáng)
- `energized`: **Hào hứng** (Icon mặt trời tỏa năng lượng)
- `overwhelmed`: **Quá tải** (Icon đám mây tích tụ sóng cảm xúc)
- `tired`: **Mệt mỏi** (Icon vầng trăng khuyết và dấu lặng)
- `anxious`: **Lo âu** (Icon nhịp tim dao động quanh điểm cân bằng)

> **PENDING Q14**: Danh sách 6 cảm xúc trên là placeholder mẫu, được đánh dấu `// PENDING Q14` để chờ Hana rà soát và chốt chính thức theo bộ tài liệu chuyên môn.

### 2. Cặp màu mới trong UI Composites & Độ tương phản WCAG AA

| Cặp màu (Chữ / Nền)                                | Tỉ lệ tương phản | AA Chữ thường (≥ 4.5:1) | AA Chữ lớn (≥ 3.0:1) | Ghi chú & Nơi áp dụng                                                                      |
| -------------------------------------------------- | ---------------- | ----------------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| `bright-magenta` (#BC039E) / `soft-pink` (#FDE6F6) | **4.89:1**       | ✅ Đạt                  | ✅ Đạt               | Banner thông báo lỗi hệ thống / máy chủ trong `LeadForm`.                                  |
| `deep-navy` (#280A60) / `soft-pink` (#FDE6F6)      | **13.56:1**      | ✅ Đạt                  | ✅ Đạt               | Nút radio cảm xúc đang chọn trong `EmotionPicker`, nút quiz trên Navbar mobile.            |
| `deep-navy` (#280A60) / `mint-haze` (#D9F1EA)      | **13.92:1**      | ✅ Đạt                  | ✅ Đạt               | Ô ngày hoàn thành (`done`) trong `ProgressGrid`, khung thông báo thành công `LeadForm`.    |
| `deep-navy/80` / `mint-haze` (#D9F1EA)             | **8.05:1**       | ✅ Đạt                  | ✅ Đạt               | Dòng phụ đề thông báo gửi form thành công trong `LeadForm`.                                |
| `deep-navy/70` / `soft-pink/40`                    | **6.25:1**       | ✅ Đạt                  | ✅ Đạt               | Ô ngày đã lỡ (`missed`) trong `ProgressGrid`.                                              |
| `deep-navy/40` / `white/50`                        | **2.50:1**       | ⚠️ Miễn trừ             | ⚠️ Miễn trừ          | Chữ ô ngày chưa tới (`future`) trong `ProgressGrid` (nút `disabled`, WCAG 1.4.3 miễn trừ). |
| `deep-navy/30` / `warm-ivory`                      | **1.90:1**       | ⚠️ Miễn trừ             | ⚠️ Miễn trừ          | Chữ ô ngày đã khóa (`locked`) trong `ProgressGrid` (nút `disabled`, WCAG 1.4.3 miễn trừ).  |

### 3. Quyết định kiến trúc & Quy chuẩn A11y cho các Composite Components:

1. **ProductCard**: Khi `saleStatus === 'hidden'`, component trả về `null` (không sinh HTML/DOM rác). CTA nhận qua ReactNode slot `cta` để không can thiệp logic mua bán / phân quyền trước T1-08. Ảnh bìa bắt buộc có `src` và `alt` đi qua `next/image`.
2. **TestimonialCard**: Tuyệt đối tuân thủ AGENTS.md mục 7: Chỉ hiển thị khi có `consent === true`. Khi `consent === false`, trả về `null`. Bọc `<blockquote>` và `<figcaption>` trong thẻ ngữ nghĩa `<figure>`. Sử dụng font Playfair Display Italic (`font-quote`) cho câu trích dẫn cảm xúc.
3. **LeadForm**: Biểu mẫu UI client an toàn (`'use client'`):
   - Sinh ID động bằng `useId()` để tránh xung đột khi nhiều form xuất hiện trên cùng một trang.
   - Tích hợp ô honeypot ẩn hoàn toàn (`tabIndex={-1}`, `autoComplete="off"`, `aria-hidden="true"`, ẩn qua CSS/screen reader) để bẫy bot spam.
   - Bắt buộc đồng ý nhận tin và dẫn link tới trang chính sách bảo mật qua prop `privacyHref`.
   - Báo lỗi tiếng Việt ngay dưới từng ô input, không dùng placeholder thay thế nhãn hiển thị.
4. **EmotionPicker**: Chuẩn WAI-ARIA Radio Group (`'use client'`): hỗ trợ phím mũi tên (ArrowLeft/Right/Up/Down) để chuyển đổi giữa các cảm xúc, `aria-checked`, ID sinh động bằng `useId()`, và kích thước vùng bấm tối thiểu 44px × 44px trên di động.
5. **ProgressGrid**: Lưới 21 ngày (`'use client'`) tương thích tốt ở độ rộng 375px. Trạng thái ngày hoàn thành (`done`) không chỉ dựa vào màu sắc mà có thêm icon hoàn thành / icon cảm xúc đi kèm (tuân thủ WCAG 1.4.1). Ngày chưa tới (`future`, tương phản 2.50:1) và ngày đã khóa (`locked`, tương phản 1.90:1) bị vô hiệu hóa `disabled` và không kích hoạt sự kiện bấm; mức tương phản này được chấp nhận theo quy chuẩn WCAG 2.1 Tiêu chí 1.4.3 (miễn trừ yêu cầu độ tương phản đối với các thành phần giao diện không hoạt động / `disabled`).
6. **Navbar**: Component client (`'use client'`) hỗ trợ mở drawer trên di động có `aria-expanded`, phím Escape đóng drawer và trả focus về nút mở. Hiển thị mục nổi bật (`featured`, nhãn `shortLabel ?? label`) trên thanh top bar di động với vùng chạm tối thiểu 44px. Không tự chế nút hoặc dò tìm nhãn text.
7. **Footer**: Component server chuẩn. Tự động sắp xếp các trang pháp lý theo thuộc tính `order`. Tự động ẩn các khối không có dữ liệu (`sellerInfo`, `socialLinks`, `tagline`, `legalLinks`). Năm bản quyền được tính tự động từ hệ thống. Không chứa dữ liệu mẫu hoặc thông tin người bán gắn cứng.

---

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

- **T0-06b (sau nghiệm thu)**: chuẩn hóa slug trang trong `beforeValidate`: giữ `/` cho trang chủ, bỏ khoảng trắng và dấu `/` ở hai đầu trang khác, chặn `//` bên trong bằng lỗi tiếng Việt. Không đổi schema hay tạo migration. `printedAt` so theo thời điểm (`getTime`); lỗi đổi/xóa ngày in thuộc trường `printedAt`. Tài liệu dùng helper `file()` với mô tả PDF. Ảnh nghiệm thu chuyển sang `docs/tasks/reviews/T0-06-admin-sidebar.png`. Test tạo admin đầu tiên và smoke form bỏ qua có lý do trên DB local đã có admin; CI không áp dụng điều kiện bỏ qua này.

- **T0-06c (múi giờ test & máy chủ)**:
  - Máy chủ (Node.js và PostgreSQL) luôn chạy theo UTC để thống nhất giữa local dev (Windows/macOS/Linux), CI (GitHub Actions) và Production (Vercel, Neon, Docker).
  - Cố định múi giờ UTC trong cấu hình test: `vitest.config.mts` (`test.env` với `TZ: 'UTC'`, `PGTZ: 'UTC'`), `tests/unit/global-setup.ts`, `vitest.setup.ts`, script `test` trong `package.json` (`cross-env TZ=UTC PGTZ=UTC vitest run`), và Playwright `webServer.env` (`TZ: 'UTC'`, `PGTZ: 'UTC'`).
  - Cấu hình PostgreSQL adapter trong `src/payload.config.ts`: `pool.options: '-c timezone=UTC'` đảm bảo mọi kết nối đến PostgreSQL (kể cả dịch vụ Postgres cài trên máy local của developer có múi giờ `Asia/Bangkok` UTC+7) đều chạy ở session timezone UTC, ngăn ngừa sai lệch 7 giờ khi lưu/đọc các giá trị ngày/giờ không kèm timezone offset.
  - Quy tắc nghiệp vụ tính ngày: Mọi tính toán "ngày" nghiệp vụ (trial 21 ngày, tracker, nhắc email, ngày in) phải quy đổi tường minh theo múi giờ chuẩn của dự án là `Asia/Ho_Chi_Minh` (GAPS B9), không dựa vào múi giờ của máy trạm dev hay máy chủ. Không đổi kiểu field `printedAt` hay dữ liệu đã lưu.

---

## T0-09 – Kết quả Spike Puck Editor & Kiến trúc tích hợp (05/10/2026)

### 1. Kết quả trả lời 4 câu hỏi Spike

#### Câu 1: Route editor và quan hệ với catch-all của Payload

- **Khảo sát:**
  - Route Payload Admin nằm tại `src/app/(payload)/admin/[[...segments]]/page.tsx` và chịu sự chi phối của layout cha `src/app/(payload)/layout.tsx`. Layout này bắt buộc nạp `@payloadcms/next/css`, `custom.scss` và bọc toàn bộ bằng `<RootLayout>`.
  - Nếu đặt editor trực tiếp bên trong `(payload)`, Puck sẽ bị áp đặt toàn bộ CSS admin và thanh điều hướng của Payload, làm hỏng giao diện visual builder full-screen.
  - Do đó, editor **bắt buộc** phải nằm trong một route group riêng: `src/app/(builder)` với `layout.tsx` độc lập (chỉ nạp stylesheet của Puck `@puckeditor/core/dist/index.css` và font/base styles).
- **So sánh 2 phương án:**
  - **Phương án A (`/admin/builder/[pageId]` - đặt tại `src/app/(builder)/admin/builder/[pageId]/page.tsx`):**
    - Nhờ cơ chế route specificity của Next.js App Router, `/admin/builder/[pageId]` (chứa segment tĩnh `builder` và segment động `[pageId]`) có độ ưu tiên cao hơn optional catch-all `/admin/[[...segments]]`. Đã kiểm chứng qua thuật toán sắp xếp `getSortedRoutes` của Next.js: `/admin/builder/[pageId]` luôn được xếp trước `/admin/[[...segments]]`.
    - Ưu điểm: URL mang tiền tố `/admin/` thống nhất cho khu vực quản trị viên.
    - Nhược điểm / Rủi ro: Cả hai route group `(payload)` và `(builder)` cùng chia sẻ URL prefix `/admin/`. Mặc dù Next.js phân giải đúng, việc chia sẻ namespace này có thể phát sinh cảnh báo build hoặc xung đột tiềm ẩn nếu Payload trong tương lai đăng ký thêm route con.
  - **Phương án B (Khuyến nghị: `/builder/[pageId]` - đặt tại `src/app/(builder)/builder/[pageId]/page.tsx`):**
    - Hoàn toàn tách biệt khỏi prefix `/admin/`.
    - Ưu điểm: Độc lập 100%, triệt tiêu hoàn toàn rủi ro xung đột với catch-all của Payload.
    - Bảo mật: Hoàn toàn tương đương Phương án A vì việc bảo vệ route thực hiện qua cookie session của Payload bằng `payload.auth({ headers })` trên server component. Nếu chưa đăng nhập, tự động chuyển hướng về `/admin/login?redirect=${encodeURIComponent('/builder/' + pageId)}`.
    - Nút trong CMS: Nút "Chỉnh sửa trực quan" (field UI) trong collection `pages` chỉ cần mở `/builder/${pageId}` trong tab mới (`target="_blank"`).
- **Đề xuất trình Planning:** Ưu tiên **Phương án B (`/builder/[pageId]`)** để an toàn tuyệt đối và đơn giản hóa kiến trúc; nếu Planning muốn giữ URL dưới `/admin/`, **Phương án A (`/admin/builder/[pageId]`)** đã được kiểm chứng hoạt động tốt trong spike.

#### Câu 2: Guard đăng nhập phía server

- **Cách thức thực hiện:**
  - Thực hiện trực tiếp trong Server Component của trang builder (`page.tsx`):
    ```ts
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const { user } = await payload.auth({ headers })
    if (!user) {
      redirect(`/admin/login?redirect=${encodeURIComponent(`/admin/builder/${pageId}`)}`)
    }
    ```
  - Khi chưa đăng nhập hoặc cookie JWT `payload-token` không hợp lệ/hết hạn, server ném lệnh chuyển hướng `redirect()` về `/admin/login`. Sau khi đăng nhập thành công tại Payload admin, Payload tự động đưa người dùng trở lại URL trong tham số `redirect`.
  - Toàn bộ thao tác nạp dữ liệu trang (`findByID`) được thực hiện với `draft: true`, truyền đối tượng `user` đã xác thực và đặt `overrideAccess: false`.
  - Các thao tác "Lưu nháp" và "Xuất bản" gọi Server Action trên server, tự động xác thực lại `payload.auth({ headers })` trước khi ghi xuống database để chống giả mạo quyền từ client.
  - Tất cả các vị trí guard route và server action đều được đánh dấu `// REVIEW-REQUIRED:`.

#### Câu 3: Phiên bản `@puckeditor/core`

- **Phiên bản được chọn:** `@puckeditor/core@0.23.0` (ghim cứng trong `package.json`, không dùng ký tự `^` hay `~`).
- **Khảo sát:**
  - `0.23.0` là bản release stable mới nhất trên npm registry (phát hành tháng 08/2026; các bản 0.24.x hiện tại đều là canary chưa ổn định).
  - Khai báo peerDependencies `react: "^18.0.0 || ^19.0.0"`, tương thích hoàn toàn với React `19.2.6` và Next.js `16.3.3` trong dự án.
  - Thử nghiệm thực tế: Cài đặt sạch qua pnpm, `tsc --noEmit` và `eslint` đều vượt qua không có lỗi.

#### Câu 4: Khả năng RichText của Puck và phương án thực hiện

- **Khảo sát tính năng:**
  - `@puckeditor/core@0.23.0` **có sẵn** field type `type: "richtext"` (`RichtextField`), tích hợp Tiptap / ProseMirror.
  - Khi render, Puck sử dụng `RichTextRender` tự động chuyển AST sang HTML bằng `generateHTML` và đưa vào DOM qua `dangerouslySetInnerHTML`.
- **Đánh giá Brand Safety & Bảo mật:**
  - Tiptap mặc định cho phép người dùng tự do format (headings, alignment, màu sắc), dễ dẫn tới việc vi phạm quy chuẩn typography của Brand Book 2026 (tiêu đề Anton cố định, 8 màu token, không dùng font/size tùy tiện).
  - Sử dụng `dangerouslySetInnerHTML` với HTML thô có nguy cơ bảo mật nếu nội dung copy-paste từ nguồn ngoài chứa mã độc.
- **Phương án đề xuất:**
  - **Phương án 1 (Khuyến nghị theo spec GD0.md): Khối `RichText` dùng `type: "textarea"` phân đoạn.**
    - Nội dung chia nhiều đoạn bằng dấu xuống dòng đôi (`\n\n`).
    - Render an toàn: Tách mảng đoạn văn bản và render thành các thẻ `<p>` ngữ nghĩa với font Montserrat Regular, khoảng cách chuẩn brand, 100% không dùng `dangerouslySetInnerHTML` và zero XSS surface.
  - **Phương án 2: Dùng `type: "richtext"` built-in của Puck với cấu hình hạn chế (restricted options):**
    - Tắt hoàn toàn việc tạo heading, chỉ cho phép `bold`, `italic`, `bulletList`, `orderedList` và `link`.
    - Phải viết CSS giới hạn typography cho container `.rich-text`.
- **Đề xuất trình Planning:** Áp dụng **Phương án 1** (`textarea` phân đoạn) cho khối `RichText` trong GĐ 0 để đảm bảo tính an toàn và chuẩn nhận diện thương hiệu cao nhất.

### 2. Rủi ro kỹ thuật còn lại & Kế hoạch xử lý

1. **Tránh xung đột giao diện / font:** Route Puck editor chạy dưới layout `(builder)` không dùng chung global CSS với `(payload)` hay `(site)`. Cần đảm bảo các font Google (`Montserrat`, `Anton`, `Playfair Display`) được nạp chuẩn trong `BuilderLayout` để component hiển thị trực quan trong canvas editor giống hệt trang thật.
2. **Xử lý revalidation khi xuất bản:** Hook `afterChange` trong `Pages.ts` cần gọi `revalidatePath` cho đúng đường dẫn slug (đặc biệt slug `/` cho trang chủ và `/slug` cho trang con) để người dùng bên ngoài nhìn thấy ngay nội dung mới nhất.
3. **Nút "Chỉnh sửa trực quan" trong Payload:** Cần khai báo một custom field `type: 'ui'` trong `src/collections/Pages.ts`. Field này chỉ hiển thị nút bấm điều hướng sang editor, không sinh cột database nên không gây thay đổi migration.

---

### 3. Quyết định chính thức sau duyệt Spike (Planning approved 05/10/2026)

1. **Lệch AGENTS.md 5B: Editor đặt tại `/builder/[pageId]` thay vì `/admin/builder/[pageId]`:**
   - **Lý do:** Hai root layout `(payload)` và `(builder)` cùng chia sẻ tiền tố `/admin` dễ gây xung đột tiềm tàng hoặc vỡ router khi Payload đăng ký thêm route nội bộ; việc tách hẳn sang route group `(builder)` tại `/builder/[pageId]` giúp cô lập CSS hoàn toàn (không bị CSS admin Payload đè), đồng thời guard xác thực phía server và cơ chế render độc lập, rõ ràng và ổn định tuyệt đối (theo GAPS B5).
   - Xóa bỏ toàn bộ mã nguồn và test liên quan đến Route A (`getSortedRoutes`).
2. **Đăng nhập và điều hướng bảo mật:**
   - Server Component `src/app/(builder)/builder/[pageId]/page.tsx` kiểm tra phiên đăng nhập bằng `payload.auth({ headers })`.
   - Nếu chưa đăng nhập: Chuyển hướng sang `/admin/login?redirect=/builder/[pageId]`. Sau khi đăng nhập thành công trên Payload admin, hệ thống tự động đưa người dùng trở lại đúng URL editor đang thao tác (đã kiểm chứng `getSafeRedirect` của Payload cho phép redirect nội bộ ngoài `/admin`).
   - Nếu `pageId` không hợp lệ hoặc không tìm thấy trang: Trả về mã lỗi 404 (`notFound()`), không rò rỉ chi tiết lỗi máy chủ.
3. **Khối RichText an toàn:**
   - Chọn Phương án 1: Dùng `textarea`, phân đoạn qua hai lần xuống dòng (`\n\n`), render thành các thẻ ngữ nghĩa `<p>` (Montserrat Regular, `deep-navy`, khoảng cách brand chuẩn), tuyệt đối không dùng `dangerouslySetInnerHTML`.
   - Phương án RichText formatting được đưa vào `docs/BACKLOG.md` để đánh giá lại ở T1-01.
4. **Font và màu thương hiệu trong Canvas iframe:**
   - Layout `(builder)` nạp đầy đủ các font chuẩn Brand Book 2026: Anton (tiêu đề), Montserrat (nhãn, UI, body), Playfair Display Italic (cảm xúc) với subset `vietnamese`.
   - Puck cấu hình `syncHostStyles` đồng bộ tự động stylesheet và biến CSS vào iframe của canvas, đảm bảo các ký tự tiếng Việt có dấu (như "Ữ", "Ộ", "Ặ") và font Anton hiển thị chuẩn xác trong chế độ soạn thảo.
5. **Thao tác lưu nháp & xuất bản độc lập:**
   - Thanh công cụ editor có 2 nút riêng biệt: **"Lưu nháp"** và **"Xuất bản"** với nhãn tiếng Việt và phản hồi trạng thái rõ ràng (đang lưu, đã lưu thành công kèm thời gian, báo lỗi).
   - Server actions `saveDraftAction` và `publishPageAction` kiểm tra quyền người dùng phía server bằng `payload.auth({ headers })` với `overrideAccess: false`, có đánh dấu `// REVIEW-REQUIRED:`.
6. **Bảo toàn Schema và Tối ưu SEO:**
   - Nút "Chỉnh sửa trực quan" trong `Pages.ts` sử dụng field `type: 'ui'` liên kết component `VisualBuilderButton`, cam kết zero schema changes (đã kiểm chứng qua `payload migrate:create`).
   - Đường dẫn `/builder/**` được đặt metadata `robots: { index: false, follow: false }`.
   - Trang công khai `/` và `[...slug]` chỉ hiển thị phiên bản đã xuất bản (`draft: false`), tự động lấy metadata từ trường `seo` của trang.

## T0-10

- Docker dùng `node:22-bookworm-slim` (Node 22 cùng major với CI; Debian/glibc để dùng binary sharp) và `postgres:18` (cùng major DB dev/CI). Tag theo major nhận bản vá; khi cần rollback tuyệt đối phải lưu image digest cùng backup. Postgres 18 mount `/var/lib/postgresql`, không dùng đường dẫn `/data` của bản cũ.
- Build multi-stage qua Corepack đọc đúng `pnpm@12.8.1` từ `packageManager`, `--frozen-lockfile`; không đưa `.env`, DB hay secret vận hành vào build context. Runner chạy user `node` không phải root; `/app/media` có volume riêng. Demo compose chỉ cấu hình storage local.
- `NEXT_OUTPUT=standalone` chỉ đặt trong Docker build; local/CI `pnpm build` + `pnpm start` không đổi. App healthcheck gọi `/api/users/init`, kích hoạt Payload và `prodMigrations` đã có trước khi healthy; không thêm lệnh migration thủ công.
- `src/proxy.ts` là convention Next 16, đọc `SITE_NOINDEX` ở runtime và gắn header trên mọi đường dẫn. `robots.ts` dùng `force-dynamic` để không đóng băng cờ ở build. Mặc định cờ trống; server demo bật `true`.
- Branch T0-10 tạo từ `d2d4309` (trước khi PR #9 merge), sau đó gộp `main` có Puck 0.23.0 + route `/builder`; ảnh Docker được build và kiểm lại sau khi gộp.
- Sau khi gộp PR #9, `pnpm build` trong Docker lỗi khi prerender `/` ("missing secret key") vì trang chủ đọc CMS mà build Docker cố ý không có DB/secret. Trang `/` và `[...slug]` đặt `export const dynamic = 'force-dynamic'` (cùng cách `/styleguide`), có unit test chặn tái phạm. Khi bật Cache Components sau này phải chuyển sang `await connection()`.
- Tài liệu đã đối chiếu: [Payload deployment tại tag v3.90.2](https://github.com/payloadcms/payload/blob/v3.90.2/docs/production/deployment.mdx), [prodMigrations](https://payloadcms.com/docs/database/migrations#running-migrations-in-production), docs Next 16.3.3 cài trong `node_modules/next/dist/docs/` (`output`, `proxy`, `robots`, `self-hosting`), [Postgres official image](https://hub.docker.com/_/postgres).

## T0-08

- `pnpm seed` = `payload run seed/index.ts`. Upsert theo khóa tự nhiên (slug / code / statement / name / title); chỉ tạo hoặc cập nhật bản ghi `isSample = true`, gặp bản ghi thật cùng khóa thì bỏ qua và đếm `skippedReal`. Không xóa gì. Global `navigation` / `siteSettings` chỉ điền khi đang trống.
- Từ chối khi `NODE_ENV=production` nếu thiếu `SEED_ALLOW_PROD=true` (`seed/guard.ts`; `payload run` không chuyển tham số dòng lệnh vào script nên không dùng được `--allow-prod`). Docker demo chạy seed qua service `seed` (profile `tools`, stage `builder` có mã nguồn) vì image runtime standalone không có mã nguồn.
- Dữ liệu: 9 sản phẩm + 3 gói Growth Mirror theo danh mục 13 offer (file Planning) và `Growth_Mirror_Pricing_Calculator.xlsx` / AGENTS.md; Growth Mirror + Thinking Mirror là `services`, 2 chương trình B2B là `programs` (`consult`); "Đọc sách cùng bạn" là 2 `posts`. Habit Tracker / EQ Buddy số `coming_soon` (GĐ 2–3 chưa có app). Gói và phiên trải nghiệm không có nút mua trực tiếp (gói `consult`).
- **Placeholder do thiếu file nguồn** (file Excel Habit Hack chưa có trong `docs/sources/`): 16 câu chẩn đoán, 11 kỹ thuật, 20 bài học / 4 module, 3 thẻ EQ, 3 testimonial (`consent = false`, giữ nháp), nội dung 6 trang pháp lý để trống. Hero trang chủ dùng nguyên văn copy trong AGENTS.md 8.1; mọi chữ khác bắt đầu `[MẪU]`.
- 5 trang Puck seed: `/`, `ve-hana`, `coaching`, `coaching/growth-mirror`, `doanh-nghiep` (đúng danh sách AGENTS.md mục 7), khối `version: 1`.

## T0-07

- `users.role` (`owner` / `editor`, lưu vào JWT). Người tạo đầu tiên tự là `owner` (hook đếm users); sau đó chỉ owner tạo/xóa admin và đổi role (field access) – editor không tự nâng quyền. Migration `access_control` đặt mọi admin có sẵn thành `owner`.
- Hàm access tập trung ở `src/lib/auth/access.ts`: `isAdminUser` / `isOwnerUser`, `authenticated` (= `isEditorOrOwner`), `isOwner`, `publishedOrAuthenticated`, `adminOrSelfCustomer(field)`, `ownerOrSelfCustomerField`, `nobody`. Nhánh `customers` sẵn cho GĐ 2 (OTP); hiện `customers` chưa là collection đăng nhập.
- 14 collection mới (AGENTS.md mục 7 + GAPS A2–A6, A8). Không có trường hoàn tiền / địa chỉ giao hàng.
- Ràng buộc "duy nhất có điều kiện" dùng **cột khóa ẩn có unique index** + hook báo lỗi tiếng Việt (`src/fields/unique-key.ts`): `entitlements.trialKey` = `customer:product` chỉ khi `source = trial` (NULL không bị ràng buộc), `habitCheckins.planDay`, `lessonProgress.customerLesson`.
- `orders`: `paymentRef` (`TDCX` + 5 ký tự bỏ 0/O/1/I, kiểm trùng) và `payToken` (24 byte ngẫu nhiên khi `createdByAdmin`) do server sinh, không đổi được. Editor không đặt/đổi `paymentStatus`, `paidAt`, `createdByAdmin`; owner hoặc code server không có user (webhook GĐ 2) mới được. Bảo vệ trong **một hook** thay vì field access vì field access xóa giá trị sau hook. Editor không xóa đơn.
- Dữ liệu cảm xúc (`habitCheckins.emotion/note`, `savedCards.reflection`) ẩn với editor (field read access). `paymentEvents`, `auditLogs`: chỉ owner đọc, không ai tạo/sửa/xóa qua API (server ghi bằng overrideAccess). `otpCodes`: ẩn khỏi admin, đóng với mọi API.
- Tab "Thanh toán" của `siteSettings`: đọc và sửa chỉ owner; trang thanh toán công khai (T1-12) đọc qua Local API overrideAccess.

---

## T0-10c – Image trên GHCR

- **Registry & Image Name**:
  - Registry: GitHub Container Registry (`ghcr.io`).
  - Repository/Image name: `ghcr.io/residoken-wq/tramdungcamxuc` (luôn viết thường theo quy định của GHCR).
  - Không thêm secret mới vào repo; job CI dùng token sẵn có `${{ secrets.GITHUB_TOKEN }}` với quyền `packages: write`, xác thực qua `docker/login-action@v3`. PR từ bên ngoài hoặc nhánh khác không push và không đăng nhập registry để đảm bảo an toàn.

- **Quy ước Tagging (chuẩn OCI qua `docker/metadata-action@v5`)**:
  - **Runtime image** (target `runner`, phục vụ chạy ứng dụng Next.js + Payload):
    - Tag `latest`: trỏ vào bản build mới nhất của nhánh `main`.
    - Tag `sha-<7 ký tự commit>` (ví dụ `sha-1a2b3c4`): cố định theo từng commit cụ thể, phục vụ ghim phiên bản hoặc rollback.
  - **Tools image** (target `builder`, phục vụ chạy các lệnh CLI như `pnpm seed`):
    - Tag `tools-latest`: trỏ vào bản công cụ tương ứng với `main`.
    - Tag `tools-sha-<7 ký tự commit>`: khớp chính xác với mẫu `tools-${APP_TAG}` khi ghim `APP_TAG`.
  - Mẫu tag trong `docker-compose.prod.yml`:
    - `app`: `${APP_IMAGE:-ghcr.io/residoken-wq/tramdungcamxuc}:${APP_TAG:-latest}`
    - `seed`: `${APP_IMAGE:-ghcr.io/residoken-wq/tramdungcamxuc}:tools-${APP_TAG:-latest}`

- **Vì sao có image tools riêng?**:
  - Image runtime (`runner`) được tối ưu dạng Next.js standalone chỉ chứa mã đã build, node_modules rút gọn, không có mã nguồn TypeScript (`seed/index.ts`) hay Payload config gốc (`payload.config.ts`), nên không thể chạy `payload run seed/index.ts`.
  - Image `tools` giữ lại toàn bộ source code và `devDependencies` tại stage `builder`, cho phép chạy các tác vụ quản trị và seed dữ liệu mà không làm phình to image runtime phục vụ người dùng.

- **Vì sao chỉ build `linux/amd64`?**:
  - Môi trường server demo hiện tại là Linux x86_64 chuẩn.
  - Build đơn nền tảng `linux/amd64` giúp thời gian build trên GitHub Actions nhanh nhất (không tốn overhead giả lập QEMU đa kiến trúc) và tối ưu dung lượng GitHub Actions cache (`type=gha`).
  - Nhu cầu `arm64` đã được đưa vào `docs/BACKLOG.md` và sẽ bổ sung khi dự án chuyển sang máy chủ ARM/Apple Silicon.

- **Chính sách Private / Public Package trên GHCR**:
  - GHCR mặc định gán visibility của package theo quyền của repo (private nếu repo private).
  - Khi package ở chế độ **Private**, server cần đăng nhập bằng Personal Access Token (classic) chỉ có quyền `read:packages`.
  - Khi chủ dự án chuyển package sang **Public** trong cài đặt GitHub Package, server demo có thể pull trực tiếp mà không cần lưu token xác thực.

- **Docker Compose `pull_policy` và cơ chế gộp file `-f`**:
  - `docker-compose.prod.yml` không đặt `pull_policy: always` mà để mặc định (`missing`). Thay vào đó, quy trình vận hành trong `RUNBOOK.md` chỉ định rõ bước `docker compose pull` trước `docker compose up -d`. Điều này đảm bảo tính tất định, chủ động kiểm soát thời điểm cập nhật và tránh lỗi nếu server bị gián đoạn mạng đột xuất lúc khởi động lại container.
  - File override `docker-compose.build.yml` khai báo lại `build: context: .` và `build: target: builder` cho hai service `app` và `seed`. Theo quy tắc hợp nhất của Docker Compose (`-f base.yml -f override.yml`), cấu hình trong file sau sẽ bổ sung định nghĩa build cho image đã khai báo ở file trước; khi chạy kèm cờ `--build`, Docker Compose sẽ ưu tiên build tại chỗ và gắn tag trùng với biến `APP_TAG` thay vì kéo từ registry.

- **Tài liệu chính thức đã đối chiếu**:
  - [docker/login-action](https://github.com/docker/login-action) (v3)
  - [docker/metadata-action](https://github.com/docker/metadata-action) (v5 / v6)
  - [docker/build-push-action](https://github.com/docker/build-push-action) (v6)
  - [GitHub Docs – Working with the Container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
  - [GitHub Docs – Publishing Docker images](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
  - [Docker Compose pull_policy specification](https://docs.docker.com/reference/compose-file/services/#pull_policy)
  - [Docker Compose multiple compose files merge (-f)](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/)

## Repo GitHub chuyển sang public (10/10/2026)

- **Bối cảnh**: CI dừng vì tài khoản `residoken-wq` hết hạn mức GitHub Actions (repo private). Anh Nhân chuyển repo sang **public** để Actions chạy miễn phí.
- **Phê duyệt**: Hana đồng ý công khai repo, gồm cả `docs/sources/` (file Habit Hack, bảng giá Growth Mirror), `seed/import/` (nội dung khóa học), `docs/plan/` và `AGENTS.md`. Anh Nhân xác nhận trong phiên Planning 10/10.
- **Đã kiểm trước khi tiếp tục**: quét toàn bộ lịch sử git – không có khóa bí mật thật (chỉ mật khẩu mẫu Postgres cục bộ trong `.env.example`/CI và khóa Turnstile thử nghiệm công khai); không có dữ liệu khách thật (số tài khoản trong test là mẫu tham chiếu VietQR công khai).
- **Quy tắc từ nay** (repo công khai):
  - Tuyệt đối không commit `.env`, khóa, token, mật khẩu thật (AGENTS mục 2.5) – mọi bí mật chỉ ở `.env` trên server / GitHub Secrets.
  - Dữ liệu mẫu và test chỉ dùng tên, email, số điện thoại **rõ ràng là giả** (`@example.test`, `Học viên Test 01`); không dùng tên người thật.
  - Không đưa dữ liệu khách hàng thật, lead thật, ảnh chụp có thông tin khách vào repo.
  - Nội dung mới của Hana chưa muốn công khai (video, 26 thẻ EQ, tài liệu chiến lược mới) gửi qua kênh riêng và nhập thẳng vào DB, không commit file gốc.

## Sitemap v2 – chốt 17/10/2026

Planning trả lời thay Hana trong bảng câu hỏi (Claude Docs "Câu hỏi cho Hana – Sơ đồ website mới"). Số câu theo bảng gửi Hana; đối chiếu sang `docs/plan/SITEMAP_V2.md` mục 4.

| Câu        | Chốt                                                                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1         | Đồng ý: 3 gói gọi là Lộ trình "Chuyển mình không chênh vênh"; Growth Mirror / Thinking Mirror là dịch vụ coach 1:1. Hana tự đổi tên gói trong CMS                                 |
| Q2         | Đồng ý bộ đường dẫn mới (`/ve-tram`, `/lo-trinh-chuyen-minh`, `/tai-nguyen`, `/lien-he`, `/cong-dong`) + 301 từ link cũ. QR thẻ EQ **chưa in** → `qrSlug` còn đổi được đến khi in |
| Q3         | Quiz chẩn đoán vào menu con "Tài nguyên miễn phí"; trang chủ vẫn giữ nút quiz                                                                                                     |
| Q4         | Phương án A: gói không bán trực tiếp; "Chọn gói này" mở form đặt phiên trải nghiệm 149.000đ, ghi gói quan tâm                                                                     |
| Q5         | "Phiên Khám phá" = phiên trải nghiệm 149.000đ; cuộc gọi 15 phút miễn phí đi qua form liên hệ (không có link đặt lịch riêng)                                                       |
| Q6, Q7     | Tên sản phẩm, masterclass, chương trình DN: Hana tự tạo / sửa trong CMS – code không cố định tên nào                                                                              |
| Q8         | Chưa trả lời → mặc định 1 trang lộ trình chung                                                                                                                                    |
| Q9a–c, Q10 | Làm chức năng trong CMS để Hana tự nhập / ẩn: số liệu, logo đối tác (có nhóm), testimonial dạng câu chuyện, đội ngũ (`teamMembers`). Quy tắc `consent` của testimonial giữ nguyên |
| Q11        | Trang Cộng đồng: làm sẵn khối / mẫu, Hana tự dựng nội dung bằng Puck                                                                                                              |
| Q12        | Có trang Câu hỏi thường gặp riêng; FAQ là collection `faqs` dùng chung                                                                                                            |
| Q13        | Form newsletter: chữ và lựa chọn sửa trong CMS; GĐ này chỉ thu email, gửi bản tin tự động vẫn ở BACKLOG                                                                           |

## Habit Hack hành trình 28 ngày – chốt 20/10/2026 (HB-01, đợt 1)

Anh Nhân chốt sau họp 20/10 (`docs/plan/MEETING_2010.md` phần 2, câu 1–2). Thay quyết định 21 ngày ở AGENTS §1 / §8.2.

| Câu | Chốt                                                                              | Cách hiểu khi code                                                                                                                                                                                                                                               |
| --- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **28 ngày**                                                                       | Tracker 28 ngày và dùng thử Habit Tracker số 28 ngày (`products.trialDays` = 28, sửa trong CMS). Số ngày hành trình là cài đặt trong CMS (mặc định 28) và **lưu cố định vào kế hoạch lúc tạo**: kế hoạch đang chạy theo 21 ngày giữ nguyên 21, không bị kéo dài. |
| 2a  | Ngày **trong nhịp** (ngày bỏ phiếu khách đã chọn) mà không check-in → **lỡ nhịp** | Ngày nghỉ theo nhịp không bao giờ tính lỡ. "Bản tối giản" là đã check-in → không lỡ, giữ chuỗi. Nhắc lỡ nhịp (email) đếm 2 **ngày bỏ phiếu** liên tiếp bị lỡ, bỏ qua ngày nghỉ. Khi chưa có nhịp tuần (kế hoạch cũ), mọi ngày là ngày bỏ phiếu.                  |
| 2b  | Đạt **90%** mới được chứng nhận                                                   | 90% = số ngày bỏ phiếu đã check-in (cả bản tối giản) ÷ tổng ngày bỏ phiếu trong hành trình, làm tròn lên (28 ngày, nhịp 7/7 → cần 26 ngày). Thay `certificateMinDays` bằng tỷ lệ % trong CMS (mặc định 90).                                                      |
| 2c  | Không đạt → ghi trạng thái **"Đã trải nghiệm"**                                   | Hết hành trình mà dưới 90%: kế hoạch có kết quả "Đã trải nghiệm" (không cấp chứng nhận, không có link công khai). Đạt: "Đã hoàn thành" + chứng nhận như hiện tại.                                                                                                |

Còn chờ Hana: câu 3–10 trong kế hoạch (chẩn đoán 8 hay 16 câu, nguồn số liệu, hướng "Dựng thương hiệu", bước nào cần đăng nhập, nút Ủng hộ, cỡ Boarding Pass, bộ cảm xúc, link đặt lịch). Câu "bản tối giản có tính vào 90%" Planning hiểu là **có** (đã check-in) – Hana xác nhận khi xem thử.

## Khối "Hành trình 5 bước" kéo thả tự do – chốt 22/10/2026 (PK-03)

- Anh Nhân chốt: `JourneySteps` chuyển sang kéo thả **tự do**. Mỗi bước là khối con `Step`; Hana đổi tên, thứ tự, số bước tùy ý. Không còn khóa 5 bước Pause → Feel → Name → Choose → Practice trong code.
- 5 bước Pause → Feel → Name → Choose → Practice vẫn là **nội dung mặc định** của khối mới và của mọi trang cũ sau migration (giữ nguyên chữ đang hiện).
- Hệ quả: giữ đúng phương pháp 5 bước là việc của người biên tập; hướng dẫn CMS ghi rõ.

## Thẻ dịch vụ / thẻ gói kéo thả – chốt 22/10/2026 (PK-04)

- `ServiceCards` và `PackageCards` chuyển sang khối con kéo thả (`ServiceCard`, `PackageCard`); mỗi thẻ chỉ lưu **ID** dịch vụ / gói.
- Tên, giá, mô tả, **ảnh** của thẻ lấy từ form Payload (Dịch vụ / Sản phẩm). **Không** có ô chọn ảnh riêng trên trang (anh Nhân chốt 22/10), để đổi một chỗ là mọi trang cập nhật.
