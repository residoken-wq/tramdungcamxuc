# GĐ 0 – Nền móng: task card cho Antigravity

> Mục tiêu GĐ 0: admin chạy trên bản demo (server riêng của anh Nhân – T0-10), đủ collections, phân quyền đúng, kéo thả được 5 khối đầu tiên.
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

## T0-01b – Sửa sau nghiệm thu T0-01

**Phụ thuộc**: T0-01 · **Làm trên chính branch** `task/T0-01-khoi-tao-repo`, không tạo branch mới.
Chi tiết và lý do: `docs/tasks/reviews/T0-01.md`.

**Phạm vi**

1. `.gitignore`: thay dòng `.claude/` bằng `.claude/*` + `!.claude/skills/`; commit thư mục `.claude/skills/` (giữ `.mcp.json`, `.gemini/` ngoài git).
2. `docs/DECISIONS.md`: ghi lý do `legacy-peer-deps=true` trong `.npmrc` (gói nào xung đột với gói nào); bỏ nếu không còn cần.
3. Tạo `.prettierignore` bỏ qua file sinh tự động (`src/payload-types.ts`, `src/app/(payload)/admin/importMap.js`) để `pnpm format` và dev server không sửa qua sửa lại; thêm `.playwright-mcp/` vào `.gitignore`; commit ảnh nghiệm thu `docs/tasks/reviews/T0-01-admin-create-first-user.png`. (Kiểm chứng `/admin` với Postgres thật: Planning đã làm.)
4. Push branch, mở PR vào `main`, ghi link PR trong báo cáo.

**Không làm**: sửa vitest/playwright (T0-02), sửa layout/CSS trang chủ (T0-03).

**Tiêu chí nghiệm thu**

- [ ] `git ls-files .claude/skills` liệt kê đủ 6 skill, có `tdcx-brand`.
- [ ] `git status` sạch; `pnpm lint && pnpm typecheck && pnpm build` qua.
- [ ] PR đã mở.

---

## T0-02 – CI và bộ khung test

**Phụ thuộc**: T0-01 · **Song song được với**: T0-03

**Phạm vi**

1. Vitest cho unit test (`tests/unit`), 1 test mẫu.
2. Playwright cho e2e (`tests/e2e`), 1 test smoke: mở `/admin` trả 200. Cấu hình viewport 375 và 1440.
3. GitHub Actions `ci.yml`: trên mỗi PR chạy install (cache pnpm) → lint → typecheck → vitest → build → playwright (dùng service Postgres trong CI).
4. Script `pnpm test`, `pnpm test:e2e`.
5. Chuyển từ nghiệm thu T0-01 (`docs/tasks/reviews/T0-01.md`): sửa `vitest.config.mts` để tìm test ở `tests/unit/**/*.test.ts` (bỏ `tests/int`); thêm `baseURL` và 2 project viewport 375/1440 vào `playwright.config.ts`; script `test` không được rỗng.
6. CI không được dùng secret thật: tạo `PAYLOAD_SECRET` ngẫu nhiên trong workflow, DB là service container.
7. Service Postgres trong CI dùng image `postgres:18` (khớp máy dev: PostgreSQL 18.6). CI chạy trên `pull_request` và `push` vào `main`.
8. Máy dev không có `gh` CLI: push branch rồi báo link "Compare & pull request" trên GitHub để Planning mở PR; không tự merge.

**Tiêu chí nghiệm thu**

- [ ] Mở PR thử thấy CI chạy và xanh.
- [ ] Cố ý làm hỏng 1 test → CI đỏ.

---

## T0-02b – Migration đầu tiên + smoke test thật + CI chạy trên `main`

**Phụ thuộc**: T0-02 · Lý do: `docs/tasks/reviews/T0-02.md` (CI chưa từng chạy, smoke test xanh giả vì repo chưa có migration).
Branch mới `task/T0-02b-migrations-ci` từ `main` (đã có T0-02).

**Quyết định Planning (ghi vào `docs/DECISIONS.md`)**: dự án dùng **migration ở mọi môi trường, kể cả dev**. Đặt `push: false` trong `postgresAdapter` để không lẫn schema "push" ở dev với migration. Mỗi lần đổi collection/global: `pnpm payload migrate:create <ten>` rồi `pnpm payload migrate`.

**Phạm vi**

1. `src/payload.config.ts`: `postgresAdapter({ push: false, migrationDir: <src/migrations>, ... })`. Đọc docs Payload 3.90 về `push`, `migrationDir`, `prodMigrations` (Context7) trước khi sửa.
2. Tạo migration đầu tiên `pnpm payload migrate:create initial` cho schema hiện có (`users`, `media`, bảng hệ thống), commit thư mục `src/migrations/`.
3. Script trong `package.json`: `migrate` (`payload migrate`), `migrate:create`. Cập nhật `README.md` và `docs/RUNBOOK.md`: bước chạy local thêm `pnpm migrate` trước `pnpm dev`.
4. **DB local**: database `tramdungcamxuc` hiện đã bị dev push. Xóa và tạo lại nó (chưa có dữ liệu thật, Planning cho phép), rồi `pnpm migrate`. Thông tin DB trong `.env`.
5. `ci.yml`:
   - thêm bước `pnpm migrate` **trước** `pnpm build`;
   - thêm trigger `workflow_dispatch`;
   - giữ `pull_request`/`push` cho `main`.
6. Smoke test thật (`tests/e2e/smoke.test.ts`), giữ 2 viewport:
   - `GET /api/users/init` trả 200 (DB có bảng);
   - mở `/admin` trên DB chưa có user → thấy form tạo user đầu tiên (chờ ô Email hiện ra, không chỉ kiểm tra HTTP 200);
   - trong lúc tải `/admin` không có response 5xx nào từ `/api/*`.
7. Chứng minh test bắt được lỗi: chạy smoke trên một DB trống **chưa migrate** → phải **đỏ**; ghi lệnh và kết quả vào báo cáo.

