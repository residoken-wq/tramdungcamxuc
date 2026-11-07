# DP-02d – Chữ còn ghi cứng ở Habit bước 1–5 / EQ giới thiệu, câu trích dẫn từ CMS (giao: **PC nhà**)

**Nhánh:** tạo `task/DP-02d-copy` từ `origin/main` mới nhất. Phải có PR #290 (DP-02 + DP-02c) đã merge.

**Đọc trước:**

- `docs/tasks/reviews/DP-01.md`, mục "DP-02" (bảng DP-02c: F1–F8);
- `AGENTS.md` §2.3;
- prompt `docs/tasks/prompts/DP-02.md` mục 1.

**Thời lượng:** 4–5 giờ, 1 phiên.

> **Cập nhật 07/11 (Planning):**
>
> - `main` đã có **DP-03**: cổng đăng nhập sau Giai đoạn 1 Habit (bước 1–2 miễn phí, từ bước 3 cần đăng nhập). Đọc `tests/e2e/helpers/habit-zip.ts` bản mới trước khi sửa e2e.
> - **Test theo `docs/tasks/QUY_TRINH_TEST.md`**, thay luật 1 và mục 4 cũ:
>   - ở máy **chỉ** chạy `pnpm check:fast` (+ file test liên quan), cuối cùng 1 lần `pnpm check:fast --affected` (task này sửa `vi.ts` và component dùng nhiều nơi);
>   - **không** chạy cả bộ `pnpm test`, **không** `pnpm build`, **không** e2e ở máy: CI chạy trên PR, Planning theo dõi;
>   - e2e mới / sửa chỉ `desktop-1440` (skip project mobile), tự lặp 1440 / 375 bên trong; dữ liệu `[MẪU]` / `[TEST]` đúng schema, dọn trong `finally`;
>   - chạy lệnh foreground, chờ xong, cắt output `| tail -40`; không chạy nền rồi "standing by";
>   - snapshot: bỏ `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `pnpm exec vitest run -u <file>` **chỉ file liên quan**, đọc lại diff;
>   - Prettier chỉ file mình sửa, **không** chạy trên `docs/` (sửa `HUONG_DAN_CMS.md` bằng tay).
> - Đo thời gian: `node scripts/task-time.mjs start DP-02d` trước lệnh đầu tiên, `node scripts/task-time.mjs report` lúc nộp.

## Luật nộp bài – lần này Planning kiểm từng dòng

DP-01d, DP-02 đều nộp báo cáo không đúng thực tế (ảnh trang đăng nhập / 404 ghi "khớp", không chạy e2e, unit "cho qua cả file"). Lần này:

1. **Dán nguyên đầu ra tóm tắt** của `pnpm check:fast` và `pnpm check:fast --affected` (vài dòng cuối). Chưa chạy thì ghi "chưa chạy". **Không** ghi "sạch" / "pass" mà không có đầu ra. E2E không chạy ở máy: ghi rõ file e2e đã thêm / sửa để Planning xem trên CI.

2. **Chép nguyên văn.** Khi chuyển chữ từ component sang `vi.ts` hoặc CMS, giá trị mới **phải giống từng ký tự** chữ cũ, kể cả dấu câu, `→`, emoji, chữ in đậm.
   - DP-02 đã đổi "Bắt đầu hành trình" → "Rút thẻ chiêm nghiệm ngay", "Email nhận kế hoạch" → "Email của bạn"…; Planning phải trả lại (F3).
   - Muốn đổi chữ thì ghi câu hỏi cho Hana, **không tự đổi**.
3. **Không sửa** những chỗ Planning đã sửa ở DP-02c:
   - `/habit/tracker` không truyền hàm sang component client (F1);
   - tính ngày nghỉ theo nhịp (F2);
   - `src/components/habit/zip/Result/Dashboard28Days.tsx` phần `selectedDaysList` / `dayOfWeek`.

   Unit `dp02-server-page-props` và `dp02-dashboard-rhythm` phải còn xanh.

4. **Không** thêm quy tắc "cho qua cả file" (`matchFile: true`) vào `tests/unit/dp02-no-inline-copy.test.ts`. Mục 1 dưới đây bỏ hết các quy tắc đó.

---

## 1. Xếp loại chữ còn ghi cứng (phần dở của DP-02 mục 1)

`tests/unit/dp02-no-inline-copy.test.ts` hiện **cho qua nguyên file** các file dưới. Đếm số dòng có chữ tiếng Việt, không tính comment:

| File                                                       | Dòng |
| ---------------------------------------------------------- | ---- |
| `src/components/habit/zip/Steps/Step1Diagnose.tsx`         | 38   |
| `src/components/habit/zip/Steps/Step2PercentPrinciple.tsx` | 45   |
| `src/components/habit/zip/Steps/Step3FindMentor.tsx`       | 17   |
| `src/components/habit/zip/Steps/Step4IdentityHabit.tsx`    | 24   |
| `src/components/habit/zip/Steps/Step5LoopDesign.tsx`       | 40   |
| `src/components/eq/zip/EQBuddyIntro.tsx`                   | 36   |
| `src/components/eq/zip/GuideModal.tsx`                     | 17   |

**Làm:**

1. **Bỏ** mọi quy tắc `matchFile: true`. Quy tắc theo dòng chỉ dùng cho loại 3 (dữ liệu minh hoạ) và phải ghi lý do.
2. Với từng dòng, xếp 1 trong 3 loại như DP-02. **Báo cáo phải có bảng đủ ~217 dòng:** file, dòng, chữ, loại, nơi chuyển tới.
   - **Loại 1 – nội dung Hana có thể muốn sửa** → field CMS (`habitJourneyContent` / `eqBuddyContent`):
     - migration;
     - mặc định = chữ zip **nguyên văn** trong `src/lib/habit/dp01-content.ts` (Habit) hoặc chỗ mặc định EQ hiện có;
     - script nạp **chỉ điền ô trống**.

     Ví dụ:
     - tiêu đề bước ("Tìm Mentor cho thói quen mới", "Gọi tên thói quen", "Thiết kế vòng lặp");
     - lời giải thích dưới tiêu đề;
     - nội dung 4 thẻ / 4 bước ở màn giới thiệu EQ và hộp hướng dẫn;
     - 3 thẻ "Ba điều" ở bước 2.

   - **Loại 2 – nhãn UI cố định** → `vi.ts` khối `dp01` / `dp01eq`.
     - Ví dụ: `[+] Có ích`, `title="Xoá dòng"`, "Chọn 1 việc từ các việc có ích [+] của bạn:", nhãn nút.
     - Dùng lại khoá đã có nếu **cùng chữ**. Khác chữ dù 1 ký tự thì tạo khoá mới.
   - **Loại 3 – dữ liệu minh hoạ** (nhãn trục SVG bước 2, chữ trong hình vòng lặp bước 5) → giữ trong code, quy tắc theo dòng có lý do.
3. Placeholder 3 dòng mặc định bước 3 ("Thức dậy, uống một ly nước", "Đánh răng, rửa mặt", "Ăn sáng", "Nhập việc bạn làm...") là **loại 2**.
   - E2E dùng đúng chữ này (`tests/e2e/helpers/habit-zip.ts`), nên giữ nguyên chữ.

## 2. Câu trích dẫn đầu mỗi bước lấy từ CMS `stepQuotes`

**Hiện trạng:**

- Global `habitJourneyContent` có nhóm `stepQuotes` (từ HB-18/HB-24): `onePercent`, `mentor`, `name`, `loop`, `boardingPass`, `tracker`, mỗi mục có câu / tác giả / nguồn.
- `getHabitJourneyContent()` đã đọc và làm sạch (`CleanHabitStepQuotes`).
- Nhưng bản zip **ghi cứng** câu trích dẫn ở bước 2–6. Chỉ tracker dùng `stepQuotes.tracker`. Hana sửa trong CMS không thấy gì.

**Làm:**

1. Truyền `stepQuotes` từ `/habit/5-phut` → `HabitTrackerApp` → từng bước.
   - Mỗi `StepQuoteHeader` dùng câu / tác giả từ CMS nếu có, không thì dùng chữ zip hiện tại (giữ nguyên ký tự, kể cả dấu “ ” và — —).

   | Bước | Mục `stepQuotes` |
   | ---- | ---------------- |
   | 2    | `onePercent`     |
   | 3    | `mentor`         |
   | 4    | `name`           |
   | 5    | `loop`           |
   | 6    | `boardingPass`   |

2. Cách hiển thị tác giả / nguồn giống tracker hiện tại (`quoteAuthor`).
3. **Không** chạy script ghi câu zip đè lên câu CMS đang có.
   - Viết script **chỉ đọc** `scripts/dp02d-step-quotes-report.ts`: in câu CMS đang có của từng bước cạnh câu zip.
   - Chạy trên DB local; dán kết quả vào báo cáo kèm câu hỏi cho Hana: giữ câu CMS hay đổi sang câu zip. Planning chạy trên production.
4. Unit: render một bước có `stepQuotes.mentor` → hiện câu CMS; không có → hiện câu zip.

## 3. Hướng dẫn CMS

`docs/HUONG_DAN_CMS.md`: thêm chỗ Hana sửa tiêu đề bước, nội dung giới thiệu EQ, câu trích dẫn từng bước (đường dẫn trong admin, ảnh chụp nếu có).

## 4. E2E (viết ở máy, chạy trên CI)

**Không** chạy e2e ở máy (QUY_TRINH_TEST). CI chạy 13 file Habit / EQ trên PR (`certificate`, `dp01a-habit-zip`, `dp01b-eq-zip`, `eq-draw`, `eq-qr`, `eq-saved`, `gate-eq-journey`, `gate-habit-journey`, `habit-boarding-pass`, `habit-journey-v2`, `habit-loop`, `habit-one-percent`, `tracker`). Trước DP-02d: **xanh hết**, phải giữ.

- Chữ đổi làm e2e dò chữ phải sửa → xem lại luật 2 trước (rất có thể bạn đã đổi chữ).
- Đổi giao diện thì sửa `tests/e2e/helpers/habit-zip.ts`, **không** bọc "nếu thấy thì…".
- Ngoại lệ: một e2e đỏ trên CI mà đọc log không ra nguyên nhân thì chạy lại **đúng file đó, 1 lần**.

Thêm vào `dp01a-habit-zip`: Admin đặt `stepQuotes.mentor` qua API → bước 3 hiện đúng câu đó.

## 5. Không làm

- Không đổi bố cục, màu, luồng lưu kế hoạch, OTP, dùng thử, chứng nhận.
- Không xoá component Habit cũ.
- Không đổi chữ (luật 2). Không thêm ảnh so sánh: task này không đổi giao diện.

## 6. Nộp

- Commit nhỏ, message tiếng Anh, **push sau mỗi mục**. Push `task/DP-02d-copy`. **Không** merge, **không** chạy lệnh lên server thật.
- Báo cáo theo `AGENTS.md` §13, kèm:
  - link nhánh, chỗ `REVIEW-REQUIRED` (nếu có);
  - vài dòng tóm tắt `pnpm check:fast` / `--affected`, file e2e đã thêm / sửa;
  - dòng **THỜI GIAN THỰC** từ `node scripts/task-time.mjs report`;
  - bảng xếp loại đủ dòng (mục 1);
  - kết quả script `stepQuotes` + câu hỏi cho Hana (mục 2);
  - số dòng còn trong danh sách cho phép, kèm lý do từng quy tắc.
