# Bàn giao ghế Planning (Claude) – cập nhật 15/10/2026

## Cập nhật 15/10/2026 – đọc mục này trước

- **16/10 – phân vai (anh Nhân)**: Planning (phiên này) điều phối các GĐ, giao cho **PC nhà**; agent CMS riêng lo `docs/plan/CMS_UX.md` (CM-xx, Laptop / Local). Task GĐ nào liên quan CMS / giao diện admin → báo anh Nhân chuyển cho agent CMS. PC nhà: T2-20 (`prompts/T2-20.md`, 🔒 Migration).
- **15/10 khuya**: T2-19 ĐẠT + merge (PR #125); T3-04 ĐẠT sau T3-04c (PR #127, IT duyệt). Cả 3 máy rảnh. Planning còn: T2-11, T3-06 (cổng GĐ 3).
- **15/10 tối**: T2-18, T3-05 ĐẠT + merge; T3-02 ĐẠT sau T3-02c (PR #121, IT duyệt cookie khách + kiểm quyền). PC nhà: T3-04 (`prompts/T3-04.md`, 🔒 Migration). Laptop: T2-19 ĐẠT sau T2-19c (PR #125, IT duyệt) → rảnh. Local rảnh. Planning: T2-11, T3-06.
- **Cổng GĐ 2**: đơn thật qua SePay đã thanh toán và mở khóa tự động (anh Nhân xác nhận 15/10). T2-11 còn: e2e tổng luồng Habit, Lighthouse / axe trang mới, biên bản `GATE_GD2.md` (Planning).
- **T2-16**: vòng 2 CHƯA ĐẠT, Planning sửa T2-16c (`8e12f01`, `dc86c5b`, PR #109) – biên bản `reviews/T2-16.md`. **ĐẠT**, IT duyệt 15/10 → merge khi CI xanh, trả 🔒 Migration cho T3-01.
- **15/10 chiều**: T3-03 ĐẠT + merge (PR #115); T3-01 + T3-01b ĐẠT sau T3-01c (PR #116) – đã nhập thử 26 thẻ thật trên DB QA. Laptop: T2-18 → T3-02 (`prompts/T3-02.md`). PC nhà sau T3-01: T3-04 (chưa viết prompt). Local: T3-05.
- **GĐ 3 MỞ 15/10** (`GD3.md`, bảng `README.md`): PC nhà = T3-01 (chờ merge T2-16) · Laptop = T3-03 · Local = T3-05. Tiếp theo: T3-02 (Laptop), T3-04 (PC nhà), T3-06 (Planning).
- **26 thẻ EQ thật**: file in của Hana (PDF Canva, ảnh – không có lớp chữ) đã nhận 15/10; Planning chép tay thành JSON 26 thẻ, **giữ ngoài repo** (repo công khai). Mỗi thẻ: thông điệp + từ khóa tiếng Anh A–Z, 3 câu Gợi nhớ / Gói ghém / Ghi nhận. Nhập bằng `EQ_CARDS_FILE=… pnpm import:eq` (T3-01b) – anh Nhân giữ file để chạy trên server.
- Bài học QA vòng này: kiểm `git diff --stat` tìm file **ngoài ranh giới** (PC nhà sửa test của task khác, có lệnh xóa nội dung thật); hàm export từ file `'use server'` là endpoint công khai.

## Cập nhật 13/10/2026 (bàn giao sang acc Claude mới) – đọc mục này TRƯỚC TIÊN

**Trạng thái GĐ 2** (bảng đầy đủ: `README.md`):

- **Đã merge**: T2-00, T2-01, T2-02, T2-03, T2-04, T2-05a, T2-05b, T2-06, T2-08, T2-10, T2-12, T2-13, T2-14. Biên bản ở `reviews/`.
- **ĐẠT 14/10, merge**: T2-07 (PR #102), T2-09 (PR #103, trả 🔒 Migration), T2-15 (PR #106, trả 🔒 Package). Biên bản `reviews/`.
- **Đang sửa sau QA 14/10 (CHƯA ĐẠT)**: T2-16b @PC nhà (PR #109, giữ 🔒 Migration) – chặn xóa ngoài luồng, chặn khi còn đơn chờ, hủy đơn quá hạn, transaction thật, dấu vết dùng thử (hash email), 72 giờ · T2-17 **ĐẠT** 14/10 (Planning tự làm T2-17b, IT duyệt, PR #110). Quyết định anh Nhân 14/10 ghi trong `reviews/T2-16.md`, `T2-17.md`. Local, Laptop rảnh.
- **Nghiệm thu thật còn chờ tài khoản**: Bunny (T2-05b, RUNBOOK "Cấu hình Bunny Stream"), SePay (T2-09).
- **Lên demo** cần crontab mỗi giờ: `/api/cron/workshop-reminders`, `/api/cron/trial-reminders`, `/api/cron/expire-entitlements`, `/api/cron/tracker-nudges` (mẫu trong `docs/RUNBOOK.md`).

**Quy trình QA mỗi task** (đã dùng cho mọi task GĐ 2):

1. Mở PR **draft** cho nhánh của máy (máy không tự mở được PR), body ghi "Planning mở PR…".
2. Đọc prompt + diff; cho 1 agent review độc lập chạy song song (đối chiếu từng mục prompt, tìm lỗi mới).
3. Worktree QA riêng (vd `git worktree add /home/user/qa`), checkout nhánh, `git merge origin/main` (xung đột thường chỉ ở `docs/RUNBOOK.md`, `docs/HUONG_DAN_CMS.md`, `src/lib/i18n/vi.ts` → giữ cả 2 bên).
4. `service postgresql start`; container mới **không** đặt `trust` cho 127.0.0.1 → tạo role trùng user OS (`su postgres -c "psql -c 'create role root superuser login'"`) rồi dùng socket: `DATABASE_URI='postgres://root@/tdcx_unit?host=/var/run/postgresql'` (không sửa `pg_hba`). Truyền biến qua lệnh, **không** tạo / đọc `.env*`:
   `DATABASE_URI=postgres://postgres@127.0.0.1:5432/tdcx_unit PAYLOAD_SECRET=qa-unit-throwaway-secret-0000000000 NEXT_PUBLIC_SITE_URL=http://localhost:3000` → `pnpm migrate`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.
   Migration mới: thử lên → xuống → lên trên DB sạch (đặt `batch` của migration mới lên số lớn rồi `pnpm payload migrate:down` để chỉ lùi 1 file).
5. E2E trên máy cloud: DB `tdcx_e2e` (phải **không** có user admin), thêm `E2E_TEST_HOOKS=1`; chép test thành `tests/e2e/zz-qa-*.test.ts`, thay bước chờ `cf-turnstile-response` bằng `Promise.resolve({` (proxy chặn Cloudflare); file cấu hình `playwright.qa.config.ts` (chỉ ở worktree QA, không commit) trỏ `QA_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; chạy `env -u CI pnpm exec playwright test -c playwright.qa.config.ts <file> --workers=1 --repeat-each=2`; xóa `rate_limit_hits` giữa các lần; xóa file `zz-qa-*` sau đó; tắt server bằng `pkill -f '[n]ext dev'; pkill -f '[n]ext-server'`.
6. Lỗi nhỏ / vừa: Planning tự sửa trên nhánh (commit `fix(...): … (T2-xxc)`), push; lỗi lớn: viết biên bản CHƯA ĐẠT + prompt `<MÃ>b.md` trả máy.
7. Biên bản `reviews/<MÃ>.md` (mẫu: `reviews/T2-06.md`), hỏi anh Nhân duyệt từng nhóm `REVIEW-REQUIRED` (AskUserQuestion), ghi "IT duyệt" vào biên bản.
8. PR task: bỏ draft → merge khi CI xanh. Docs (biên bản, prompt, README) đi PR riêng từ nhánh Planning, merge khi CI xanh.

**Lỗi hay gặp ở các máy** (soát kỹ): e2e không tick đồng ý / không chờ Turnstile / URL không neo `$` / bấm trước khi trang sẵn sàng (phải `toPass`); form bấm được trước khi hydrate (khóa bằng `useSyncExternalStore`); dò chữ "unique" thay vì bắt `ValidationError`; thử lại không giới hạn; file `'use server'` export object; tạo / gắn dữ liệu trước khi kiểm quyền; chữ tiếng Việt ngoài `vi.ts`; màu ngoài 8 màu brand (`bg-white`, `red-*`); thiếu `motion-reduce`; test để rác trong DB (CI chạy unit rồi e2e **trên cùng một DB**: unit không gọi `seed()`, không để lại admin / sản phẩm / trang); từ CM-03, sản phẩm `on_sale` + xuất bản trong test phải có `price` và `isSample: true` (hoặc ảnh bìa); chạy `pnpm test` trên DB **trống** trước khi báo xanh. **CSS trong admin Payload**: không import CSS toàn cục (`@tailwind base`, reset) từ component admin – Payload gộp vào mọi trang admin; reset nếu cần phải gói trong lớp gốc của component bằng `:where()`. **Mọi** server action (kể cả chỉ đọc / chỉ render) đều phải kiểm phiên – server action là endpoint công khai. **Xuất bản qua Local API**: `draft: false` chưa đủ – phải gửi `_status: 'published'` trong `data` (thiếu là Payload lưu bản nháp, CM-07b); test xuất bản phải đọc lại bản ghi và kiểm `_status`. e2e: selector lấy từ đúng chữ trong `vi.ts`; báo xanh chỉ khi đã thấy test chạy qua hết (dán dòng `N passed`).

## Cập nhật 10/10/2026 (phiên cloud) – đọc mục này trước

- **Cổng GĐ 1 ĐẠT 10/10** (anh Nhân xác nhận thay Hana) → `docs/tasks/GATE_GD1.md`. Việc của Hana (8 bài kiểm tra, nội dung 6 trang pháp lý, lead thật) làm trước go-live, không chặn GĐ 2.
- **GĐ 2 MỞ 10/10**: `docs/tasks/GD2.md`, bảng `README.md`. Quyết định chốt 10/10 (Q2, Q8 SePay, Q9 Bunny, Q14 10 cảm xúc emoji, H1/H2, Q19, D1/D2 server riêng): `docs/plan/GAPS_AND_QUESTIONS.md` mục "Kết quả chốt 10/10/2026"; AGENTS.md đã cập nhật. Còn mở: Q15 (giá).
- **Giao**: PC nhà = T2-01 (OTP); Laptop = T2-00 → T2-12; Local = T2-03 (viết prompt khi giao). Prompt sẵn: T2-00, T2-01, T2-12.
- **Repo public 10/10** (Hana đồng ý) – quy tắc trong `docs/DECISIONS.md`; Actions miễn phí.
- **Việc của anh Nhân**: cập nhật demo lên `main` (`CRON_SECRET`, `PAYMENT_SANDBOX=true`, crontab); PageSpeed Insights trang chủ demo; tạo tài khoản SePay + Bunny Stream (khóa chỉ trong `.env` server); domain + HTTPS + Resend.
- **QA trên máy cloud**: có Postgres 16 (`service postgresql start`; xác thực `trust` cho 127.0.0.1 – không cần mật khẩu, **không tạo/đọc `.env`**, truyền biến qua lệnh); Chromium cài sẵn bản 1194 → Playwright dùng `executablePath`; proxy chặn `challenges.cloudflare.com` → Turnstile giả cục bộ (hosts + HTTPS tự ký + `--no-proxy-server`) – cách làm trong `reviews/T1-17b.md`, `reviews/T1-12c.md`. Unit test **không** đặt `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (đổi snapshot).
- **Chính sách PACE (managed settings)**: cấm đọc `.env`/credential; dữ liệu giả `@example.test`; hành động ra ngoài cần anh xác nhận.

---

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

PC nhà: T1-13. Codex (Local): T1-10b, rồi review thứ hai T1-13. **Antigravity Local + Laptop tạm nghỉ đến hết thứ Bảy 10/10.** File `docs/sources/HANA EQ - HABIT.rar` đã xóa khỏi máy Local 09/10 (ghi chú nội dung còn ở `docs/plan/HANA_PROTOTYPE.md`). Commit cục bộ `8a688a4` trên nhánh `task/T1-17d-runtime-site-url` vẫn chứa file – **không được push** (186 MB > giới hạn 100 MB của GitHub).

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