**Không làm**: thêm collection mới (T0-06), sửa giao diện (T0-03).

**Tiêu chí nghiệm thu**

- [ ] `pnpm migrate && pnpm build && CI=true pnpm test:e2e` xanh trên DB mới tạo.
- [ ] Cùng lệnh nhưng bỏ `pnpm migrate` → e2e đỏ (có log trong báo cáo).
- [ ] Mở PR **vào `main`** → CI chạy và xanh (gửi link run).
- [ ] Đẩy 1 commit tạm làm hỏng `tests/unit/i18n.test.ts` lên PR → CI đỏ; sau đó revert commit đó → CI xanh lại.
- [ ] `docs/DECISIONS.md` ghi quyết định "migration ở mọi môi trường, `push: false`".

---

## T0-03 – Design tokens, font, brand SVG, `/styleguide`

**Phụ thuộc**: T0-02b · Dùng skill **`tdcx-brand`** (thắng mọi skill thiết kế khác).
Hiện trạng: `public/brand/` **trống**, Brand Book PDF **chưa có** trong `docs/sources/` → dùng token trong `AGENTS.md` mục 5 / skill `tdcx-brand`, logo dùng placeholder. Không tự vẽ logo, không lấy ảnh từ nơi khác.

**Phạm vi**

1. **Màu**: 8 màu brand thành CSS variables (`--color-deep-navy`…) + Tailwind theme. Tailwind 3.4: đặt `theme.colors` (thay thế, **không** `extend`) gồm `white`, `transparent`, `current` và 8 token (dùng biến CSS để có biến thể opacity). Màu mặc định Tailwind (red, blue, gray…) không còn sinh class.
2. **Font** qua `next/font/google`, subset `vietnamese` + `latin`, `display: swap`: Anton 400 (H1/H2), Montserrat 400/600/700 (UI, đoạn văn), Playfair Display Italic (quote). Biến `--font-display`, `--font-ui`, `--font-quote`; map vào `theme.fontFamily`. Chỉ nạp font trong layout `(site)` – không đụng giao diện `/admin` của Payload.
3. **Spacing / bo góc / bóng** theo mục 5 "Khoảng thở": token tên rõ nghĩa (vd. `space-breath-sm/md/lg`), `rounded-card` 16–24px, một mức bóng nhẹ.
4. **Gradient** nền pastel tím – hồng – be – trắng: utility `bg-brand-gradient`.
5. **Brand SVG** trong `src/components/brand/`: `HeartLine`, `ThinLine`, `Valve`, `Butterfly`, `Leaf` (nét mảnh, `currentColor`, `aria-hidden` khi trang trí) và `Logo` (đọc PNG từ `public/brand/`; chưa có file → khung chữ "LOGO – chờ file từ Hana", min width 120px).
6. **Dọn template Payload** khỏi layout `(site)`: `lang="vi"`, metadata tạm "Trạm Dừng Cảm Xúc", bỏ `styles.css` template (nền đen, font system), trang chủ tạm chỉ có `Logo` + tên **Trạm Dừng Cảm Xúc** trên nền `warm-ivory`/gradient (T0-09 thay bằng trang Puck).
7. **`/styleguide`**: bảng 8 màu (tên token + hex), thang chữ với câu mẫu "Trạm Dừng Cảm Xúc – Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng." và dòng kiểm tra dấu "Ữ Ộ Ặ Ỷ Ẫ Ỡ ữ ộ ặ ỷ", tiêu đề 2 tầng màu (dòng 1 `deep-navy`, dòng 2 `bright-magenta`, dòng cảm xúc Playfair Italic), các token spacing/bo góc/gradient, 6 icon brand. Chỉ hiện khi `NODE_ENV !== 'production'` hoặc người xem đã đăng nhập admin Payload; luôn `noindex`.
8. **Test**:
   - unit (`tests/unit/brand-tokens.test.ts`): khóa màu trong Tailwind config đúng **bằng** tập cho phép (`white`, `transparent`, `current` + 8 token), hex khớp `AGENTS.md`;
   - e2e (`tests/e2e/styleguide.test.ts`, 375 + 1440): `/styleguide` hiện đủ 8 tên token và câu mẫu tiếng Việt; trang chủ có `lang="vi"`, không còn chữ "Payload".

**Không làm**: component `ui/` (T0-04), Navbar/Footer (T0-05), Puck.

**Tiêu chí nghiệm thu**

- [ ] Layout `(site)` sạch template Payload (`lang="vi"`, không còn "Payload Blank Template", nền đen, "Welcome to your new project"); `/admin` vẫn hiển thị bình thường.
- [ ] Class `bg-red-500` / `text-gray-700` không sinh CSS (unit test chứng minh).
- [ ] Ảnh chụp `/styleguide` ở 375 và 1440 trong PR, thấy rõ "Ữ Ộ Ặ Ỷ" bằng Anton không lỗi dấu.
- [ ] Unit + e2e mới chạy trong CI, CI xanh trên PR vào `main`.
- [ ] Không có màu / font ngoài skill `tdcx-brand`; không hex thô trong component (chỉ trong file token).

---

## T0-03b – Sửa sau nghiệm thu T0-03

**Phụ thuộc**: T0-03 · **Làm trên chính branch** `task/T0-03-design-tokens`, cùng PR. Chi tiết và lý do: `docs/tasks/reviews/T0-03.md`.

**Phạm vi** (đúng các mục B1–B3, S1–S4 trong file review)

