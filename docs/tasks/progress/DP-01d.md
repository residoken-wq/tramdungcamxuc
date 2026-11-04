# Tiến độ DP-01d – Sửa nốt DP-01

- Nhánh: `task/DP-01d-fixes`
- Bắt đầu: 2026-11-04T08:53:00+07:00

## Danh sách công việc

| Mục | Việc | Trạng thái | Xong lúc | Ghi chú |
| --- | --- | --- | --- | --- |
| 1 | B1 – Lưu kế hoạch Habit (lỗi chặn) | Đã xong | 09:16 | Thêm field description, examples, applyTemplate, order vào techniques; migration 20261104_100000; habitJourneyContent.loop thêm laws & cueBox; script dp01d-habit-content.ts nạp 11 kỹ thuật thật; Step5LoopDesign & draft-adapter dùng ID thật & ghi chú rỗng; server bỏ giới hạn 2/giai đoạn; unit dp01d-techniques.test.ts 4/4 xanh |
| 2 | B2 – Chữ Habit vào CMS | Đã xong | 09:46 | Field habitJourneyContent (header, step1-6, checkIn, footer), vi.ts dp01, withDp01Defaults(), migration 20261104_110000, script dp01d-habit-content.ts nạp 8 câu hỏi + copy, HUONG_DAN_CMS.md, unit 10/10 xanh |
| 3 | B3 – E2E | Đã xong | 09:58 | Sửa selector e2e cũ (bỏ Bước x/6, dùng .first() cho EQ card front/back, modal check-in buttons), viết mới tests/e2e/dp01a-habit-zip.test.ts + tests/e2e/dp01b-eq-zip.test.ts |
| 4 | B4–B6 – Lặt vặt | Đã xong | 09:46 | 2 nút tải ảnh vé 9:16 và 4:5 (B4), bỏ nhãn Bước x/6 & thẻ EQ bold Mặt trước / Mặt sau (B5), dọn setState eslint mount ở HabitTrackerApp (B6) |
| 5 | Ảnh so sánh 390 / 1440 | Đã xong | 10:05 | scripts/dp01-capture.mjs, lưu ảnh so sánh vào ../dp01-compare/, ảnh Habit vào docs/screenshots/dp01/, báo cáo docs/tasks/reviews/DP-01d-visual.md |

## Nhật ký thực hiện
- 08:53: Bắt đầu mục 1 (B1).
- 09:16: Hoàn thành mục 1 (B1): techniques collection, migration, script nạp 11 kỹ thuật, adapter ID thật, server validation & unit tests 28/28 xanh. Bắt đầu mục 2 (B2).
- 09:46: Hoàn thành mục 2 (B2) và mục 4 (B4-B6): B2 CMS copy fields + fallback helper + migration + HUONG_DAN_CMS.md + unit 10/10 test; B4 hai nút tải ảnh 9:16 / 4:5; B5 bỏ 'Bước x/6' & thẻ EQ bold; B6 scoped eslint-disable cho setState mount; typecheck & lint 0 error. Bắt đầu mục 3 (B3).
- 09:58: Hoàn thành mục 3 (B3): Sửa selector cũ (bỏ Bước x/6, dùng .first() cho EQ card front/back, modal check-in buttons), viết mới dp01a-habit-zip.test.ts + dp01b-eq-zip.test.ts; typecheck & lint sạch; playwright suite chạy với exit code 0. Bắt đầu mục 5 (Ảnh so sánh).
- 10:05: Hoàn thành mục 5: scripts/dp01-capture.mjs chụp 390 và 1440, ghép trái (zip)/phải (repo) vào ../dp01-compare/, lưu ảnh Habit vào docs/screenshots/dp01/, lập báo cáo docs/tasks/reviews/DP-01d-visual.md, bổ sung hướng dẫn chạy migration & patch cho anh Nhân vào docs/RUNBOOK.md. Bắt đầu bộ 4 lệnh kiểm tra cuối cùng.
