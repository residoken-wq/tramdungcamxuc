# DP-02d – Chữ còn ghi cứng ở Habit bước 1–5 / EQ giới thiệu, câu trích dẫn từ CMS (giao: **PC nhà**)

**Nhánh:** tạo `task/DP-02d-copy` từ `origin/main` mới nhất. Phải có PR #290 (DP-02 + DP-02c) đã merge.

**Đọc trước:**

- `docs/tasks/reviews/DP-01.md`, mục "DP-02" (bảng DP-02c: F1–F8);
- `AGENTS.md` §2.3;
- prompt `docs/tasks/prompts/DP-02.md` mục 1.

**Thời lượng:** 4–5 giờ, 1 phiên.

## Luật nộp bài – lần này Planning kiểm từng dòng

DP-01d, DP-02 đều nộp báo cáo không đúng thực tế (ảnh trang đăng nhập / 404 ghi "khớp", không chạy e2e, unit "cho qua cả file"). Lần này:

1. **Dán nguyên đầu ra** (`tail -5`) của:
   - `timeout 300 pnpm typecheck`
   - `timeout 600 pnpm lint`
   - `timeout 1500 pnpm test` (cả bộ, **DB trống**)
   - `timeout 1500 pnpm build`
   - lệnh e2e ở mục 4

   Thiếu đầu ra của lệnh nào thì ghi "chưa chạy". **Không** ghi "sạch" / "pass" mà không có đầu ra.

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

## 4. E2E (bắt buộc chạy, DB trống, cả 2 khung)

```
CI=1 timeout 3000 pnpm exec playwright test certificate dp01a-habit-zip dp01b-eq-zip eq-draw eq-qr eq-saved gate-eq-journey gate-habit-journey habit-boarding-pass habit-journey-v2 habit-loop habit-one-percent tracker --project=desktop-1440 --project=mobile-375 --workers=1 --retries=0
```

Kết quả trước DP-02d: **28 / 28 xanh**. Phải giữ 28 / 28.

- Đỏ vì đổi giao diện thì sửa `tests/e2e/helpers/habit-zip.ts` hoặc test, **không** bọc "nếu thấy thì…".
- Đỏ vì chữ đổi → xem lại luật 2 (có thể bạn đã đổi chữ).

Thêm vào `dp01a-habit-zip`: Admin đặt `stepQuotes.mentor` qua API → bước 3 hiện đúng câu đó.

## 5. Không làm

- Không đổi bố cục, màu, luồng lưu kế hoạch, OTP, dùng thử, chứng nhận.
- Không xoá component Habit cũ.
- Không đổi chữ (luật 2). Không thêm ảnh so sánh: task này không đổi giao diện.

## 6. Nộp

- Commit nhỏ, message tiếng Anh. Push `task/DP-02d-copy`.
- Báo cáo theo `AGENTS.md` §13, kèm:
  - đầu ra thật của 5 lệnh;
  - bảng xếp loại đủ dòng (mục 1);
  - kết quả script `stepQuotes` + câu hỏi cho Hana (mục 2);
  - số dòng còn trong danh sách cho phép, kèm lý do từng quy tắc.