1. **B1** `/styleguide`: bỏ điều kiện `process.env.CI`; dùng `STYLEGUIDE_PUBLIC=true` (khai báo trong `ci.yml` cho bước e2e và trong `.env.example` để trống); thêm `export const dynamic = 'force-dynamic'`.
2. **B2** `tests/e2e/styleguide.test.ts`: bỏ việc chụp ảnh vào `docs/`. Chuyển 2 ảnh hiện có sang `docs/tasks/reviews/T0-03-styleguide-375px.png` và `...-1440px.png`, xóa thư mục `docs/tasks/screenshots/`.
3. **B3** thêm `.gitattributes` (`* text=auto eol=lf`, `*.png binary`, `*.jpg binary`, `*.ico binary`); commit riêng `chore: normalize line endings` với `git add --renormalize .`.
4. **S1** trang chủ tạm: bỏ nút "Xem Brand Styleguide" và "Quản trị CMS".
5. **S2** xóa `.bg-brand-gradient` trong `@layer utilities` của `styles.css` (giữ bản trong `tailwind.config.ts`); thêm unit test đọc `src/app/(site)/styles.css`, so `--color-<token>` và `--color-<token>-rgb` với `tokens.ts`.
6. **S3** nhãn section chữ nhỏ trong styleguide: `accent-pink` → `bright-magenta`.
7. **S4** câu mẫu styleguide: bỏ giá tiền.
8. Ghi vào `docs/BACKLOG.md`: favicon chờ logo thật.

**Tiêu chí nghiệm thu**

- [ ] `CI=1 pnpm build` cho ra `ƒ /styleguide` (dán dòng log vào báo cáo).
- [ ] `pnpm start` không có `STYLEGUIDE_PUBLIC`, chưa đăng nhập → `/styleguide` 404.
- [ ] Chạy `pnpm dev` rồi `pnpm test:e2e` → `git status` sạch.
- [ ] CI xanh trên PR vào `main` (link run).

---

## T0-04 – UI primitives

**Phụ thuộc**: T0-03b (đã merge) · Dùng skill **`tdcx-brand`**, sau đó `ui-ux-pro-max` / `vercel-react-best-practices`.

**Phạm vi** (`src/components/ui/`, mỗi component có variant hiển thị trên `/styleguide`):

- `Button`: variant `primary` (nền `accent-pink`), `secondary` (nền `deep-navy`, chữ trắng), `ghost` (viền mảnh, chữ `deep-navy`); size S / M / L; trạng thái loading (có `aria-busy`, giữ nguyên độ rộng), disabled; render được dạng link (`href` → `next/link`) mà không lồng `<a>` trong `<button>`; vùng chạm ≥ 44px.
- `Card` (bo góc `rounded-card`, viền mảnh, `shadow-soft`; biến thể nền `white` / `soft-pink` / `lavender-mist`).
- `SectionHeader`: `seriesLabel` (Montserrat) + `title` dòng 1 `deep-navy` + dòng 2 `bright-magenta` (Anton) + `emotionLine` (Playfair Italic); khoảng thở đúng mục 5; cấp heading chọn được (`h1`/`h2`/`h3`).
- `QuoteBlock` (Playfair Italic, có `cite` tùy chọn).
- `PriceTag`: giá gốc gạch ngang + giá ưu đãi; hàm dùng chung `formatVnd()` trong `src/lib/format.ts` → `250.000đ`; `null`/không có giá → không hiện gì. Có phần đọc cho trình đọc màn hình ("Giá gốc …, giá ưu đãi …").
- `StatusBadge` cho 5 `saleStatus` (`coming_soon`, `on_sale`, `free`, `consult`, `hidden`); nhãn tiếng Việt trong `src/lib/i18n/vi.ts`.
- `Modal` (đóng bằng Esc / nút đóng / click nền; khóa focus bên trong; trả focus về nút mở; khóa cuộn nền).
- `Toast` (thành công / lỗi / thông tin; `role="status"` / `role="alert"`; tự ẩn, dừng khi hover; tôn trọng `prefers-reduced-motion`).

**Quy tắc tương phản (bắt buộc – số đo trong `docs/tasks/reviews/T0-03.md`)**

- Chữ trắng trên `accent-pink` chỉ đạt 3.73:1 → nút `primary` phải dùng **chữ lớn**: ≥ 18.66px **đậm** (Montserrat 700) ở mọi size; nếu size S không đạt được thì size S không có variant `primary` (dùng `secondary`). Chờ Hana chốt Q13; trước đó làm theo quy tắc này.
- Không dùng `accent-pink` cho chữ thường < 18.66px trên nền sáng (3.50:1). Link chữ nhỏ dùng `bright-magenta` hoặc `deep-navy` + gạch chân.
- Focus ring: 2px `deep-navy` (hoặc `white` trên nền tối), có `outline-offset`, luôn nhìn thấy khi điều hướng bàn phím.
- Ghi bảng cặp màu đạt / không đạt vào `docs/DECISIONS.md`.

**Không nhận prop màu tự do** – chỉ nhận variant hoặc tên token brand. Mọi nhãn UI cố định lấy từ `vi.ts`.

**Test**

- Unit: `formatVnd` (0 → `0đ`, 149000 → `149.000đ`, 1750000 → `1.750.000đ`, null/undefined → chuỗi rỗng, số âm → báo lỗi hoặc rỗng – ghi rõ); `StatusBadge` đủ 5 trạng thái; `Button` dạng link không lồng `<a>` trong `<button>`.
- E2E (375 + 1440) trên `/styleguide`: mở Modal bằng bàn phím → Esc đóng → focus về nút mở; Tab qua các Button thấy focus ring.

**Tiêu chí nghiệm thu**

- [ ] Tất cả component hiện trên `/styleguide` ở 375 và 1440, có trạng thái hover / focus / disabled / loading.
- [ ] Unit + e2e ở trên xanh trong CI; `git status` sạch sau khi chạy test.
- [ ] Bảng tương phản trong `DECISIONS.md`; không cặp chữ thường nào < 4.5:1.
- [ ] Không có hex thô hay màu ngoài 8 token trong `src/components/ui/`.

---

## T0-04b – Sửa sau nghiệm thu T0-04

