# Bàn giao ghế Planning (Claude) – 08/10/2026, 16:45

Đọc file này trước khi làm gì. Phiên Planning trước chạy trên máy Local; phiên mới (cloud) **không có** lịch sử hội thoại, DB Docker cổng 55432, worktree QA hay memory cũ – mọi thứ cần biết nằm ở đây và trong `docs/tasks/`.

## Vai trò

- Người dùng: **anh Nhân** (reviewer kỹ thuật, điều phối). Chủ dự án: **Hana** (không biết code). Trả lời người dùng bằng **tiếng Việt**.
- Claude = **BA / Planning / QA**: QA từng PR, viết biên bản `docs/tasks/reviews/<MÃ>.md`, tự sửa lỗi nhỏ khi nhanh hơn, **chỉ Planning merge** (sau khi ghi ĐẠT), giao task bằng file `docs/tasks/prompts/<MÃ>.md`, cập nhật bảng `docs/tasks/README.md`.
- Lệnh người dùng dán cho agent:
  ```
  Chạy: GIT_TERMINAL_PROMPT=0 timeout 60 git fetch origin < /dev/null && git --no-pager show origin/main:docs/tasks/prompts/<MÃ>.md
  rồi làm đúng theo nội dung file đó.
  ```
- Quy tắc: `docs/tasks/WORKFLOW.md` (một task = một nhánh = một máy; khóa 🔒 Migration/Package; đo giờ bằng `scripts/task-time.mjs`, khoảng nghỉ > 10 phút chỉ tính 5 s). AGENTS.md là spec gốc.

## Máy và quota

| Máy    | Công cụ                                         | Ghi chú                                                                                                   |
| ------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| PC nhà | Antigravity (tài khoản riêng, nhiều token nhất) | Giao chuỗi nặng nhất (đang: thanh toán)                                                                   |
| Local  | Antigravity + Codex                             | Chung quota Antigravity với Laptop; Codex chỉ việc ngắn (review thứ hai, đọc `docs/tasks/CODEX_BRIEF.md`) |
| Laptop | Antigravity                                     | Chung quota với Local – Local ưu tiên                                                                     |

Antigravity **không** chạy app/Playwright/Docker; Planning chạy e2e/build. Agent hay **quên mở PR** (9 lần) – kiểm `git branch -r` + `gh pr list` mỗi khi nhận "done", mở hộ nếu thiếu.

## Trạng thái 08/10 16:45

