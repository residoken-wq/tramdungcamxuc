# Quy trình test cho máy làm task (áp dụng từ 07/11, thay mục "Cách test" trong mọi prompt)

Mục tiêu: mỗi task chỉ mất **dưới 1 phút test ở máy** và **khoảng 8 phút CI**. Không tốn token chờ.

## Trước khi push (máy làm task)

```bash
git fetch origin main
pnpm check:fast                              # typecheck + ESLint file đã đổi + unit test của task
pnpm check:fast tests/unit/puck-blocks.test.tsx   # thêm file test liên quan nếu muốn
```

- `check:fast` chỉ in tóm tắt từng bước. Đỏ thì in phần lỗi (tối đa 150 dòng).
- **Không** chạy cả bộ `pnpm test`, **không** `pnpm build`, **không** chạy e2e ở máy. CI làm những việc này trên PR.
  - Ngoại lệ: một e2e đỏ trên CI mà đọc log không ra nguyên nhân thì chạy lại **đúng file đó, 1 lần**.
- Muốn chạy đúng phần unit giống CI (VD sửa `src/puck/config.tsx` hay component dùng ở nhiều nơi): `pnpm check:fast --affected`. Lệnh này chậm hơn, chỉ chạy 1 lần lúc cuối.
- Snapshot: `pnpm exec vitest run -u <file>` **chỉ file liên quan**, sau khi bỏ `NEXT_PUBLIC_TURNSTILE_SITE_KEY` khỏi môi trường. Đọc lại diff snapshot.
- Prettier chỉ file mình sửa, không chạy trên `docs/`.

## DB test riêng (bắt buộc từ 08/11)

- Unit test tự chạy migration lên DB trong `DATABASE_URI`. **Không** dùng DB đã từng chạy `pnpm dev`: Payload sẽ dừng lại hỏi "dev mode … proceed?" và chờ mãi (PC nhà treo 60 phút ở PK-30).
- Tạo 1 DB trống chỉ để test (1 lần):
  `createdb tdcx_test` (hoặc `CREATE DATABASE tdcx_test;` trong psql / pgAdmin).
- Chạy test trỏ vào DB đó:
  - PowerShell: `$env:DATABASE_URI="postgres://<user>@localhost:5432/tdcx_test"; pnpm check:fast <file>`
  - bash: `DATABASE_URI=postgres://<user>@localhost:5432/tdcx_test pnpm check:fast <file>`
  - Dùng đúng user / mật khẩu Postgres trên máy mình. **Không** dán mật khẩu vào báo cáo hay commit.
- DB đã dính dev mode: `global-setup` báo lỗi rõ ngay. `check:fast` cũng tự dừng mỗi bước sau 10 phút (đổi bằng `CHECK_FAST_STEP_TIMEOUT_MS`).

## Cách chạy lệnh (tiết kiệm token)

- Chạy lệnh **ở foreground, chờ xong**, đừng chạy nền rồi hỏi lại liên tục ("standing by…"). Mỗi lần hỏi lại là một lượt tốn token.
- Cắt output: `… | tail -40`. Không in cả log build / log test.
- Viết xong **toàn bộ** task rồi mới test 1 lượt. Đỏ thì sửa và chạy lại **chỉ phần đỏ**.

## E2E của task

- Vẫn viết e2e như prompt yêu cầu (`desktop-1440`, tự lặp 1440 / 375 bên trong, ảnh chỉ chụp khi bật biến `PKxx_SCREENSHOTS=1`).
- Dữ liệu tạo trong e2e phải đúng schema thật (`_status`, field bắt buộc) và dọn sau khi chạy.
- E2E chạy lần đầu trên CI. Planning theo dõi CI khi QA, máy **không** cần chờ CI.

## Nộp

- Push nhánh, báo cáo theo mục 13 AGENTS.md. Báo cáo dán kết quả `pnpm check:fast` (vài dòng tóm tắt).
- Planning mở PR, xem CI, QA.

## CI (để biết)

- PR chỉ sửa tài liệu: bỏ qua test.
- Unit: chỉ chạy test bị ảnh hưởng bởi file đã đổi. Chạy hết khi sửa `package.json`, migration, cấu hình test.
- E2E: 4 shard desktop + 1 job mobile chạy song song, khoảng 8 phút. Trước đây 3 shard bị lệch: shard 1 làm gần hết việc, mất khoảng 13 phút.

## Khối dán vào tin nhắn giao task (mẫu)

Thay `XX-NN`, tên nhánh, file test và biến ảnh cho đúng task.

```
Làm task XX-NN. Prompt đầy đủ: docs/tasks/prompts/XX-NN.md trên origin/main mới nhất (đọc cả khối "Cập nhật …" đầu file). Đọc AGENTS.md và skill tdcx-brand trước khi code.

Chuẩn bị:
- git fetch origin && git checkout -b task/XX-NN-ten-ngan origin/main
- node scripts/task-time.mjs start XX-NN

Test theo docs/tasks/QUY_TRINH_TEST.md:
- Ở máy CHỈ chạy: pnpm check:fast (thêm tên file test liên quan nếu cần; sửa style-css / config / vi.ts / component dùng nhiều nơi thì chạy thêm 1 lần cuối: pnpm check:fast --affected).
- KHÔNG cả bộ pnpm test, KHÔNG pnpm build, KHÔNG e2e ở máy. CI chạy trên PR, Planning theo dõi.
- E2E của task: chỉ desktop-1440 (skip project mobile), tự lặp 1440/375 bên trong, dữ liệu [MẪU] / [TEST] đúng schema, dọn trong finally, ảnh fixture tự tạo (không ảnh người thật).
- Ảnh docs/screenshots/xxnn/ chỉ chụp khi XXNN_SCREENSHOTS=1.
- vitest -u: bỏ NEXT_PUBLIC_TURNSTILE_SITE_KEY trước, chỉ file liên quan.
- Chạy lệnh foreground, chờ xong, cắt output (| tail -40). Không chạy nền rồi "standing by".
- Prettier chỉ file mình sửa, KHÔNG chạy trên docs/. Sửa HUONG_DAN_CMS.md bằng tay.

Nộp: commit nhỏ, push sau mỗi mục. KHÔNG merge, KHÔNG chạy lệnh lên server thật.
Báo cáo theo mục 13 AGENTS.md: link nhánh, chỗ REVIEW-REQUIRED, vài dòng tóm tắt pnpm check:fast, file e2e đã thêm / sửa, dòng THỜI GIAN THỰC (node scripts/task-time.mjs report).
```