**Phụ thuộc**: T0-04 · **Làm trên chính branch** `task/T0-04-ui-primitives`, cùng PR. Chi tiết và lý do: `docs/tasks/reviews/T0-04.md`.

**Phạm vi**: sửa B1–B3 và S1–S3 trong file review; thêm 3 test ở mục "Test phải thêm".

**Tiêu chí nghiệm thu**

- [ ] Tải `/styleguide`: focus ở `body`, `scrollY` = 0 (có test e2e).
- [ ] Modal chứa input do cha giữ state: gõ liên tục, focus không nhảy (có test).
- [ ] Bẫy focus vẫn đúng: Tab vòng trong modal, Shift+Tab ngược, Esc đóng và trả focus.
- [ ] Giá gốc PriceTag ≥ 4.5:1; bảng DECISIONS có các cặp chữ có độ mờ.
- [ ] Lint, typecheck, test, e2e xanh; `git status` sạch; CI xanh trên PR.

---

## T0-05 – UI composites

**Phụ thuộc**: T0-04b (đã merge) · Dùng skill **`tdcx-brand`**; ghép từ primitives T0-04, không tạo lại Button/Card/PriceTag…
Thư mục: `src/components/site/` (ProductCard, TestimonialCard, LeadForm, Navbar, Footer) và `src/components/habit/` (EmotionPicker, ProgressGrid). Tất cả nhận dữ liệu qua props (CMS nối ở GĐ 1), hiển thị trên `/styleguide` với dữ liệu `[MẪU]`.

**Phạm vi**

1. **`ProductCard`** – props theo field `products` (AGENTS.md mục 7): `name`, `shortDescription`, `coverImage` (`src` + `alt` bắt buộc), `price`, `salePrice`, `saleStatus`, `trialDays`, `journeyStep`. Dùng `Card`, `PriceTag`, `StatusBadge`; ảnh qua `next/image`. Vùng nút CTA nhận qua prop `cta` (ReactNode) – **chưa** tự quyết nút theo `saleStatus` (T1-08). `saleStatus = hidden` → không render.
2. **`TestimonialCard`** – `consent = false` → **không render gì cả** (AGENTS.md mục 7: testimonial chỉ hiển thị khi có consent); có consent → quote (Playfair Italic), tên, `role`, ảnh tùy chọn. Unit test cả hai nhánh.
3. **`LeadForm`** – UI thuần, chưa gọi API: tên, email, checkbox đồng ý nhận tin (bắt buộc, nhãn có link tới trang chính sách bảo mật qua prop `privacyHref`), ô honeypot ẩn (ẩn với người dùng và trình đọc màn hình, `tabIndex=-1`, `autocomplete="off"`); nhãn hiển thị luôn (không dùng placeholder thay nhãn); lỗi tiếng Việt hiện ngay dưới ô; trạng thái đang gửi / thành công / lỗi; nhận `onSubmit(values)` trả Promise. Chữ trong `vi.ts`.
4. **`EmotionPicker`** – chọn **một** cảm xúc từ bộ cố định trong `src/lib/emotions.ts` (`key`, nhãn tiếng Việt, icon SVG nét mảnh – **không dùng emoji**, theo `tdcx-brand` / `ui-ux-pro-max`). Bộ mặc định đánh dấu `// PENDING Q14` – chờ Hana chốt. Dạng radio group: phím mũi tên di chuyển, `aria-checked`, vùng chạm ≥ 44px.
5. **`ProgressGrid`** – 21 ô, trạng thái `done` / `missed` / `today` / `future` / `locked`; ô `done` có thể hiện icon cảm xúc đã chọn; ô `future` và `locked` **không bấm được**; mỗi ô có nhãn cho trình đọc màn hình ("Ngày 5: đã hoàn thành"); màu dùng `mint-haze` cho done (theo mục 5), không chỉ dựa vào màu để phân biệt trạng thái (thêm icon/chữ). Lưới đọc được ở 375px.
6. **`Navbar`** – props `items[]` (`label`, `href`) + `cta` (`label`, `href`). Thứ tự mẫu theo AGENTS.md 8.1: Về Hana · Thư viện · Test thói quen 5 phút · Growth Mirror · Doanh nghiệp · nút nổi bật "Đặt phiên trải nghiệm" (`Button` primary). Mobile: nút mở menu (`aria-expanded`, `aria-controls`), Esc đóng, focus về nút mở; mục **"Test thói quen 5 phút" và nút CTA phải nhìn thấy trên mobile** (lead magnet chính – không giấu hoàn toàn trong menu đóng, ít nhất CTA hoặc quiz hiện ngoài thanh). Logo dùng `Logo`.
7. **`Footer`** – props `legalLinks[]` (6 trang pháp lý theo `order`), `sellerInfo` (tên, MST?, địa chỉ, điện thoại, email – trường nào rỗng thì ẩn), liên hệ/mạng xã hội. Năm bản quyền tự tính.

**Không làm**: gọi API/CMS, logic CTA theo `saleStatus` (T1-08), FloatingChat (T1-05), tracker thật (GĐ 2).

**Test**

- Unit: TestimonialCard (consent false → rỗng); ProductCard (`hidden` → rỗng; giá qua `PriceTag`); LeadForm (thiếu email / sai định dạng / chưa tick consent → lỗi tiếng Việt, honeypot có giá trị → không gọi `onSubmit`); ProgressGrid (ô future/locked không gọi `onSelect`); EmotionPicker (mũi tên đổi lựa chọn).
- E2E (375 + 1440) trên `/styleguide`: Navbar mobile mở/đóng bằng bàn phím; Tab qua LeadForm theo thứ tự hợp lý; tải trang không bị cuộn/cướp focus.

**Tiêu chí nghiệm thu**