- **GĐ 0**: đạt cổng 06/10.
- **GĐ 1**: 13/17 hạng mục báo giá xong (19/25 việc nhỏ). Bảng chi tiết: `docs/tasks/README.md`.
- **Đang làm**: **T1-12c** @PC nhà – sửa thanh toán 149k trên nhánh `task/T1-12b-payment-ui` (PR #46, base `task/T1-12a-payment-backend`; PR #34 là T1-12a). Gồm 5 lỗi Codex (2 nghiêm trọng: race khi xác nhận/hủy/cron → UPDATE có điều kiện tại DB) + lỗi QA T1-12b. Biên bản: `docs/tasks/reviews/T1-12b.md`. Sau T1-12c: Planning QA → **IT duyệt** các `REVIEW-REQUIRED` → đổi base PR #46 về `main`, đóng/merge #34 → mở **T1-13** (link thanh toán gói, PC nhà).
- **Chưa mở**: T1-10b (Live Preview, chờ nhả khóa Package của T1-12a), T1-13, **T1-17b** (Planning: QA tổng, Lighthouse ≥ 90 mobile, axe, cổng GĐ 1; chụp lại ảnh 25 của hướng dẫn CMS bằng `scripts/cms-screenshots.mjs`).
- **Local, Laptop**: đang trống – để nghỉ tiết kiệm quota chung, chờ Hana chốt câu hỏi quiz (dưới).
- **Chờ dòng `THỜI GIAN THỰC`** từ agent: T1-14, T1-16, T1-17a, T1-17c, T1-17d, T1-12b (và T1-15b tính lại).

## Quyết định đã chốt (gần đây)

- Q10 Analytics = **Plausible**.
- Nội dung của Hana: để sẵn chỗ trống trong CMS; Hana tự nhập hoặc anh Nhân gửi file để Planning **import vào DB** (mẫu: `pnpm import:habit`, `seed/import/`).
- Đã nhập file Habit Hack (`docs/sources/CÔNG CỤ XÂY THÓI QUEN…xlsx`): 16 câu quiz, 11 kỹ thuật, 20 bài học / 7 nhóm (`docs/decisions/import-habit-hack.md`).
- Bảng giá: Cách 3 tính AI theo **phí thuê bao** ($60/tháng × số tháng × % dùng), giờ QA của anh = **6 h/ngày × ngày làm việc**; Cách 2 anh Nhân tự chỉnh.

## Lịch máy 09–10/10

PC nhà: T1-13. Codex (Local): T1-10b, rồi review thứ hai T1-13. **Antigravity Local + Laptop tạm nghỉ đến hết thứ Bảy 10/10.** File `docs/sources/HANA EQ - HABIT.rar` chỉ để trên máy Local (đã ignore) – commit cục bộ `8a688a4` thêm file này trên nhánh `task/T1-17d-runtime-site-url` **không được push** (186 MB > giới hạn 100 MB của GitHub).

## Prototype UI của Hana (09/10)

`docs/plan/HANA_PROTOTYPE.md` – mẫu giao diện EQ Buddy + Habit Loop, dùng làm tham khảo cho GĐ 2/3, không chép code. Câu hỏi mới: Q15–Q18 trong `docs/plan/GAPS_AND_QUESTIONS.md`.

## Câu hỏi đang chờ Hana (họp tối 08/10)

Trang họp: https://claude.ai/artifact/GBxJ4tX2MW9tLtG4HtKCWr (ô ghi quyết định lưu trên trình duyệt anh Nhân; anh sẽ dán lại kết quả). Nhóm "chốt ngay": Q4, Q11, Q12, Q13, xác nhận Q5/Q7. Quiz: H1 thang 1–4 hay 1–5, **H2 chấm theo điểm trung bình** (16 câu chia lệch Cue 6/Craving 3/Response 5/Reward 2), H3–H5. Trước GĐ 2: Q1–Q3, Q6, Q8, Q9, Q14, bài xem thử. IT: D1, D2, lịch duyệt T1-12a. Khi có kết quả: cập nhật `docs/plan/GAPS_AND_QUESTIONS.md` + giao task sửa chấm quiz (Local/Laptop).

## Deploy demo (anh Nhân tự chạy trên server)

`docs/RUNBOOK.md` mục "Deploy bản demo". Mới 08/10: `.env` cần `SITE_URL=http://IP-SERVER:3400` và `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA` (khóa thử nghiệm công khai). Nhập Habit: `docker compose -p tdcx-demo -f docker-compose.prod.yml --profile tools run --rm seed pnpm import:habit`.

## Dashboard chi phí

https://claude.ai/artifact/U9xggVXfKnYsgo5NuBaNMe – kho `settings/main`, `tasks/<mã>` (17 hạng mục GĐ 1 theo ESTIMATES, không phải việc nhỏ), `usage/<máy>`. Sau mỗi đợt nghiệm thu: cập nhật trạng thái task + `usage/local` (script `scripts/qa/collect-usage.mjs local`, chỉ chạy được trên máy có log). **Không bịa `actualHours`.**

## QA (chỉ chạy được ở máy có Docker Postgres)

Trình tự Planning dùng: `pnpm install --frozen-lockfile` → `pnpm migrate` → `pnpm lint` → `pnpm typecheck` (xóa `.next` cũ trước) → `pnpm test` → `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA pnpm build` → `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA CI=true pnpm test:e2e`. Dùng DB sạch (drop/create) cho mỗi lần QA; trang có Turnstile không chờ `networkidle`. Nếu môi trường cloud không có Postgres: dựa vào CI của PR (cùng các bước) + đọc diff.

Lưu ý máy Local: cổng 5432/3000 là của dự án khác (sop-os-mvp) – không đụng.
