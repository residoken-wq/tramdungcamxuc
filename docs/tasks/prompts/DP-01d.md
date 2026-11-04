# DP-01d – Sửa nốt DP-01: lưu kế hoạch, chữ vào CMS, e2e (giao: **PC nhà**)

**Đọc trước:**

- `docs/tasks/reviews/DP-01.md`: Planning QA, **CHƯA ĐẠT**; bảng "Còn lại" B1–B6.
- `docs/tasks/prompts/DP-01.md`: luật chép giao diện, quyết định đã chốt (vẫn áp dụng nguyên).

**Nhánh:** tạo `task/DP-01d-fixes` từ **`origin/claude/cool-ptolemy-cs8kls`**, không từ `main`. Nhánh này đã có DP-01 + DP-01c (Planning sửa build, global EQ, adapter, vé).

**Ước lượng:** 7–8 h, chia 2 phiên như DP-01: phiên 1 ≤ 4 h 30, nghỉ 30 phút, phiên 2. Có migration DB.

---

## Luật nộp bài (bắt buộc – lần trước báo cáo không đúng thực tế)

Lần trước báo cáo ghi "TypeCheck 0 lỗi", "khớp 100 %", "đã chạy unit". Thực tế typecheck lỗi, build hỏng 66 lỗi, 3 unit đỏ, không có ảnh so sánh. Lần này:

1. **Mọi con số trong báo cáo phải kèm đầu ra thật:** dán nguyên dòng cuối của lệnh (`tail -5`) vào báo cáo. Không có đầu ra thì ghi "chưa chạy".
2. **Bắt buộc chạy trước khi báo xong**, mỗi lệnh bọc `timeout`, quá 15 phút không có log thì dừng và ghi rõ:
   - `timeout 300 pnpm typecheck`
   - `timeout 600 pnpm lint`
   - `timeout 1200 pnpm test` (cả bộ, DB trống)
   - `timeout 1200 pnpm build`
3. **Không** viết "khớp 100 %", "hoàn hảo", "sẵn sàng nghiệm thu". Ghi đúng việc đã làm, chỗ còn khác zip, chỗ chưa làm.
4. **Không tắt luật để qua test:** không thêm `eslint-disable` cả file, không thêm `a11y-contrast-ok` mới, không sửa test cũ cho dễ hơn. Chỉ sửa cách tìm phần tử khi giao diện đổi. Bắt buộc phải tắt thì ghi lý do từng chỗ vào báo cáo.
5. **Không bịa nội dung.** Mọi chữ đưa vào CMS **chép nguyên văn** từ file zip (`../DIGITAL PRODUCT/src/components/habit-tracker/**`). Không có trong zip thì để trống và ghi vào báo cáo. (Lần trước script nạp chữ EQ chứa chữ tự đặt, Planning đã xoá.)

---

## 1. B1 – Lưu kế hoạch Habit (lỗi chặn, làm đầu tiên)

**Hiện trạng:**

- Bước 5 ghi cứng 11 kỹ thuật trong `src/components/habit/zip/Steps/Step5LoopDesign.tsx`.
- `draft-adapter.ts` gửi `techniqueId` giả `1, 2, 3…`.
- Server (`src/lib/habit.server.ts`) chỉ nhận kỹ thuật **có thật, đã xuất bản**, **tối đa 2 / giai đoạn**.
- `habitChosenTechniqueSchema` (`src/lib/forms/schemas.ts`) **bắt buộc** `action`.
- Hàm làm sạch nháp `src/lib/habit.ts:103` **bỏ** kỹ thuật không có `action`.

Hệ quả: "Lên chuyến" báo lỗi hoặc lưu nhầm kỹ thuật.

**Làm (quyết định H6 = A):**

1. **Collection `techniques`:** thêm field, có migration:
   - `description` (textarea): câu mô tả ngắn dưới tên;
   - `examples` (array text, tối đa 2);
   - `applyTemplate` (text): mẫu gợi ý ô "Cách tôi áp dụng", hỗ trợ biến `{mentor}`, `{thoi_quen}`, `{gio}`;
   - `order` (number) nếu chưa có.

   Giữ `howTo`, `example`, `exampleVideoUrl` cũ.