- [ ] 7 component trên `/styleguide` ở 375 / 768 / 1440, đủ trạng thái (rỗng, lỗi, đang gửi, thành công).
- [ ] Mọi cặp chữ/nền ≥ 4.5:1 (chữ thường); bổ sung bảng DECISIONS nếu có cặp mới.
- [ ] Không emoji, không màu/font ngoài `tdcx-brand`; mọi nhãn cố định trong `vi.ts`; dữ liệu mẫu ghi `[MẪU]`, không dùng tên/ảnh/trích dẫn thật của Hana.
- [ ] Unit + e2e xanh trong CI; `git status` sạch sau khi chạy test.

**Giao cho: Antigravity** (05/10) · chạy song song với T0-06 (Codex).

**Ranh giới file** – chỉ được sửa:
`src/components/site/**`, `src/components/habit/**`, `src/components/ui/index.ts` (chỉ khi cần export thêm), `src/lib/emotions.ts`, `src/lib/i18n/vi.ts`, `src/app/(site)/styleguide/**`, `tests/unit/**` (file mới cho composites), `tests/e2e/styleguide.test.ts`, mục `## T0-05` ở cuối `docs/DECISIONS.md`, `docs/BACKLOG.md`.
**Không** sửa `src/payload.config.ts`, `src/collections/**`, `src/globals/**`, `src/migrations/**`, `package.json` / `pnpm-lock.yaml` (cần thêm package → hỏi trước).

**Ghi chú từ nghiệm thu T0-04**: comment code tiếng Anh; siết test B1 thành `document.activeElement === document.body`; ảnh mẫu trong `ProductCard` dùng file trong `public/` hoặc SVG brand, không dùng ảnh từ internet.

---

## T0-05b – Sửa sau nghiệm thu T0-05

**Phụ thuộc**: T0-05 · **Giao cho: Antigravity** · **Làm trên chính branch** `task/T0-05-ui-composites`, cùng PR #6. Chi tiết và lý do: `docs/tasks/reviews/T0-05.md`.

**Phạm vi**: sửa B1–B4 và S1–S5 trong file review; thêm 4 test ở mục "Test phải thêm". Ranh giới file giữ như T0-05.

**Không chạy e2e** – Planning chạy khi nghiệm thu. Chỉ chạy `pnpm lint`, `pnpm typecheck`, `pnpm test`.

**Tiêu chí nghiệm thu**

- [ ] Trang server component chỉ chứa `<Navbar …/>`, `<LeadForm …/>`, `<EmotionPicker/>`, `<ProgressGrid/>`, `<Footer/>` render 200 (Planning kiểm).
- [ ] `grep -rn "DEFAULT_\|tramdungcamxuc.com\|font-serif\|xs:\|h-18" src/components` không còn kết quả.
- [ ] Footer không truyền dữ liệu → không hiện thông tin người bán / mạng xã hội / tagline.
- [ ] Mobile 375 và 768: nút quiz hiện đủ nhãn (hoặc `shortLabel` do props truyền), cao ≥ 44px, không rớt dòng.
- [ ] Unit mới xanh; lint, typecheck xanh; `git status` sạch; CI xanh trên PR #6.

---

## T0-05c – Sửa sau nghiệm thu lại T0-05b

**Giao cho: Antigravity** · Cùng branch `task/T0-05-ui-composites`, PR #6. Chi tiết: `docs/tasks/reviews/T0-05.md` phần "Nghiệm thu lại T0-05b".

**Phạm vi**: B5 (thanh menu tràn ngang 375px) + giải xung đột `docs/DECISIONS.md` với `main`. Được sửa thêm `src/components/brand/Logo.tsx` cho B5. Không chạy e2e (Planning chạy).

**Tiêu chí nghiệm thu**

- [ ] 375px, nhãn đầy đủ, không `shortLabel`: không tràn ngang, nút ☰ trong màn hình, nút quiz cao ≥ 44px (Planning đo).
- [ ] PR #6 hết xung đột; DECISIONS giữ cả mục T0-05 và T0-06.
- [ ] Lint, typecheck, unit xanh; CI xanh trên PR #6.

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

**Giao cho: Codex** (05/10) · chạy song song với T0-05 (Antigravity).

**Ranh giới file** – chỉ được sửa:
`src/collections/**`, `src/globals/**`, `src/payload.config.ts`, `src/migrations/**`, `src/payload-types.ts` (sinh tự động), `src/app/(payload)/admin/importMap.js` (sinh tự động), `src/lib/pricing.ts`, `src/lib/auth/access.ts`, `src/fields/**` (field dùng chung, nếu cần), `tests/unit/**` và `tests/e2e/**` (file mới), `.env.example`, `package.json` / `pnpm-lock.yaml` (chỉ để thêm `@payloadcms/storage-s3` cùng phiên bản 3.90.2), mục `## T0-06` ở cuối `docs/DECISIONS.md`, `docs/BACKLOG.md`.
**Không** sửa `src/components/**`, `src/app/(site)/**`, `src/lib/i18n/vi.ts`, `tailwind.config.ts`.

**Làm rõ spec (Planning chốt 05/10)**

1. **Công thức giá gói** (`computePackageValue()` thuần, không phụ thuộc Payload):
   - `totalValue = Σ (quantity × unitValue)` của `components[]`.
   - Giá bán dùng để so = `salePrice` nếu có, ngược lại `price`.
   - `discountPercent = round((totalValue − giá bán) / totalValue × 100)`; `totalValue = 0` hoặc thiếu giá bán → `null`; giá bán > tổng giá trị → `0` (không âm).
   - Test khớp bảng AGENTS.md: CLEAR 2.500.000 / 1.750.000 → 30; BUILD 5.800.000 / 2.900.000 → 50; SHINE 10.800.000 / 4.320.000 → 60. Bộ công cụ số ghi 1 dòng `quantity 2 × 250.000` hoặc 2 dòng – cả hai phải ra đúng tổng.
   - `retailPrice` chỉ để hiển thị, **không** dùng trong công thức (Q5 chưa chốt).
