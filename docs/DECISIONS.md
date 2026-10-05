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
| `deep-navy/70` / `soft-pink/40` | **~7.50:1** | ✅ Đạt | ✅ Đạt | Ô ngày đã lỡ (`missed`) trong `ProgressGrid`. |

### 3. Quyết định kiến trúc & Quy chuẩn A11y cho các Composite Components:
1. **ProductCard**: Khi `saleStatus === 'hidden'`, component trả về `null` (không sinh HTML/DOM rác). CTA nhận qua ReactNode slot `cta` để không can thiệp logic mua bán / phân quyền trước T1-08. Ảnh bìa bắt buộc có `src` và `alt` đi qua `next/image`.
2. **TestimonialCard**: Tuyệt đối tuân thủ AGENTS.md mục 7: Chỉ hiển thị khi có `consent === true`. Khi `consent === false`, trả về `null`. Sử dụng font Playfair Display Italic cho câu trích dẫn cảm xúc.
3. **LeadForm**: Biểu mẫu UI client an toàn:
   - Tích hợp ô honeypot ẩn hoàn toàn (`tabIndex={-1}`, `autoComplete="off"`, `aria-hidden="true"`, ẩn qua CSS/screen reader) để bẫy bot spam.
   - Bắt buộc đồng ý nhận tin và dẫn link tới trang chính sách bảo mật qua prop `privacyHref`.
   - Báo lỗi tiếng Việt ngay dưới từng ô input, không dùng placeholder thay thế nhãn hiển thị.
4. **EmotionPicker**: Chuẩn WAI-ARIA Radio Group: hỗ trợ phím mũi tên (ArrowLeft/Right/Up/Down) để chuyển đổi giữa các cảm xúc, `aria-checked`, và kích thước vùng bấm tối thiểu 44px × 44px trên di động.
5. **ProgressGrid**: Lưới 21 ngày tương thích tốt ở độ rộng 375px. Trạng thái ngày hoàn thành (`done`) không chỉ dựa vào màu sắc mà có thêm icon hoàn thành / icon cảm xúc đi kèm (tuân thủ WCAG 1.4.1). Ngày chưa tới (`future`) và ngày đã khóa (`locked`) bị vô hiệu hóa `disabled` và không kích hoạt sự kiện bấm.
6. **Navbar**: Hỗ trợ mở drawer trên di động có `aria-expanded`, phím Escape đóng drawer và trả focus về nút mở. Giữ nút `Test thói quen 5 phút` và nút CTA hiển thị nổi bật trên thanh top bar di động (lead magnet chính) theo AGENTS.md 8.1.
7. **Footer**: Tự động sắp xếp các trang pháp lý theo thuộc tính `order`. Tự động ẩn các trường rỗng trong thông tin đơn vị `sellerInfo`. Năm bản quyền được tính tự động từ hệ thống.

