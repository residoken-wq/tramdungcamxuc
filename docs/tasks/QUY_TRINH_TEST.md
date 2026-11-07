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