2. **Chỉ đọc thật sự**: `totalValue`, `discountPercent` tính trong hook `beforeChange`; giá trị gửi lên qua REST/Local API bị bỏ qua. Có test: tạo gói với `totalValue: 1` trong body → giá trị lưu vẫn là số tính đúng.
3. **Access tạm**: tạo `src/lib/auth/access.ts` chỉ với `authenticated` và `publishedOrAuthenticated` (public đọc bản `published`, admin đăng nhập đọc tất cả). Đánh dấu `// REVIEW-REQUIRED:`. T0-07 mở rộng file này – không viết `isOwner` / `isEditor` ở T0-06.
4. **Media R2**: chỉ bật `@payloadcms/storage-s3` khi đủ biến `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION` (mặc định `auto`); thiếu → lưu disk local. Thêm các biến này (để trống) vào `.env.example`. `alt` bắt buộc.
5. **`pages`**: collection (GAPS B1); `slug` duy nhất, `/` = trang chủ, chỉ cho chữ thường không dấu, số, `-`, `/`; `versions.drafts.autosave` bật; `puckData` là field JSON (chưa có editor – T0-09).
6. **`navigation`**: `mainMenu[]` {`label`, `linkType` (page / url), `page` (rel `pages`), `url`, `highlight` (bool, cho nút "Đặt phiên trải nghiệm")}; `footerMenu[]` cùng cấu trúc. Một cấp, chưa có menu con.
7. **`siteSettings`** tab "Thanh toán" gồm: `bankBin`, `bankName`, `accountNumber`, `accountName`, `transferPrefix` (mặc định `TDCX`). Không lưu khóa API cổng thanh toán trong CMS.
8. **`eqCards.qrSlug`**: duy nhất; khi `printedAt` có giá trị thì đổi `qrSlug` qua API → lỗi tiếng Việt "Thẻ đã in, không được đổi mã QR". Test bằng Local API.
9. **`testimonials`**: `_status = published` khi `consent = false` → lỗi validate tiếng Việt.
10. Không seed dữ liệu (T0-08). Không làm `users` role (T0-07).
11. Một migration cho toàn bộ schema T0-06 (`pnpm migrate:create content_collections`); chạy được trên DB mới và trên DB đang có migration `initial`.

**Test bổ sung**: `tests/unit/pricing.test.ts` (thuần); test Local API cho chỉ đọc giá trị gói, khóa `qrSlug`, testimonial thiếu consent, media thiếu alt (chạy với Postgres như CI); e2e: tạo user đầu tiên → sidebar admin có đủ 5 nhóm (Nội dung / Bán hàng / Khóa học / EQ Buddy / Hệ thống).

---

## T0-06b – Sửa sau nghiệm thu T0-06

**Phụ thuộc**: T0-06 · **Giao cho: Codex** · Làm trên branch `task/T0-06-content-collections`. **PR #7 đã bị merge trước khi có T0-06b (05/10 12:50)** → mở **PR mới** từ cùng branch sau khi `git merge origin/main`. Chi tiết: `docs/tasks/reviews/T0-06.md`.

**Phạm vi**: sửa B1 (chuẩn hóa slug trang) và S1–S4. Không đổi schema (không cần migration); nếu buộc phải đổi schema thì dừng và hỏi. Ranh giới file như T0-06.

**Tiêu chí nghiệm thu**

- [ ] Tạo trang với `ve-hana`, `/ve-hana`, `ve-hana/` → chỉ một bản ghi `ve-hana` tồn tại (các lần sau báo trùng); `a//b` bị chặn với lỗi tiếng Việt; `/` vẫn là trang chủ.
- [ ] Gửi lại cùng `printedAt` khác định dạng → lưu được; đổi/xóa ngày in → lỗi gắn đúng trường `printedAt`.
- [ ] E2E trên DB dev đã có admin → skip có lý do (không đỏ); trên CI vẫn chạy.
- [ ] Lint, typecheck, unit, e2e xanh; `git status` sạch; CI xanh trên PR #7.

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
   - 16 `diagnosticQuestions`, 11 `techniques`, 20 `lessons` trong 4 module: lấy từ file Excel Habit Hack ở `docs/sources/` nếu có; **nếu không có, tạo placeholder ghi rõ "[MẪU] Tình huống 1"…** và báo trong báo cáo.
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

### T0-09 – Giao việc và làm rõ spec (Planning chốt 05/10)

