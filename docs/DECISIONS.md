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

---

## 3. Bảng tương phản màu sắc thương hiệu & Tiêu chuẩn WCAG AA (Task T0-04)

Đo lường độ tương phản giữa các token màu của Brand Book 2026 trên nền sáng (`warm-ivory`, `white`, `soft-pink`, v.v.):

| Cặp màu (Chữ / Nền) | Tỉ lệ tương phản | AA Chữ thường (≥ 4.5:1) | AA Chữ lớn (≥ 3.0:1) | Ghi chú & Quy tắc áp dụng |
| --- | --- | --- | --- | --- |
| `deep-navy` (#280A60) / `warm-ivory` (#FAF7F4) | **15.11:1** | ✅ Đạt | ✅ Đạt | Màu chữ chính cho toàn bộ body, tiêu đề chính, card trên nền trang. |
| `deep-navy` (#280A60) / `white` (#FFFFFF) | **16.52:1** | ✅ Đạt | ✅ Đạt | Chữ trên nền card trắng, modal, input. |
| `deep-navy` (#280A60) / `mint-haze` (#D9F1EA) | **13.92:1** | ✅ Đạt | ✅ Đạt | Chữ trên badge thành công, tracker trạng thái. |
| `deep-navy` (#280A60) / `butter-cream` (#F6E9B8) | **13.14:1** | ✅ Đạt | ✅ Đạt | Chữ trên badge tư vấn, highlight. |
| `deep-navy` (#280A60) / `lavender-mist` (#E9DDF9) | **11.23:1** | ✅ Đạt | ✅ Đạt | Chữ trên section phụ, card lavender. |
| `deep-navy` (#280A60) / `soft-pink` (#FDE6F6) | **13.56:1** | ✅ Đạt | ✅ Đạt | Chữ trên card soft-pink. |
| `bright-magenta` (#BC039E) / `warm-ivory` (#FAF7F4) | **5.40:1** | ✅ Đạt | ✅ Đạt | Dòng 2 tiêu đề, series label chữ nhỏ, điểm nhấn. |
| `bright-magenta` (#BC039E) / `white` (#FFFFFF) | **5.90:1** | ✅ Đạt | ✅ Đạt | Tiêu đề tầng 2, link quan trọng trên nền trắng. |
| `bright-magenta` (#BC039E) / `soft-pink` (#FDE6F6) | **4.89:1** | ✅ Đạt | ✅ Đạt | Nhãn sắp ra mắt trên nền soft-pink. |
| `white` (#FFFFFF) / `deep-navy` (#280A60) | **16.52:1** | ✅ Đạt | ✅ Đạt | Nút `secondary` (nền deep-navy chữ trắng), nền tối. |
| `white` (#FFFFFF) / `accent-pink` (#EF3B83) | **3.73:1** | ❌ Không đạt | ✅ Đạt (chữ lớn) | Nút CTA chính `primary`: Bắt buộc dùng **chữ lớn ≥ 18.66px đậm** (Montserrat 700) ở size MD/LG. Size SM tự động fallback sang `secondary`. (Chờ Hana chốt Q13). |
| `accent-pink` (#EF3B83) / `warm-ivory` (#FAF7F4) | **3.50:1** | ❌ Không đạt | ✅ Đạt (chữ lớn) | Tuyệt đối **không** dùng `accent-pink` cho chữ thường < 18.66px trên nền sáng. Chỉ dùng cho icon SVG (HeartLine), viền, hoặc link chữ lớn. Link chữ nhỏ dùng `bright-magenta` (5.40:1) hoặc `deep-navy` có gạch chân. |
| `deep-navy/85` / `white` (#FFFFFF) | **10.75:1** | ✅ Đạt | ✅ Đạt | Chữ mô tả nội dung trong card, modal. |
| `deep-navy/75` / `mint-haze` (#D9F1EA) | **7.01:1** | ✅ Đạt | ✅ Đạt | Chữ phụ trợ trên thông báo Toast thành công. |
| `deep-navy/70` / `white` (#FFFFFF) | **6.43:1** | ✅ Đạt | ✅ Đạt | Giá gốc gạch ngang trong `PriceTag` trên nền trắng (T0-04b). |
| `deep-navy/70` / `warm-ivory` (#FAF7F4) | **6.00:1** | ✅ Đạt | ✅ Đạt | Giá gốc gạch ngang trong `PriceTag` trên nền trang (T0-04b). |
| `deep-navy/60` / `warm-ivory` (#FAF7F4) | **4.52:1** | ✅ Đạt | ✅ Đạt | Chữ phụ trợ cấp 3 (sát ngưỡng tối thiểu 4.5:1). |

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

| Cặp màu (Chữ / Nền) | Tỉ lệ tương phản | AA Chữ thường (≥ 4.5:1) | AA Chữ lớn (≥ 3.0:1) | Ghi chú & Nơi áp dụng |
| --- | --- | --- | --- | --- |
| `bright-magenta` (#BC039E) / `soft-pink` (#FDE6F6) | **4.89:1** | ✅ Đạt | ✅ Đạt | Banner thông báo lỗi hệ thống / máy chủ trong `LeadForm`. |
| `deep-navy` (#280A60) / `soft-pink` (#FDE6F6) | **13.56:1** | ✅ Đạt | ✅ Đạt | Nút radio cảm xúc đang chọn trong `EmotionPicker`, nút quiz trên Navbar mobile. |
| `deep-navy` (#280A60) / `mint-haze` (#D9F1EA) | **13.92:1** | ✅ Đạt | ✅ Đạt | Ô ngày hoàn thành (`done`) trong `ProgressGrid`, khung thông báo thành công `LeadForm`. |
| `deep-navy/80` / `mint-haze` (#D9F1EA) | **8.05:1** | ✅ Đạt | ✅ Đạt | Dòng phụ đề thông báo gửi form thành công trong `LeadForm`. |
| `deep-navy/70` / `soft-pink/40` | **6.25:1** | ✅ Đạt | ✅ Đạt | Ô ngày đã lỡ (`missed`) trong `ProgressGrid`. |
| `deep-navy/40` / `white/50` | **2.50:1** | ⚠️ Miễn trừ | ⚠️ Miễn trừ | Chữ ô ngày chưa tới (`future`) trong `ProgressGrid` (nút `disabled`, WCAG 1.4.3 miễn trừ). |
| `deep-navy/30` / `warm-ivory` | **1.90:1** | ⚠️ Miễn trừ | ⚠️ Miễn trừ | Chữ ô ngày đã khóa (`locked`) trong `ProgressGrid` (nút `disabled`, WCAG 1.4.3 miễn trừ). |

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

## T0-10

- Docker dùng `node:22-bookworm-slim` (Node 22 cùng major với CI; Debian/glibc để dùng binary sharp) và `postgres:18` (cùng major DB dev/CI). Tag theo major nhận bản vá; khi cần rollback tuyệt đối phải lưu image digest cùng backup. Postgres 18 mount `/var/lib/postgresql`, không dùng đường dẫn `/data` của bản cũ.
- Build multi-stage qua Corepack đọc đúng `pnpm@12.8.1` từ `packageManager`, `--frozen-lockfile`; không đưa `.env`, DB hay secret vận hành vào build context. Runner chạy user `node` không phải root; `/app/media` có volume riêng. Demo compose chỉ cấu hình storage local.
- `NEXT_OUTPUT=standalone` chỉ đặt trong Docker build; local/CI `pnpm build` + `pnpm start` không đổi. App healthcheck gọi `/api/users/init`, kích hoạt Payload và `prodMigrations` đã có trước khi healthy; không thêm lệnh migration thủ công.
- `src/proxy.ts` là convention Next 16, đọc `SITE_NOINDEX` ở runtime và gắn header trên mọi đường dẫn. `robots.ts` dùng `force-dynamic` để không đóng băng cờ ở build. Mặc định cờ trống; server demo bật `true`.
- PR #9 chưa merge khi bắt đầu task; branch T0-10 xuất phát `origin/main` (`d2d4309`). Không đưa code Puck của PR #9 vào branch này; kiểm tra compatibility riêng với Puck 0.23.0 trước bàn giao.
- Tài liệu đã đối chiếu: [Payload deployment tại tag v3.90.2](https://github.com/payloadcms/payload/blob/v3.90.2/docs/production/deployment.mdx), [prodMigrations](https://payloadcms.com/docs/database/migrations#running-migrations-in-production), docs Next 16.3.3 cài trong `node_modules/next/dist/docs/` (`output`, `proxy`, `robots`, `self-hosting`), [Postgres official image](https://hub.docker.com/_/postgres).
