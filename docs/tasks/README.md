# Bảng giao việc

> **Quy trình 3 máy – đọc trước: [`WORKFLOW.md`](WORKFLOW.md)** (luật vàng, lane A/B, hồ sơ máy, vòng đời task, chống xung đột file). Chỉ ghế Planning sửa bảng này; khi lệch, danh sách PR trên GitHub là đúng.

> Planning Manager giao từng task theo thứ tự trong bảng. Antigravity chỉ nhận task có trạng thái **Sẵn sàng**.
> Kế hoạch tổng: `docs/plan/MASTER_PLAN.md` · Lỗ hổng & mặc định: `docs/plan/GAPS_AND_QUESTIONS.md`

## 1. Prompt mẫu để giao một task

Dán nguyên khối này vào Antigravity (Agent Manager → New task), đổi mã task:

```
Bạn là kỹ sư full-stack của dự án Trạm Dừng Cảm Xúc. Vai "Codex" trong AGENTS.md chính là bạn.

Trước khi code, đọc theo thứ tự:
1. AGENTS.md (toàn bộ)
2. docs/plan/GAPS_AND_QUESTIONS.md (các quyết định mặc định ghi đè/bổ sung AGENTS.md)
3. docs/DECISIONS.md (nếu đã có)
4. Task T0-03 trong docs/tasks/GD0.md

Quy trình:
- Tạo branch `task/T0-03-<mo-ta-ngan>` từ main.
- Lập implementation plan ngắn (artifact) và chờ tôi duyệt trước khi sửa code nếu task có nhãn [REVIEW] hoặc [SPIKE]. Task khác: làm luôn.
- Đọc docs chính thức của Payload / Next.js / Puck cho đúng phiên bản đang cài trước khi dùng API (dùng MCP Context7; với Next.js đọc thêm node_modules/next/dist/docs/).
- Task có giao diện: dùng skill `tdcx-brand` trước, sau đó mới đến frontend-design / ui-ux-pro-max / vercel-react-best-practices. Khi xung đột, `tdcx-brand` thắng.
- Chỉ làm trong phạm vi task. Ý tưởng ngoài phạm vi → docs/BACKLOG.md.
- Spec thiếu hoặc mâu thuẫn → dừng và hỏi, không đoán.
- Chạy `pnpm lint && pnpm typecheck && pnpm test` trước khi báo xong.
- Kết thúc bằng báo cáo theo mẫu mục 13 AGENTS.md, kèm checklist "Tiêu chí nghiệm thu" của task đã tick.
```

### 1b. Prompt mẫu cho Codex (agent thứ hai, chạy song song)

> **Trên máy dev: đọc `docs/tasks/PARALLEL_AGENTS.md` trước** – mỗi agent một thư mục (git worktree), một database, một cổng.

Từ 05/10 dự án có 2 agent code: **Antigravity** (giao diện, Puck) và **Codex** (CMS, dữ liệu, backend). Cột "Trạng thái" ghi tên agent nhận task. Hai agent không bao giờ nhận 2 task cùng sửa một file (xem mục "Ranh giới file" trong task card).