**Giao cho: Antigravity** · Phụ thuộc T0-05 (PR #6) và T0-06b (PR #8) đã merge · Chạy song song với T0-10 (Codex).

**Quy trình [SPIKE]**: làm spike trước (≤ 2 giờ), ghi kết quả vào mục `## T0-09` cuối `docs/DECISIONS.md`, **dừng và báo Planning duyệt phương án** rồi mới làm phần còn lại. Spike trả lời 4 câu:
1. Editor đặt ở `/admin/builder/[pageId]` cùng route catch-all `/admin/[[...segments]]` của Payload có chạy không (layout riêng, không dính CSS admin)? Không ổn → `/builder/[pageId]`.
2. Kiểm tra đăng nhập phía server: lấy user Payload từ cookie bằng `payload.auth({ headers })` trong server component; chưa đăng nhập → chuyển `/admin/login?redirect=…`.
3. Phiên bản `@puckeditor/core` stable mới nhất chạy được với React / Next.js 16.3.3 đang cài (ghi phiên bản chính xác, ghim cứng trong `package.json`).
4. Puck có field rich text sẵn ở phiên bản đó không; nếu không → khối `RichText` dùng `textarea` nhiều đoạn (không nhận HTML).

**Spike đã duyệt (05/10)** – xem `docs/tasks/reviews/T0-09.md`: route `/builder/[pageId]`, RichText dạng `textarea`, Puck `0.23.0`, kèm 6 yêu cầu bổ sung.

**Kiến trúc dữ liệu**
- Editor nạp trang bằng Local API phía server (`draft: true`), truyền `puckData` vào `<Puck>`.
- "Lưu nháp" và "Xuất bản" gọi **server action** dùng Local API với `user` đã xác thực và `overrideAccess: false`: lưu nháp `draft: true`; xuất bản ghi `_status: 'published'`. Không tin dữ liệu `pageId`/user từ trình duyệt – kiểm lại quyền trong action. Đánh dấu `// REVIEW-REQUIRED:` ở guard route và server action.
- Trang công khai: `src/app/(site)/page.tsx` (slug `/`) và `src/app/(site)/[...slug]/page.tsx` (slug nối bằng `/`, khớp quy ước T0-06b) đọc bản **published** (`draft: false`), không có → `notFound()`; `generateMetadata` từ `seo`. Render bằng `<Render>` của Puck. Bỏ trang chủ tạm của T0-03 khi đã có trang `/` published; chưa có → giữ trang tạm (không 404 trang chủ).
- Revalidate: hook `afterChange` trong `Pages.ts` gọi `revalidatePath` cho slug khi xuất bản (đọc docs Next 16 về cache/revalidate trước).
- Nút **"Chỉnh sửa trực quan"**: field `type: 'ui'` trong `Pages.ts` (không tạo cột DB → không cần migration; nếu `migrate:create` báo có thay đổi schema thì dừng và hỏi).

**5 khối** (`src/puck/blocks/`, mỗi khối có `version: 1`, nhãn tiếng Việt, render bằng component trong `src/components/`):
- `HeroTwoEntries` → component mới `src/components/site/HeroTwoEntries.tsx`: tiêu đề 2 tầng + dòng cảm xúc + đúng 2 lối vào {nhãn, mô tả, nút, link}. **Không có chữ mặc định trong code** – giá trị mặc định khi kéo khối vào chỉ là `[MẪU] …`.
- `SectionHeader` → `ui/SectionHeader`.
- `RichText` → theo kết quả spike câu 4; render an toàn (không `dangerouslySetInnerHTML` với dữ liệu thô).
- `ImageText` → component mới `src/components/site/ImageText.tsx`: ảnh trái/phải, ảnh chọn từ collection `media` (field tùy biến liệt kê media qua API, **chỉ lưu `id`**; lúc render lấy `url` + `alt` phía server). Ảnh không có `alt` thì không chọn được.
- `CTAButton` → `ui/Button` (variant `primary` / `secondary` / `ghost`, size S/M/L).
- Field brand-safe: màu nền là dropdown 8 token; khoảng cách / cỡ chữ là S/M/L; **không** color picker, không ô CSS, không chọn font.

**Ranh giới file**: `src/puck/**`, `src/app/(builder)/**` (route `/builder/[pageId]`), `.prettierignore` (thêm `pnpm-lock.yaml`), `src/app/(site)/page.tsx`, `src/app/(site)/[...slug]/**`, `src/components/site/HeroTwoEntries.tsx`, `src/components/site/ImageText.tsx`, `src/components/site/index.ts`, `src/collections/Pages.ts` (chỉ field `ui` + hook revalidate), `src/app/(payload)/admin/importMap.js` (sinh tự động), `src/lib/i18n/vi.ts`, `package.json` / `pnpm-lock.yaml` (chỉ thêm `@puckeditor/core`), `tests/**` (file mới), mục `## T0-09` cuối `docs/DECISIONS.md`.
**Không** sửa: `next.config.ts`, middleware/proxy, `Dockerfile`, `docker-compose*.yml`, `.github/workflows/**`, `.env.example` (Codex đang làm T0-10), collection khác ngoài `Pages.ts`.

**Test**: unit render từng khối với props `[MẪU]` (snapshot hoặc assert nội dung); unit server action từ chối khi không có user. E2E **viết nhưng không chạy** (Planning chạy): (a) chưa đăng nhập vào URL editor → chuyển trang login; (b) kéo Hero vào trang trống → sửa tiêu đề → Xuất bản → trang công khai hiện tiêu đề mới; (c) sửa tiếp → Lưu nháp → trang công khai vẫn tiêu đề cũ.

## T0-10 – Đóng gói Docker để tự deploy bản demo

**Phụ thuộc**: T0-06b (đã merge) · **Giao cho: Codex, ngay sau T0-06b** (cùng sửa `.env.example`, nên để một agent làm liên tiếp) · Không cần tài khoản IT.
**Quyết định 05/10**: anh Nhân tự pull repo từ GitHub và deploy lên cloud hosting riêng để **demo cho khách hàng**. Bản demo này thay thế "preview" trong cổng GĐ 0. Hạ tầng production (Vercel + Neon + R2) chuyển sang **T0-10b**, không chặn GĐ 0.

**Hiện trạng**: `Dockerfile` là bản mẫu của Next.js nhưng **chưa chạy được**: `next.config.ts` chưa có `output: 'standalone'`, không có volume cho media, không có hướng dẫn migrate, dùng `node:22.17.0-alpine` chưa được ghi trong DECISIONS.

**Phạm vi**

1. `next.config.ts`: bật `output: 'standalone'` **chỉ khi** biến build `NEXT_OUTPUT=standalone` (đặt trong Dockerfile). `pnpm start` ở local và CI giữ nguyên hành vi.
2. `Dockerfile` multi-stage, pnpm qua corepack đúng phiên bản trong `package.json`, chạy user không phải root. Ảnh chạy được `sharp` (Payload). Đọc hướng dẫn Docker chính thức của Payload 3.90 và Next.js 16 trước khi sửa.
3. **Migration lúc khởi động**: dùng `prodMigrations` đã có trong `payload.config.ts` (Payload tự chạy migration khi khởi tạo ở production). Kiểm chứng điều này; nếu không chạy thì thêm bước migrate trước `node server.js`. Container khởi động trên DB trống → `/admin` hiện form tạo user đầu tiên.
4. `docker-compose.yml` (dev): cổng Postgres đọc từ `${POSTGRES_PORT:-5432}` (máy dev đang có dự án khác chiếm 5432 – xem `docs/tasks/PARALLEL_AGENTS.md`); ghi biến vào `.env.example` và README.
4b. `docker-compose.prod.yml`: service `app` + `postgres` (image `postgres:18`, khớp CI), volume tên riêng cho DB và cho thư mục media, `restart: unless-stopped`, healthcheck cho cả hai. App chỉ mở 1 cổng (mặc định 3000, đổi qua `APP_PORT`). Postgres **không** mở cổng ra ngoài. 
5. Media: lưu đĩa local trong volume khi không có biến S3 (khớp cơ chế T0-06). Xóa container rồi tạo lại → ảnh đã upload vẫn còn.
6. **Bản demo không được Google index**: biến `SITE_NOINDEX=true` → mọi response có header `X-Robots-Tag: noindex, nofollow`, `robots.txt` chặn toàn bộ. Mặc định trong `.env.example` để trống (production sau này sẽ index).
7. `.env.example`: thêm `APP_PORT`, `SITE_NOINDEX`, `POSTGRES_PASSWORD` (dùng cho compose). Ghi chú rõ `PAYLOAD_SECRET` phải sinh mới (`openssl rand -hex 32`) và `STYLEGUIDE_PUBLIC=true` nếu muốn khách xem `/styleguide`.
8. `docs/RUNBOOK.md` mục mới **"Deploy bản demo trên server riêng"**, viết cho anh Nhân làm theo từng lệnh:
   - yêu cầu server (Docker + Compose, RAM tối thiểu, cổng);
   - lần đầu: clone → tạo `.env` → `docker compose -f docker-compose.prod.yml up -d --build` → mở `/admin` tạo tài khoản `owner`;
   - cập nhật bản mới: `git pull` → build lại → kiểm tra;
   - quay về bản trước (rollback): checkout tag/commit cũ rồi build lại; nếu bản mới có migration thì backup DB trước khi cập nhật;
   - backup / khôi phục DB bằng `pg_dump` / `pg_restore` (có lệnh cụ thể) và backup volume media;
   - gợi ý đặt reverse proxy có HTTPS (Caddy hoặc Nginx + Let's Encrypt), chỉ hướng dẫn, không bắt buộc trong compose;
   - phương án không dùng Docker: Node 22 + `pnpm build` + `pnpm start` + process manager (pm2/systemd), mô tả ngắn.
8b. RUNBOOK ghi rõ `pnpm test` cần Postgres đang chạy (test Local API của T0-06 tự áp migration).
8c. ~~CI: sửa test chập chờn `content-admin`~~ – **đã xong** (Planning, commit `2b08c1f`: lỗi click trước khi admin hydrate). Bỏ qua mục này. Nguyên gốc: (xem ghi chú cuối `docs/tasks/reviews/T0-06.md`) – làm nóng server trước e2e hoặc tăng timeout `first-register`.
9. CI: thêm job build Docker image (không push lên registry) để Dockerfile không bị hỏng âm thầm.
10. Ghi phiên bản image Node/Postgres và lý do vào mục `## T0-10` cuối `docs/DECISIONS.md`.

**Không làm**: Vercel, Neon, R2, domain thật, email (T0-10b / GĐ 1). Không đưa dữ liệu khách thật lên bản demo.

**Ranh giới file**: `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `docker-compose.prod.yml`, `next.config.ts`, `src/middleware.ts` hoặc cơ chế header tương đương, `src/app/robots.ts`, `.env.example`, `.github/workflows/ci.yml`, `docs/RUNBOOK.md`, `README.md` (1 dòng trỏ tới RUNBOOK), mục `## T0-10` trong `docs/DECISIONS.md`, `tests/**` (file mới).

**Tiêu chí nghiệm thu**

- [ ] Trên máy sạch: clone → tạo `.env` theo RUNBOOK → `docker compose -f docker-compose.prod.yml up -d --build` → `/admin` hiện form tạo user đầu tiên, không chạy tay lệnh migrate nào (Planning tự làm theo RUNBOOK).
- [ ] Upload 1 ảnh → `docker compose down` → `up -d` → ảnh và dữ liệu vẫn còn.
- [ ] `SITE_NOINDEX=true` → `curl -I` thấy `X-Robots-Tag: noindex`; `/robots.txt` chặn toàn bộ.
- [ ] Postgres không truy cập được từ bên ngoài server (không có `ports:` cho service DB).
- [ ] `pnpm build && pnpm start` ở local vẫn chạy như cũ; CI xanh, có job build Docker.
- [ ] Làm thử backup → xóa DB → restore theo RUNBOOK thành công (ghi lệnh và kết quả vào báo cáo).

---

## T0-10b – Hạ tầng production (Vercel + Neon + R2)

**Phụ thuộc**: IT trả lời GAPS D1, D2 và cấp tài khoản · **Không chặn cổng GĐ 0.** Phải xong trước T1-15 (kết nối domain thật). Nếu Hana quyết định chạy production luôn trên server riêng thì task này đổi thành "nâng bản demo lên production" (thêm R2, backup tự động, giám sát); Planning viết lại khi có quyết định.

**Phạm vi**

1. Kết nối repo với Vercel; preview cho mỗi PR, production từ `main`.
2. Neon Postgres: DB production + branch cho preview (nếu dùng tích hợp Neon–Vercel). Migration chạy tự động khi deploy.
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
3. Chuẩn bị tài khoản `owner` cho Hana trên bản demo (T0-10) (gửi lời mời qua email, không gửi mật khẩu qua chat).

**Tiêu chí nghiệm thu (= cổng GĐ 0)**

- [ ] Hana tự đăng nhập, tạo 1 sản phẩm, dựng 1 trang từ 5 khối và xuất bản theo hướng dẫn, không cần hỗ trợ.
- [ ] `ESTIMATES.md` được Planning duyệt; Master Plan cập nhật lịch.
