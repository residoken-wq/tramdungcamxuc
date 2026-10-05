# Bảng giao việc cho Antigravity

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
- Branch: `task/<mã>-<slug>`. Commit kiểu `feat(scope): ...` tiếng Anh, nhỏ.
- Mỗi task phải để repo ở trạng thái build được và test xanh.
- Thay đổi schema Payload phải kèm migration (`payload migrate:create`), không dùng `push` trên DB preview/production.

## 3. Bảng trạng thái

Trạng thái: `Sẵn sàng` · `Đang làm` · `Chờ review` · `Xong` · `Bị chặn (lý do)` · `Chưa mở`

### GĐ 0 – Nền móng (`docs/tasks/GD0.md`)

| Mã    | Task                                                  | Nhãn     | Phụ thuộc           | Trạng thái |
| ----- | ----------------------------------------------------- | -------- | ------------------- | ---------- |
| T0-01 | Khởi tạo repo Next.js + Payload + Postgres + Tailwind |          | –                   | Xong ([review](reviews/T0-01.md)) |
| T0-01b | Sửa sau nghiệm thu T0-01 (gitignore, DECISIONS, PR) | | T0-01 | Xong |
| T0-02 | CI, lint, Vitest, Playwright|| T0-01b| Xong ([review](reviews/T0-02.md)) |
| T0-02b | Migration đầu tiên, smoke test thật, CI chạy trên `main` | | T0-02 | Xong |
| T0-03 | Design tokens, font, brand SVG, trang `/styleguide`   |          | T0-02b              | Xong ([review](reviews/T0-03.md))    |
| T0-03b | Sửa sau nghiệm thu T0-03 (styleguide production, test bẩn repo, CRLF) | | T0-03 | Xong |
| T0-04 | UI primitives                                         |          | T0-03b               | Đạt – chờ PR + CI xanh rồi merge ([review](reviews/T0-04.md)) |
| T0-04b | Sửa sau nghiệm thu T0-04 (Modal cướp focus, PriceTag tương phản) | | T0-04 | Đạt (05/10) |
| T0-05 | UI composites                                         |          | T0-04b (đã merge)    | Sẵn sàng sau khi T0-04 merge – **Antigravity** |
| T0-06 | Collections nội dung + globals + media R2             |          | T0-01               | Sẵn sàng – **Codex** (song song T0-05) |
| T0-07 | Collections người dùng, giao dịch + phân quyền        | [REVIEW] | T0-06               | Chưa mở    |
| T0-08 | Seed dữ liệu MẪU                                      |          | T0-07               | Chưa mở    |
| T0-09 | Puck editor + 5 khối đầu + nháp/xuất bản              | [SPIKE]  | T0-05, T0-06        | Chưa mở    |
| T0-10 | Đóng gói Docker + RUNBOOK để tự deploy bản demo       |          | T0-01               | Sẵn sàng – **Codex**, làm ngay sau T0-06 |
| T0-10b | Hạ tầng production Vercel + Neon + R2 (không chặn GĐ 0) | | tài khoản IT (D1, D2) | Bị chặn (chờ IT) – hạn: trước T1-15 |
| T0-11 | Ước lượng GĐ 1–4 + hướng dẫn CMS nháp cho cổng GĐ 0   | [HANA]   | tất cả              | Chưa mở    |

### GĐ 1 – Web 1 Landing + CMS (`docs/tasks/GD1.md`)

Chỉ mở khi cổng GĐ 0 đạt.

| Mã    | Task                                                        | Nhãn     | Phụ thuộc           |
| ----- | ----------------------------------------------------------- | -------- | ------------------- |
| T1-01 | Khối Puck: Mở đầu, Nội dung, Bố cục                         |          | GĐ 0                |
| T1-02 | Khối Puck: Bán hàng, Niềm tin (lấy dữ liệu Payload)         |          | T1-01, T1-08        |
| T1-03 | Khối Puck: Chuyển đổi                                       |          | T1-02, T1-06        |
| T1-04 | Puck: 4 mẫu trang, versions, khóa khối, autosave            |          | T1-03               |
| T1-05 | Navbar, Footer, FloatingChat Zalo, 6 trang pháp lý          |          | GĐ 0                |
| T1-06 | Hạ tầng form + email: lead, coaching, B2B                   |          | GĐ 0                |
| T1-07 | Giao tài nguyên miễn phí qua email                          |          | T1-06               |
| T1-08 | Logic hiển thị sản phẩm theo `saleStatus`                   |          | GĐ 0                |
| T1-09 | Thư viện `/thu-vien` 2 tab + bộ lọc                         |          | T1-08               |
| T1-10 | Trang con dữ liệu: coaching, doanh nghiệp, blog, tài nguyên |          | T1-08               |
| T1-11 | Trang Growth Mirror + bảng 3 gói                            |          | T1-10               |
| T1-12 | Thanh toán thủ công phiên trải nghiệm 149k                  | [REVIEW] | T1-06               |
| T1-13 | Link thanh toán gói do Hana tạo + cấp quyền                 | [REVIEW] | T1-12               |
| T1-14 | Quiz chẩn đoán `/habit/chan-doan`                           |          | T1-06               |
| T1-15 | Analytics, SEO, security headers, domain                    |          | T1-05               |
| T1-16 | Dựng các trang seed từ mẫu theo mục 8.1                     | [HANA]   | T1-04, T1-10, T1-11 |
| T1-17 | QA tổng, E2E, Lighthouse, `HUONG_DAN_CMS.md` bản 1          | [HANA]   | tất cả              |

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
