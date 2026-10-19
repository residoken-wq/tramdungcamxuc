# SM-04b – Sửa SM-04 vòng 1 + nút "Chọn gói này" 404 (giao: Antigravity, **Laptop**)

Biên bản: `docs/tasks/reviews/SM-04.md` (đọc **toàn bộ** trước khi làm; mục B1–B11, C1, "Đã chốt"). Prompt gốc: `docs/tasks/prompts/SM-04.md` – mọi quy tắc chung ở đó vẫn áp dụng. Ước lượng: 4–5 h.

- Làm tiếp trên **cùng nhánh** `task/SM-04-puck-blocks-b` (không tạo nhánh mới, không rebase, không force-push).
- **Không** migration DB, **không** thêm package. **Không** sửa `src/app/(site)/(shell)/dat-phien-trai-nghiem/page.tsx` ngoài B1.
- **Không** sửa `docs/tasks/README.md`, `docs/tasks/reviews/**` (của Planning).

**Đo thời gian (bắt buộc)**: `node scripts/task-time.mjs start SM-04b` sau bước 0; nối `; node scripts/task-time.mjs lap` vào cuối **mọi** lệnh; cuối task `node scripts/task-time.mjs report` → dán **nguyên dòng** `THỜI GIAN THỰC …` vào báo cáo và mô tả PR.

## 0. Chuẩn bị + mở PR (làm NGAY – 3 task liền quên)

```bash
GIT_TERMINAL_PROMPT=0 timeout 60 git fetch origin < /dev/null
git status --short          # có thay đổi chưa commit → DỪNG, báo lại
git switch task/SM-04-puck-blocks-b
git merge --ff-only origin/task/SM-04-puck-blocks-b
git merge --no-edit origin/main     # xung đột → DỪNG, báo lại
pnpm install < /dev/null 2>&1 | tail -1
pnpm migrate < /dev/null 2>&1 | tail -1
git push origin task/SM-04-puck-blocks-b
gh pr create --draft --base main --title "feat(puck): sitemap v2 blocks batch B – Ve Tram + Coach 1:1 (SM-04)" --body "Laptop. SM-04 + SM-04b. E2E: Planning chạy." < /dev/null
```

`gh pr create` lỗi → ghi nguyên văn lỗi vào báo cáo, làm tiếp.

## 1. Làm (mỗi mục 1 commit, message có mã mục, VD `fix(booking): hide hidden services and packages (SM-04b B1)`)

1. **B1 – Lọc dịch vụ / gói ẩn.** Thêm điều kiện `saleStatus` **khác** `hidden` (cùng `_status = published`) ở 4 chỗ: danh sách dịch vụ và tra `?goi=` trong `dat-phien-trai-nghiem/page.tsx`; 2 lượt tra trong `createExperienceOrder` (`orders.server.ts`, giữ `// REVIEW-REQUIRED (SM-04)`). Gói chỉ nhận `type = package`.
2. **B5 – Test `createExperienceOrder`** (DB thật, theo mẫu test đơn 149.000đ đang có; dữ liệu `[MẪU]`, email `@example.com`; dọn sạch sau test):
   - dịch vụ + gói hợp lệ → `notes` = `Nhu cầu: …` / `Lộ trình quan tâm: <tên>` / `Gói quan tâm: <tên>` (tên **tra từ DB**);
   - ID / slug không tồn tại, bản nháp, `saleStatus = hidden`, slug của sản phẩm không phải gói → không thêm dòng, đơn vẫn tạo;
   - `total` / giá đơn = giá sản phẩm phiên trải nghiệm, `paymentStatus = pending` (không đổi so với `main`).
3. **C1 – Link đặt phiên luôn có `?san-pham=<id>`** (cách sửa đã chốt, xem biên bản):
   - `src/puck/resolve.server.ts`: nếu trang có khối `PackageComparison`, `PackageCards`, `CTASection`, `Callout` hoặc `FAQ` (aside `booking`) → tra **1 lần** sản phẩm phiên trải nghiệm mặc định: `type = coaching_trial`, `_status = published`, `saleStatus = on_sale`, giá hiệu lực > 0 (dùng `getEffectivePrice`), sort `order` rồi `id`, `limit 1`. Gắn `bookingProductId` (số hoặc `null`) vào `_resolved` của các khối đó.
   - Component dựng link bằng `getBookingPath(bookingProductId)` (`src/lib/products.ts`); nút "Chọn gói này" thêm `&goi=<slug>` (dùng `URLSearchParams`, không nối chuỗi tay).
   - `CTASection`, `Callout`, `FAQ`: chỉ thay khi link Hana nhập **đúng bằng** `/dat-phien-trai-nghiem` (hoặc ô trống ở FAQ); link khác giữ nguyên.
   - Trang công khai, `bookingProductId = null` → **ẩn** nút đặt phiên / "Chọn gói này" (không dẫn tới 404). Trong editor: hiện nút + ghi chú nhỏ "Chưa có sản phẩm phiên trải nghiệm đang bán" (`vi.ts`).
   - Không đổi `version` / props đã lưu của các khối SM-03 (chỉ thêm dữ liệu `_resolved`, không lưu DB) → không cần migration Puck.
   - Test: unit cho helper chọn sản phẩm (không có / nháp / ẩn / giá 0 / 2 sản phẩm → chọn theo `order`); snapshot hoặc assert link mỗi khối có `san-pham=`; `null` → không có nút ở trang công khai.
   - `docs/HUONG_DAN_CMS.md`: 1 dòng – nút đặt phiên tự dẫn tới sản phẩm phiên trải nghiệm đang bán đầu tiên (theo thứ tự); không có sản phẩm đang bán thì nút tự ẩn.
