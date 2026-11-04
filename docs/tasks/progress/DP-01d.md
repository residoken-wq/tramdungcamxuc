# Tiến độ DP-01d – Sửa nốt DP-01

- Nhánh: `task/DP-01d-fixes`
- Bắt đầu: 2026-11-04T08:53:00+07:00

## Danh sách công việc

| Mục | Việc | Trạng thái | Xong lúc | Ghi chú |
| --- | --- | --- | --- | --- |
| 1 | B1 – Lưu kế hoạch Habit (lỗi chặn) | Đã xong | 09:16 | Thêm field description, examples, applyTemplate, order vào techniques; migration 20261104_100000; habitJourneyContent.loop thêm laws & cueBox; script dp01d-habit-content.ts nạp 11 kỹ thuật thật; Step5LoopDesign & draft-adapter dùng ID thật & ghi chú rỗng; server bỏ giới hạn 2/giai đoạn; unit dp01d-techniques.test.ts 4/4 xanh |
| 2 | B2 – Chữ Habit vào CMS | Đang làm | | Field habitJourneyContent, vi.ts dp01, withDp01Defaults(), mở rộng script nạp, HUONG_DAN_CMS.md, unit |
| 3 | B3 – E2E | Chưa | | Sửa selector e2e cũ, viết dp01a-habit-zip.test.ts + dp01b-eq-zip.test.ts, chạy e2e |
| 4 | B4–B6 – Lặt vặt | Chưa | | 2 nút tải ảnh vé (B4), bỏ nhãn Bước x/6 & thẻ EQ bold (B5), sửa setState mount ở HabitTrackerApp (B6) |
| 5 | Ảnh so sánh 390 / 1440 | Chưa | | scripts/dp01-capture.mjs, ghép ảnh, review visual |

## Nhật ký thực hiện
- 08:53: Bắt đầu mục 1 (B1).
- 09:16: Hoàn thành mục 1 (B1): techniques collection, migration, script nạp 11 kỹ thuật, adapter ID thật, server validation & unit tests 28/28 xanh. Bắt đầu mục 2 (B2).