2. **`habitJourneyContent.loop`:** thêm phần nội dung 4 luật, có migration. Mỗi luật có:
   - `lawChip` ("1 · MAKE IT OBVIOUS");
   - `title` ("Tín hiệu đủ rõ ràng");
   - `question`;
   - `videoUrl`.

   Thêm khối xanh của Cue: chữ in đậm + đoạn văn + nhãn nút "Xem lại bước 3 →".

3. **Script nạp** `scripts/dp01d-habit-content.ts` (mẫu `scripts/hb26-habit-content.ts`: mặc định chỉ in diff, ghi khi `APPLY=true`, có file backup trong `backups/`, chạy lại không nhân đôi; chạy bằng `pnpm payload run scripts/dp01d-habit-content.ts < /dev/null`):
   - tạo / cập nhật đúng **11 kỹ thuật** theo tên, giai đoạn, thứ tự, mô tả, 2 ví dụ, mẫu gợi ý, link video trong `Step5LoopDesign.tsx` của zip;
   - **đã có kỹ thuật cùng tên thì cập nhật, không tạo mới, không xoá kỹ thuật khác**;
   - nạp 4 luật vào `loop`.
4. **`Step5LoopDesign.tsx` (repo):**
   - bỏ mảng ghi cứng, nhận `techniques` + nội dung luật qua props từ trang server (`/habit/5-phut/page.tsx`);
   - giao diện giữ nguyên;
   - khoá chọn theo **ID thật**;
   - `appliedNotes` theo ID thật.
5. **`draft-adapter.ts`:** gửi `{ techniqueId: <id thật>, stage, action: <ghi chú hoặc chuỗi rỗng> }`. **Không** dùng tên kỹ thuật làm `action`.
6. **Server (`REVIEW-REQUIRED`):**
   - `habitChosenTechniqueSchema`: `action` cho phép rỗng (tối đa 300);
   - `habit.server.ts`: **bỏ giới hạn 2 / giai đoạn**, giữ chặn ID trùng, ID không có / chưa xuất bản, sai giai đoạn;
   - `src/lib/habit.ts` hàm làm sạch nháp: giữ kỹ thuật khi `action` rỗng.

   Sửa các unit test liên quan cho đúng luật mới (giữ test chặn ID giả / trùng / sai giai đoạn). Kiểm Boarding Pass, tracker, ảnh tải về vẫn đọc đúng kỹ thuật.

7. **Unit mới `tests/unit/dp01d-techniques.test.ts`:**
   - 3 kỹ thuật Cue + ghi chú rỗng → lưu được;
   - ID giả → bị chặn;
   - adapter đi – về giữ đúng ID và ghi chú;
   - script nạp chạy 2 lần không nhân đôi.

## 2. B2 – Chữ Habit vào CMS (H2)

**Hiện trạng:** khoảng 800 dòng chữ ghi cứng trong `src/components/habit/zip/**`. Bước 1 đang hiện 8 câu hỏi cũ của CMS, **không phải 8 câu zip**.

**Làm:**

1. **Field mới** trong `habitJourneyContent` cho mọi đoạn chữ nội dung của từng màn (migration). Nhóm theo màn:
   - `header`
   - `step1`
   - `step2`
   - `step3`
   - `step4`
   - `step5`
   - `step6`
   - `tracker`
   - `checkIn`
   - `footer`

   Dùng lại field cũ khi đã có (`stepQuotes`, `diagnose`, `onePercent`, `loop`, `stations`, `tracker`, `boardingPass`). Không tạo trùng.

2. **Nhãn UI cố định** (nút "Quay lại", "Lưu", "Xem", "Thu gọn", "Đóng", nhãn trạng thái…) vào `src/lib/i18n/vi.ts` khối `dp01`, đặt sau khối mới nhất.
3. **Component nhận chữ qua props**, có giá trị mặc định = chữ zip **chỉ ở một nơi** (hàm `withDp01Defaults()` trong `src/lib/habit/dp01-content.ts`), không rải trong từng component.
4. **Mở rộng script nạp** `scripts/dp01d-habit-content.ts`:
   - nạp đúng chữ zip, gồm **8 câu hỏi bước 1 nguyên văn** từ `constants.ts` của zip (thay 8 câu cũ: ghi rõ trong báo cáo là thay thế);
   - **không ghi đè** ô Hana đã sửa khác giá trị mặc định cũ (mẫu `hb26-content-patch.ts`).
5. **`HUONG_DAN_CMS.md`:** thêm mục các ô mới + cách chạy script.
6. **Unit:** mỗi màn render được với CMS rỗng (dùng mặc định) và với CMS có chữ khác (hiện chữ CMS).