```
Bạn là kỹ sư full-stack của dự án Trạm Dừng Cảm Xúc. AGENTS.md ở gốc repo là hướng dẫn chính của bạn.

Trước khi code, đọc theo thứ tự:
1. AGENTS.md (toàn bộ)
2. docs/plan/GAPS_AND_QUESTIONS.md (quyết định mặc định ghi đè/bổ sung AGENTS.md)
3. docs/DECISIONS.md
4. Task <MÃ> trong docs/tasks/GD0.md (đọc cả mục "Ranh giới file")

Quy trình:
- `git pull` main, tạo branch `task/<MÃ>-<slug>` từ main.
- Task có nhãn [REVIEW] hoặc [SPIKE]: viết plan ngắn và chờ duyệt trước khi sửa code.
- Đọc docs chính thức đúng phiên bản đang cài (Payload 3.90.2, Next.js 16.3.3 – đọc node_modules/next/dist/docs/; Payload đọc node_modules/payload và payloadcms.com/docs). Không dựa vào trí nhớ.
- Chỉ sửa file trong "Ranh giới file" của task. Cần sửa file ngoài ranh giới → dừng và hỏi.
- Spec thiếu hoặc mâu thuẫn → dừng và hỏi, không đoán. Ý tưởng ngoài phạm vi → docs/BACKLOG.md.
- Comment code bằng tiếng Anh; nhãn admin / giao diện bằng tiếng Việt có dấu.
- Đổi schema → `pnpm migrate:create <ten>` rồi `pnpm migrate`. Không dùng push.
- Ghi vào docs/DECISIONS.md trong một mục riêng `## <MÃ> – ...` ở CUỐI file (tránh xung đột với agent kia).
- Chạy `pnpm lint && pnpm typecheck && pnpm test` và `pnpm test:e2e` trên DB đã migrate trước khi báo xong; `git status` phải sạch sau khi chạy test.
- Commit nhỏ, message tiếng Anh, push branch, mở PR vào main (hoặc gửi link "Compare & pull request"). Không tự merge.
- Kết thúc bằng báo cáo theo mẫu mục 13 AGENTS.md, kèm checklist "Tiêu chí nghiệm thu" đã tick.
```

## 2. Quy ước

| Nhãn                   | Nghĩa                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **[REVIEW]**           | Chạm vào auth / phân quyền / thanh toán / mở khóa nội dung. Đánh dấu `// REVIEW-REQUIRED:` trong code. Không merge khi IT chưa duyệt. |
| **[SPIKE]**            | Có phần thử nghiệm kỹ thuật trước; kết quả ghi vào `docs/DECISIONS.md` rồi mới làm tiếp.                                              |
| **[HANA]**             | Cần Hana thao tác hoặc cung cấp nội dung để nghiệm thu.                                                                               |
| **Song song được với** | Có thể giao cho một agent khác cùng lúc mà ít rủi ro xung đột.                                                                        |

- **Chỉ merge PR khi Planning đã ghi "ĐẠT" trong `docs/tasks/reviews/<mã>.md`.** PR luôn có base = `main`.
- **Agent không bao giờ chạy `gh pr merge`** hay bấm merge, kể cả khi CI xanh. Chỉ Planning (hoặc anh Nhân) merge sau khi có ĐẠT.
- Branch: `task/<mã>-<slug>`. Commit kiểu `feat(scope): ...` tiếng Anh, nhỏ.
- Mỗi task phải để repo ở trạng thái build được và test xanh.
- Thay đổi schema Payload phải kèm migration (`payload migrate:create`), không dùng `push` trên DB preview/production.

## 3. Bảng trạng thái

Trạng thái: `Sẵn sàng` · `Đang làm` · `Chờ review` · `Xong` · `Bị chặn (lý do)` · `Chưa mở`

### GĐ 0 – Nền móng (`docs/tasks/GD0.md`)

