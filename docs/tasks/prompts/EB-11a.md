# EB-11a – Chuẩn bị buổi thử builder: dữ liệu MẪU + chạy thử 8 việc bằng e2e (giao: Claude Code, **Laptop**)

**Kế hoạch buổi thử:** `docs/plan/EB-11.md`. Đọc kỹ **mục 3 (8 việc)**: e2e của task này phải làm đúng 8 việc đó, **bằng giao diện** như Hana làm.

**Ước lượng:** 4 h. **Không migration, không package, không đổi logic sản phẩm.** Chỉ sửa code khi gặp lỗi chặn (P1) dạng chữ / nhãn nhỏ (mục 2.3).

**Bối cảnh:**

- Buổi CM-07 phát hiện lỗi chặn ngay ở việc 1 (nút Xuất bản lưu thành bản nháp) vì chưa ai làm thử đúng như người dùng.
- Task này làm thử trước: Laptop đóng vai Hana, đi đúng 8 việc qua giao diện builder. Mỗi chỗ phải "biết trước mới làm được" là một lỗi cần ghi lại.

**Đo thời gian (bắt buộc):**

- `node scripts/task-time.mjs start EB-11a`;
- nối `; node scripts/task-time.mjs lap` vào cuối mọi lệnh;
- cuối task chạy `node scripts/task-time.mjs report`, dán nguyên dòng `THỜI GIAN THỰC …` vào báo cáo.

## 0. Chuẩn bị

```bash
GIT_TERMINAL_PROMPT=0 timeout 120 git fetch origin < /dev/null; echo "fetch exit: $?"
git status --short             # có thay đổi chưa commit → DỪNG, báo lại
git log --oneline -1 origin/main -- src/puck/blocks/site/LegalFooter.tsx   # rỗng → EB-10 (PR #279) chưa merge → DỪNG
git switch -c task/EB-11a-session-prep origin/main
node scripts/task-time.mjs start EB-11a
timeout 600 pnpm install < /dev/null 2>&1 | tail -1 ; node scripts/task-time.mjs lap
timeout 600 pnpm migrate < /dev/null 2>&1 | tail -1 ; node scripts/task-time.mjs lap
git commit --allow-empty -m "chore: start EB-11a" && git push -u origin task/EB-11a-session-prep
```

Chạy trên **DB riêng** (ví dụ `tdcx_eb11`). `gh` chưa đăng nhập thì bỏ qua, Planning mở PR.

**Lỗi đã mắc – không lặp lại:**

1. **Chạy đủ unit + e2e trước khi nộp và dán kết quả.** EB-05, EB-07, EB-08, EB-10 đều nộp khi unit còn đỏ. Vitest in xong dòng "Test Files / Tests" là xong: đọc file log, không chờ tiến trình.
2. **Mọi lệnh test / build bọc `timeout`.** Quá 5 phút không có log thì dừng, báo lại. Không chạy script dò thử dài.
3. **E2E phải chứng minh hành vi thật**, không chỉ class / thuộc tính (EB-05). Ở đây phải kiểm:
   - trang công khai đổi đúng;
   - 375 px khác 1440 px theo **vị trí / hiển thị thật**.

## 1. Làm (mỗi mục 1 commit)

1. **Lệnh chuẩn bị buổi thử** `seed/eb11-session.ts` (`pnpm seed:eb11`) + lệnh dọn `seed/eb11-session-clean.ts` (`pnpm seed:eb11:clean`). Dùng lại guard của `seed/demo-guard.ts`: từ chối khi `SITE_URL` là tên miền thật, giống `seed:demo-gd2`.
   - Tạo trang `[MẪU] Trang thử builder` (kind `page`, đã xuất bản, có 1–2 khối) – đích của việc 7.
   - Tải **2 ảnh MẪU** vào `media`, có `alt` bắt đầu bằng `[MẪU]`. Ảnh là SVG / PNG tự vẽ trong repo, không lấy ảnh người thật – cần cho việc 2.
   - **Ghi lại** `designSystem` hiện tại ra `backups/eb11-design-system-<thời gian>.json` (`.gitignore` đã có `backups/`). Không tự đổi khoá; anh Nhân mở khoá bằng tay theo `docs/plan/EB-11.md` mục 1.4.
   - Lệnh dọn:
     - xoá mọi trang / mẫu khối (`blockTemplates`) / ảnh có `[MẪU]` **do buổi thử tạo** (tên bắt đầu `[MẪU]` và tạo sau mốc chạy lệnh chuẩn bị);
     - trả `designSystem` từ file backup mới nhất;
     - in danh sách đã xoá. Không xoá gì không có `[MẪU]`.
   - Chạy lại nhiều lần không nhân đôi.
   - Unit test cho phần chọn bản ghi cần xoá: không bao giờ chọn bản ghi thiếu `[MẪU]`.