## 3. B3 – E2E

1. **Sửa cách tìm phần tử** (giữ nguyên các assert hành vi) trong:
   - `habit-boarding-pass`, `habit-journey-v2`, `habit-loop`, `habit-one-percent`, `gate-habit-journey`;
   - `eq-draw`, `eq-qr` (từ khoá hiện 2 lần: mặt trước + mặt sau → dùng `.first()` hoặc tìm trong mặt đang hiện).
2. **Viết mới:**
   - `tests/e2e/dp01a-habit-zip.test.ts`: DB trống, đi bằng giao diện, 8 câu → 1 % → Mentor → gọi tên → **3 kỹ thuật Cue, 1 cái không ghi chú** → Boarding Pass → lên chuyến (OTP test hook) → tracker → check-in 😊 → xoá ngày → suy ngẫm trạm 1 → tải CSV → tải lại trang còn dữ liệu.
   - `tests/e2e/dp01b-eq-zip.test.ts`: kịch bản ở DP-01 mục 7, gồm công tắc "Miễn phí hoàn toàn".
3. **Chạy e2e trên máy PC nếu build chạy được:** `timeout 2400 pnpm exec playwright test habit eq tracker certificate gate dp01 --project=desktop-1440 --retries=0`. Dán bảng kết quả. Test đỏ vì Turnstile bị chặn ở máy local thì ghi rõ.

## 4. B4–B6 – Lặt vặt

1. **B4:** bước 6 thêm 2 nút "Tải ảnh Cover điện thoại" (9:16) và "Tải ảnh đăng bài" (4:5) như bản trước (logic sẵn có trong `src/components/habit/BoardingPassPreview.tsx` + route `boarding-pass/anh/[format]`), đặt cạnh nút "Sao chép caption" theo phong cách zip. Route ảnh vẽ theo tấm vé zip: **làm nếu còn giờ**, không thì ghi "chưa làm".
2. **B5:**
   - bỏ nhãn "Bước x / 6" ở `HabitTrackerHeader` (zip không có);
   - thẻ EQ "2 Mặt tương tác 3D" giữ xuống dòng + chữ đậm "Mặt trước:" / "Mặt sau:" như zip.
3. **B6:** bỏ `eslint-disable react-hooks/set-state-in-effect` cả file ở `HabitTrackerApp.tsx`. Chỉ tắt đúng dòng `setState` sau khi đọc `localStorage` lúc mount, kèm lý do.

## 5. Ảnh so sánh (bắt buộc)

- Viết `scripts/dp01-capture.mjs` như DP-01 mục 0.4: zip `http://localhost:3100` ↔ repo `http://localhost:3000`, cùng dữ liệu `[MẪU]`.
- Chụp **mọi** màn Habit 1–7, hộp check-in, EQ giới thiệu 1 / 2, rút thẻ, mặt trước, mặt sau, "Tất cả thẻ", hướng dẫn, trang QR, ở 390 và 1440.
- Ghép trái / phải vào `../dp01-compare/`.
- Ảnh Habit commit vào `docs/screenshots/dp01/`. Ảnh EQ chỉ commit khi dùng thẻ `[MẪU]`.
- Bảng `docs/tasks/reviews/DP-01d-visual.md`: màn | còn khác gì | lý do.

## 6. Nộp

- File tiến độ `docs/tasks/progress/DP-01d.md`, cập nhật + commit + push cuối mỗi mục.
- Commit nhỏ, Prettier chỉ file mình sửa.
- **KHÔNG** merge, **KHÔNG** chạy lệnh / script lên demo hay server thật, **KHÔNG** commit nội dung 26 thẻ EQ.
- **Báo cáo theo mục 13 AGENTS.md, kèm:**
  - đầu ra thật của 4 lệnh ở "Luật nộp bài";
  - bảng B1–B6: đã làm / chưa làm / lý do;
  - danh sách migration + lệnh cho anh Nhân: `pnpm migrate`, dry-run `pnpm payload run scripts/dp01d-habit-content.ts < /dev/null` rồi `APPLY=true pnpm payload run scripts/dp01d-habit-content.ts < /dev/null`, thêm mục vào `docs/RUNBOOK.md`, chạy demo trước;
  - các chỗ còn khác zip;
  - dòng `THỜI GIAN THỰC …`.