| Mã     | Task                                                                                                    | Nhãn     | Phụ thuộc             | Trạng thái                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------- | -------- | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| T0-01  | Khởi tạo repo Next.js + Payload + Postgres + Tailwind                                                   |          | –                     | Xong ([review](reviews/T0-01.md))                                                                              |
| T0-01b | Sửa sau nghiệm thu T0-01 (gitignore, DECISIONS, PR)                                                     |          | T0-01                 | Xong                                                                                                           |
| T0-02  | CI, lint, Vitest, Playwright                                                                            |          | T0-01b                | Xong ([review](reviews/T0-02.md))                                                                              |
| T0-02b | Migration đầu tiên, smoke test thật, CI chạy trên `main`                                                |          | T0-02                 | Xong                                                                                                           |
| T0-03  | Design tokens, font, brand SVG, trang `/styleguide`                                                     |          | T0-02b                | Xong ([review](reviews/T0-03.md))                                                                              |
| T0-03b | Sửa sau nghiệm thu T0-03 (styleguide production, test bẩn repo, CRLF)                                   |          | T0-03                 | Xong                                                                                                           |
| T0-04  | UI primitives                                                                                           |          | T0-03b                | Xong – PR #5 ([review](reviews/T0-04.md))                                                                      |
| T0-04b | Sửa sau nghiệm thu T0-04 (Modal cướp focus, PriceTag tương phản)                                        |          | T0-04                 | Đạt (05/10)                                                                                                    |
| T0-05  | UI composites                                                                                           |          | T0-04b (đã merge)     | Xong – PR #6 ([review](reviews/T0-05.md))                                                                      |
| T0-05b | Sửa sau nghiệm thu T0-05 ('use client', dữ liệu bịa, font, nút quiz mobile)                             |          | T0-05                 | Đạt                                                                                                            |
| T0-05c | Thanh menu tràn ngang 375px + giải xung đột DECISIONS                                                   |          | T0-05b                | Đạt                                                                                                            |
| T0-06  | Collections nội dung + globals + media R2                                                               |          | T0-01                 | Đã merge (PR #7, **trước khi có T0-06b**) ([review](reviews/T0-06.md))                                         |
| T0-06b | Sửa sau nghiệm thu T0-06 (chuẩn hóa slug trang, so ngày in, vị trí ảnh, skip e2e trên DB dev)           |          | T0-06                 | Xong – PR #8 ([review](reviews/T0-06.md)); Planning sửa thêm test hydrate `2b08c1f`                            |
| T0-06c | Test ngày in thẻ EQ phụ thuộc múi giờ máy (fail trên máy UTC+7)                                         |          | T0-06b                | Xong – PR #15 ([review](reviews/T0-06.md)); anh Nhân chạy lại `pnpm test` trên máy UTC+7                       |
| T0-07  | Collections người dùng, giao dịch + phân quyền                                                          | [REVIEW] | T0-06                 | Xong – PR #13 ([review](reviews/T0-07.md)); chờ IT đọc lại REVIEW-REQUIRED                                     |
| T0-08  | Seed dữ liệu MẪU                                                                                        |          | T0-07                 | Xong – PR #12 ([review](reviews/T0-08.md))                                                                     |
| T0-09  | Puck editor + 5 khối đầu + nháp/xuất bản                                                                | [SPIKE]  | T0-05, T0-06b         | Xong – PR #9 ([review](reviews/T0-09.md))                                                                      |
| T0-09b | Sửa sau nghiệm thu T0-09 (config kéo Payload vào client, chọn ảnh, nền tối, link an toàn, version khối) |          | T0-09                 | Đạt                                                                                                            |
| T0-09c | Viết lại e2e editor (b)(c) cho chạy được thật + sửa mất thông báo                                       |          | T0-09b                | Đạt (Codex)                                                                                                    |
| T0-09d | Việc nhỏ: `safeHref` chặn `/\`, nhãn Puck tiếng Việt, tương phản nút Xuất bản                           |          | T0-09 (đã merge)      | Xong – PR #10                                                                                                  |
| T0-10  | Đóng gói Docker + RUNBOOK để tự deploy bản demo                                                         |          | T0-06b (đã merge)     | Xong – PR #11 ([review](reviews/T0-10.md))                                                                     |
| T0-10c | CI build image → GHCR, server demo chỉ pull về chạy                                                     |          | T0-10 (đã merge)      | Đã merge – PR #14 ([review](reviews/T0-10.md)); chờ anh chọn private + PAT hay public để kiểm pull trên server |
| T0-10b | Hạ tầng production Vercel + Neon + R2 (không chặn GĐ 0)                                                 |          | tài khoản IT (D1, D2) | Bị chặn (chờ IT) – hạn: trước T1-15                                                                            |
| T0-11a | Ước lượng GĐ 1–4 (`docs/plan/ESTIMATES.md`)                                                             |          | dữ liệu GĐ 0          | Xong – PR #17 + PR #19 ([review](reviews/T0-11.md)); **đã duyệt 06/10**                                        |
| T0-11b | Hướng dẫn CMS nháp + tài khoản Hana cho cổng GĐ 0                                                       | [HANA]   | T0-07, T0-08, T0-10c  | Đạt – PR #16 ([review](reviews/T0-11.md)); ảnh chụp dời sang T1-17a                                            |
| T0-12  | Bật tiếng Việt cho admin Payload (i18n `vi`)                                                            |          | T0-11b                | Xong – PR #18 ([review](reviews/T0-12.md))                                                                     |

**✅ Cổng GĐ 0 đạt 06/10/2026** (Hana tự làm checklist mục 7 `HUONG_DAN_CMS.md` trên bản demo; ESTIMATES đã duyệt). Mốc **N = 06/10/2026**.

### GĐ 1 – Web 1 Landing + CMS (`docs/tasks/GD1.md`)

Mở từ 06/10/2026. Đã tách T1-02, T1-12, T1-17 theo `docs/plan/ESTIMATES.md` mục 3. Prompt: `docs/tasks/prompts/<MÃ>.md`.

**Cổng GĐ 1 (10/10): kỹ thuật ĐẠT – chờ Hana làm bài kiểm tra** → [`GATE_GD1.md`](GATE_GD1.md).

**🔒 Migration: (trống) · 🔒 Package: (trống)**

**Lịch máy 10/10**: PC nhà = T2-01 · ~~T1-17b~~ (xong) · trước đó ~~T1-13~~, ~~T1-17e~~ (xong) · Codex (Local) = ~~T1-10b~~ (xong), review thứ hai T1-13 khi PR sẵn sàng · **Antigravity máy Local và Laptop tạm nghỉ đến hết thứ Bảy 10/10** (không giao task mới).

| Mã     | Task                                                                             | Nhãn     | Phụ thuộc                   | Máy               | Trạng thái                                                                                                                                 |
| ------ | -------------------------------------------------------------------------------- | -------- | --------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| T1-01  | Khối Puck: Mở đầu, Nội dung, Bố cục                                              |          | GĐ 0                        | Local             | Xong – PR #20 ([review](reviews/T1-01.md))                                                                                                 |
| T1-02a | Khối Puck: Bán hàng (puckData chỉ lưu ID sản phẩm)                               |          | T1-01, T1-08                | Local             | Xong – PR #25 ([review](reviews/T1-02a.md))                                                                                                |
| T1-02b | Khối Puck: Niềm tin + revalidate                                                 |          | T1-02a                      | Local             | Xong – PR #27 ([review](reviews/T1-02b.md))                                                                                                |
| T1-03  | Khối Puck: Chuyển đổi                                                            |          | T1-02b, T1-06               | Local             | Xong – PR #31 ([review](reviews/T1-03.md))                                                                                                 |
| T1-04  | Puck: 4 mẫu trang, versions, khóa khối, autosave                                 |          | T1-03                       | Local             | Xong – PR #35 ([review](reviews/T1-04.md))                                                                                                 |
| T1-05  | Navbar, Footer, FloatingChat Zalo, 6 trang pháp lý                               |          | GĐ 0                        | Laptop            | Xong – PR #21 ([review](reviews/T1-05.md))                                                                                                 |
| T1-06  | Hạ tầng form + email: lead, coaching, B2B                                        |          | GĐ 0                        | PC nhà            | Xong – PR #22 ([review](reviews/T1-06.md))                                                                                                 |
| T1-07  | Giao tài nguyên miễn phí qua email                                               |          | T1-06                       | PC nhà            | Xong – PR #29 ([review](reviews/T1-07.md))                                                                                                 |
| T1-08  | Logic hiển thị sản phẩm theo `saleStatus`                                        |          | GĐ 0                        | Local             | Xong – PR #23 ([review](reviews/T1-08.md))                                                                                                 |
| T1-09  | Thư viện `/thu-vien` 2 tab + bộ lọc                                              |          | T1-08                       | Laptop            | Xong – PR #26 ([review](reviews/T1-09.md))                                                                                                 |
| T1-10  | Trang con dữ liệu: coaching, doanh nghiệp, blog, tài nguyên                      |          | T1-08                       | Laptop            | Xong – PR #28 ([review](reviews/T1-10.md))                                                                                                 |
| T1-10b | Live Preview Payload cho services / programs / posts                             |          | T1-10, T1-07 (khóa Package) | Codex@Local       | ✅ Merge 09/10 – PR #53 · IT duyệt ([review](reviews/T1-10b.md))                                                                           |
| T1-11  | Trang Growth Mirror + bảng 3 gói                                                 |          | T1-10                       | Laptop            | Xong – PR #36 ([review](reviews/T1-11.md))                                                                                                 |
| T1-12a | Thanh toán 149k: backend, `PaymentProvider`, VietQR, cron                        | [REVIEW] | T1-06                       | PC nhà            | ✅ Merge 08/10 (PR #46, gộp #34) · IT duyệt ([review](reviews/T1-12a.md))                                                                  |
| T1-12b | Thanh toán 149k: form đặt phiên, trang QR, admin duyệt đơn                       | [REVIEW] | T1-12a                      | PC nhà            | ✅ Merge 08/10 (PR #46) ([review](reviews/T1-12b.md))                                                                                      |
| T1-12c | Sửa 149k: chuyển trạng thái nguyên tử, khóa REST, chữ vào vi.ts, e2e             | [REVIEW] | T1-12b                      | PC nhà            | ✅ Merge 08/10 (PR #46) · IT duyệt · 0,53 h ([review](reviews/T1-12c.md))                                                                  |
| T1-13  | Link thanh toán gói do Hana tạo + cấp quyền                                      | [REVIEW] | T1-12b                      | PC nhà            | ✅ Merge 09/10 – PR #55 · IT duyệt · 0,68 h ([review](reviews/T1-13.md))                                                                   |
| T1-14  | Quiz chẩn đoán `/habit/chan-doan`                                                |          | T1-06                       | Laptop            | Xong – PR #42 ([review](reviews/T1-14.md))                                                                                                 |
| T1-15a | SEO, security headers (CSP report-only), font tự host                            |          | T1-05                       | Laptop            | Xong – PR #33 ([review](reviews/T1-15a.md))                                                                                                |
| T1-15b | Analytics Plausible (Q10 đã chốt), CSP chặn thật, domain                         |          | T1-15a                      | Laptop            | Xong – PR #39 ([review](reviews/T1-15b.md))                                                                                                |
| T1-16  | Dựng các trang seed từ mẫu theo mục 8.1                                          | [HANA]   | T1-04, T1-10, T1-11         | Local             | Xong – PR #41 ([review](reviews/T1-16.md))                                                                                                 |
| T1-17a | `HUONG_DAN_CMS.md` bản 1 + ảnh chụp (gồm 14 ảnh còn nợ của GĐ 0)                 | [HANA]   | T1-16                       | Local             | Xong – PR #43 ([review](reviews/T1-17a.md)); 25 ảnh do Planning chụp; nội dung Hana: để chỗ trống trong CMS, nhập tay hoặc Planning import |
| T1-17e | Chuẩn bị cổng GĐ 1 phía code: spec axe, ảnh LCP, test bền, tìm gốc lỗi trang đơn |          | T1-13                       | PC nhà            | ✅ Merge 09/10 – PR #59 · 0,44 h ([review](reviews/T1-17e.md))                                                                             |
| T1-17b | QA tổng: E2E, Lighthouse, axe, cổng GĐ 1                                         | [HANA]   | tất cả, T1-17e              | PC nhà + Planning | ✅ Code: PR #61 (0,52 h) · Đo: Planning 10/10 – axe 0 lỗi, Lighthouse 94–96, gốc lỗi trang đơn ([review](reviews/T1-17b.md))               |
| T1-17c | Sửa giao diện còn tồn (ảnh bìa trống, chữ cứng, alt/aria, lỗi admin tiếng Việt)  |          | T1-16                       | Laptop            | Xong – PR #48 ([review](reviews/T1-17c.md))                                                                                                |
| T1-17d | Địa chỉ site đọc lúc chạy (link email đúng trên demo)                            |          | PR #45                      | Local             | Xong – PR #47 ([review](reviews/T1-17d.md))                                                                                                |
| T1-18  | Hết link chết từ nút sản phẩm (`/sap-ra-mat`, công cụ số miễn phí)               |          | –                           | Laptop            | ✅ Merge 11/10 – PR #74, Planning sửa e2e tự tạo dữ liệu + giới hạn thẻ lead 120 ký tự ([review](reviews/T1-18.md))                        |

### GĐ 2 – Web 2 Habit MVP (`docs/tasks/GD2.md`)

**MỞ 10/10/2026** (cổng GĐ 1 đạt). Quyết định đã chốt: Q8 SePay, Q9 Bunny, Q14 10 cảm xúc emoji, H1/H2 quiz 1–5 trung bình, Q19, D1/D2 server riêng. Còn mở: Q15 (giá, trong CMS).

**🔒 Migration: T2-04 (PC nhà) · 🔒 Package: (trống)** · Local và Laptop nghỉ đến hết 10/10.

**Thứ tự máy (từ 11/10)**: Laptop = T2-00 → T2-12 → T1-18 → T2-10 → T2-05a · PC nhà = T2-01 → T2-13 → T2-02 → T2-08 · Local = T2-03 → T2-03b.

| Mã    | Task                                                             | Nhãn     | Phụ thuộc    | Máy      | Trạng thái                                                                                                                                                                   |
| ----- | ---------------------------------------------------------------- | -------- | ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T2-00 | Cô lập unit test dùng chung DB                                   |          | –            | Laptop   | ✅ Merge 11/10 – PR #70, Planning sửa tự nhận diện file DB ([review](reviews/T2-00.md))                                                                                      |
| T2-01 | Đăng nhập khách bằng OTP email                                   | [REVIEW] | cổng GĐ 1    | PC nhà   | ✅ Merge 12/10 – PR #72 (vòng 2 + T2-01c Planning, IT duyệt) ([review](reviews/T2-01.md))                                                                                    |
| T2-02 | Dịch vụ quyền truy cập (trial 21 ngày, active)                   | [REVIEW] | T2-01        | PC nhà   | ✅ Merge 12/10 – PR #83, Planning sửa 6 lỗi (T2-02c), IT duyệt ([review](reviews/T2-02.md))                                                                                  |
| T2-03 | Habit Loop 5 phút + trang offer                                  |          | cổng GĐ 1    | Local    | QA ĐẠT vòng 2 12/10 – PR #80 (T2-03b Local + T2-03c Planning), IT duyệt ([review](reviews/T2-03.md)) · merge khi CI xanh                                                     |
| T2-04 | Luồng dùng thử 21 ngày, đổi CTA quiz                             |          | T2-02        | PC nhà   | QA ĐẠT 13/10 – PR #90, Planning sửa 7 lỗi (T2-04c), IT duyệt ([review](reviews/T2-04.md)) · merge khi CI xanh, rồi trả 🔒 Migration                                          |
| T2-05 | Video bảo vệ + dashboard học                                     | [REVIEW] | T2-02        | Laptop   | T2-05a **CHƯA ĐẠT** 12/10 – PR #86: ghi tiến độ song song lỗi + e2e ([review](reviews/T2-05a.md)) → Laptop sửa theo `prompts/T2-05a2.md` · T2-05b (Bunny thật) chờ tài khoản |
| T2-06 | Tracker 21 ngày + nhắc nhở                                       |          | T2-02, T2-04 | PC nhà   | Giao PC nhà sau khi T2-04 merge (prompt `prompts/T2-06.md`), nhận 🔒 Migration                                                                                               |
| T2-07 | Chứng nhận 21 ngày                                               |          | T2-06        | Local    | Chờ T2-06                                                                                                                                                                    |
| T2-08 | Mua công cụ số (xác nhận thủ công)                               | [REVIEW] | T2-02        | PC nhà   | ✅ Merge 12/10 – PR #84, vòng 2 (T2-08b), IT duyệt ([review](reviews/T2-08.md))                                                                                              |
| T2-09 | Webhook thanh toán tự động                                       | [REVIEW] | T2-08        | PC nhà   | Chờ T2-08 + tài khoản SePay                                                                                                                                                  |
| T2-10 | Lịch workshop + nhắc 24 giờ                                      |          | T2-01        | Laptop   | ✅ Merge 12/10 – PR #81, Planning sửa 9 lỗi + e2e (T2-10c), IT duyệt ([review](reviews/T2-10.md))                                                                            |
| T2-12 | Quiz: thang 1–5, chấm điểm trung bình (H1, H2)                   |          | –            | Laptop   | ✅ Merge 11/10 – PR #71, Planning sửa giới hạn điểm lưu kết quả ([review](reviews/T2-12.md))                                                                                 |
| T2-13 | Owner xác nhận đơn đã hết hạn (Q19)                              | [REVIEW] | –            | PC nhà   | QA ĐẠT 11/10 – PR #76, Planning thay e2e rỗng bằng unit test giao diện ([review](reviews/T2-13.md)) · IT duyệt, ✅ merge 11/10                                               |
| T2-14 | Dọn dữ liệu thử giống thật, chặn đồng ý ở server, test chập chờn | [REVIEW] | –            | Local    | Đã giao Local 12/10 (prompt `prompts/T2-14.md`)                                                                                                                              |
| T2-11 | E2E luồng Habit + cổng GĐ 2                                      | [HANA]   | tất cả       | Planning | –                                                                                                                                                                            |

## 4. Checklist nghiệm thu chung (Planning dùng cho mọi task)

- [ ] Báo cáo đủ 6 mục theo mẫu AGENTS.md mục 13
- [ ] Tiêu chí nghiệm thu riêng của task đều tick, có cách kiểm tra cho người không biết code
- [ ] `pnpm lint`, `typecheck`, `test` xanh trên CI
- [ ] Không hardcode copy / giá / ảnh (grep nhanh số tiền như `178`, `250.000`, `149` trong `src/` ngoài seed và test)
- [ ] Đẹp ở 375px và 1440px (ảnh chụp trong PR)
- [ ] Có migration nếu đổi schema
- [ ] `.env.example` cập nhật nếu thêm biến
- [ ] Chỗ nhạy cảm có `// REVIEW-REQUIRED:` và IT đã duyệt
- [ ] Không file nào ngoài phạm vi task bị sửa mà không giải thích