4. **B2 – `HanaStory` nền tối.** `tone = dark` hoặc `bgColor = deep-navy`: nhãn series `text-soft-pink`, tiêu đề dòng 1 `text-white`, dòng 2 `text-soft-pink` (tham khảo `QuoteBlock` v2 nền tối của SM-03). Không sửa `SectionHeader` dùng chung nếu không cần – nếu sửa, chỉ **thêm** prop tùy chọn, mặc định = như cũ, và mọi snapshot cũ giữ nguyên. Test: render dark → dòng 1 không có `text-deep-navy`.
5. **B6 – Kiểu `letter`.** Thêm `greeting` (lời chào, Playfair Italic, trên đoạn văn) và `signatureName` (tên ký). Bỏ chữ "Hana Lương" viết cứng trong component (cả alt dự phòng: dùng alt của media → `signatureName` → bỏ trống `alt=""` chỉ khi ảnh là trang trí). Trống thì không hiện. Tăng `HanaStory` lên **v3** + migration `v3-hana-story.ts` (2 field rỗng), test chạy 2 lần không đổi thêm.
6. **B9 – `JourneySteps` render như cũ.** Kiểu `circles` giữ `mb-2` như `main`; snapshot `JourneySteps` cũ trong `puck-blocks.test.tsx.snap` phải **giống hệt `main`** (`git diff origin/main -- tests/unit/__snapshots__/puck-blocks.test.tsx.snap` chỉ còn dòng của khối mới + HanaStory).
7. **B3 + B4 + B11 – Dữ liệu mẫu.** Toàn bộ `/styleguide` (Sm04BlocksDemo) và test:
   - Người: `[MẪU] Thành viên Test 01/02/03`, vai trò `[MẪU] Vai trò Test`, bio `[MẪU] …` – không bằng cấp, không con số, không tên người thật (kể cả Hana). Có `consent: true` → demo `TeamGrid` hiện 3 card (1 có ảnh, 2 chữ cái đầu).
   - Tổ chức / logo: `[MẪU] Tổ chức Test 01…` – không tên tổ chức thật.
   - Chip / nhãn ảnh / số liệu: `[MẪU] …`, không con số kiểu "500+ giờ", "12+ doanh nghiệp".
   - Test schema: `[MẪU] Học viên Test 01`, `hoc-vien-test-01@example.com`.
   - Ảnh demo `ImageText`: không tràn khung card (dùng ảnh demo đúng tỉ lệ hoặc `object-contain`).
   - Kiểm lại: `grep -n "Hana\|ICF\|Six Seconds\|Nguyễn\|Trần\|500+\|12+" src/app/\(site\)/styleguide/Sm04BlocksDemo.tsx tests/unit/puck-blocks-sm04.test.tsx` → rỗng.
8. **B7 – Test cách ly client component.** Với mỗi khối của SM-04 (8 khối): gọi `render` với `puck` giả có hàm, duyệt `element.props` (cả object lồng `puck`) và `expect` không có giá trị là hàm.
9. **B8 – Chữ cố định vào `vi.ts`.** "Chỉ đọc", 2 câu ghi chú editor của `LogoStrip`, nhãn "(tùy chọn)" của "Lộ trình quan tâm" (khóa riêng, không mượn `phoneOptional`). Bỏ mọi `vi.sm04?.x || '…'` → `vi.sm04.x`. Badge "Chỉ đọc" không xuống dòng ở 375px.
10. **B10 – Tài liệu.** `docs/decisions/SM-04.md`: mục "Chỗ khác prompt" ghi việc sửa 3 file `src/puck/templates/**` (lý do: mẫu phải ở version mới), HanaStory v3, cách sửa C1.

## 2. Kiểm và nộp

1. Prettier trên file mình sửa.
2. `pnpm lint && pnpm typecheck && pnpm test` xanh (lint không thêm cảnh báo so với `main`). `pnpm build` một lần (15 dòng cuối).
3. Tự kiểm C1 trên máy (`pnpm build && pnpm start`, DB đã `pnpm seed`): mở `/styleguide` hoặc 1 trang có `PackageComparison` (bật "Chọn gói này") → bấm nút → form đặt phiên mở được (không 404), hiện "Gói quan tâm: …". Ghi URL đã mở vào báo cáo.
4. Ảnh chụp 375px + 1440px: `HanaStory` dark (thấy đủ 2 dòng tiêu đề), `HanaStory` letter, `TeamGrid` demo, form đặt phiên mở từ nút "Chọn gói này" → `docs/screenshots/sm04/`, đính vào PR.
5. `git status` sạch, push, `node scripts/task-time.mjs report`, thêm dòng `THỜI GIAN THỰC …` vào mô tả PR, `gh pr ready`.

**KHÔNG** chạy e2e. **KHÔNG** `gh pr merge`.

Báo cáo theo mẫu mục 13 AGENTS.md: bảng B1–B11 + C1 (đã sửa / cách sửa / commit), danh sách `REVIEW-REQUIRED`, link PR.