2. **E2E chạy thử** `tests/e2e/eb11-rehearsal.test.ts`, tự đủ trên DB trống: tạo owner đầu tiên, gọi phần lõi của lệnh chuẩn bị, cuối test dọn sạch.
   - **Mỗi việc 1 `test.step`** đúng đề bài mục 3, đi **bằng giao diện**: thư viện khối, kéo thả, tab Kiểu / Nâng cao, menu chuột phải, nút trên thanh dưới.
   - **Không** dùng REST / `page.request` để làm thay bước của Hana. REST chỉ dùng để chuẩn bị và kiểm kết quả.
   - Mỗi bước ghi 3 thứ vào `test.info().annotations`:
     - số thao tác (click + gõ);
     - tên selector khó tìm (phải dùng `data-testid` / vị trí vì không có nhãn chữ);
     - thời gian.
   - **Kiểm kết quả thật trên trang công khai:**
     - việc 1: tiêu đề mới;
     - việc 2: 2 cột cạnh nhau ở 1440, chồng ở 375 – so `boundingBox`;
     - việc 3: màu nền / bo góc / padding 375 ≠ 1440;
     - việc 4: bấm tab đổi nội dung;
     - việc 5: khối ẩn ở 375, hiện ở 1440; tên trong cây Cấu trúc;
     - việc 6: màu nút đổi;
     - việc 7: mẫu chèn được vào trang khác;
     - việc 8: thoát xem bản cũ không mất bản mới.
   - Chạy ở `desktop-1440`. Kiểm 375 bằng `page.setViewportSize` trên trang công khai, hoặc bằng nút xem trước điện thoại trong editor như Hana.
3. **Báo cáo chạy thử** `docs/tasks/reviews/EB-11a-rehearsal.md` (file mới, ngoại lệ được phép tạo trong `reviews/`). Bảng 8 việc, mỗi việc gồm:
   - đạt / không;
   - số thao tác;
   - chỗ khựng (màn hình + nút, chữ đang hiện);
   - mức P1 / P2 / P3 theo `docs/plan/CM-07.md` mục 4.2;
   - ảnh chụp 1440 chỗ khựng vào `docs/screenshots/eb11/` (dữ liệu `[MẪU]`).
4. **Sửa P1 nhỏ** (chỉ khi là chữ / nhãn / thứ tự nút, ≤ 30 phút mỗi lỗi):
   - sửa trong `vi.ts` hoặc component editor, kèm test;
   - P1 cần đổi logic / dữ liệu thì **không sửa**: ghi rõ trong báo cáo cho Planning quyết định;
   - P2 / P3 chỉ ghi.

**Ranh giới file:**

- `seed/eb11-session*.ts`, `seed/demo-guard.ts` (chỉ dùng lại), `package.json` (2 script), `.gitignore`;
- `tests/e2e/eb11-rehearsal.test.ts`, unit test mới;
- `docs/tasks/reviews/EB-11a-rehearsal.md`, `docs/screenshots/eb11/`;
- sửa P1 nhỏ: `src/lib/i18n/vi.ts` (khối mới `eb11` ngay sau `eb10`), `src/puck/editor/**`.

**Không** sửa: collection / global / migration, logic khối, `docs/plan/**`, `docs/tasks/README.md`, `docs/tasks/prompts/**`.

## 2. Kiểm và nộp

1. Push gộp 2–3 lần, Prettier chỉ file mình sửa. `timeout 900 pnpm lint && pnpm typecheck && timeout 900 pnpm test` xanh **trên DB trống**, dán dòng tổng kết.
2. Sau `timeout 900 pnpm build`:
   - chạy `timeout 1800 pnpm exec playwright test eb11 puck --project=desktop-1440 --retries=0`;
   - dán bảng kết quả;
   - `puck-conversion` đỏ vì Turnstile ở máy local thì ghi rõ.
3. Chạy tay `pnpm seed:eb11` rồi `pnpm seed:eb11:clean` trên DB có `pnpm seed`. Dán kết quả 2 lần chạy: lần 2 không tạo thêm, sau khi dọn không còn bản ghi `[MẪU]` của buổi thử.
4. `git status` sạch, push, `node scripts/task-time.mjs report`.

**KHÔNG** chạy lệnh nào lên demo / server thật. **KHÔNG** merge.

Báo cáo theo mẫu mục 13 AGENTS.md, kèm:

- link nhánh, dòng `THỜI GIAN THỰC …`;
- bảng kết quả test;
- **bảng 8 việc** (tóm tắt `EB-11a-rehearsal.md`), lỗi P1 đã sửa / chưa sửa;
- lệnh cho anh Nhân chạy trên demo trước và sau buổi thử.
