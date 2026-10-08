# Nhập nội dung Habit Hack thật của Hana (08/10/2026)

Nguồn: `docs/sources/CÔNG CỤ XÂY THÓI QUEN _ Habit Hack - Trạm dừng cảm xúc.xlsx` (anh Nhân gửi 08/10).
Lệnh: `pnpm import:habit` (`seed/import-habit.ts`, dữ liệu ở `seed/import/habit-hack-data.ts`).

## Nhập gì

| Sheet                                                   | Collection                                             | Số bản ghi |
| ------------------------------------------------------- | ------------------------------------------------------ | ---------- |
| Khảo sát trì hoãn (cột A, B, C)                         | `diagnosticQuestions` (câu, giai đoạn, gợi ý)          | 16         |
| Video siêu ngắn… (cột A)                                | `courseModules`                                        | 7          |
| Video siêu ngắn… (cột B)                                | `lessons` (tiêu đề; chưa có video, tóm tắt)            | 20         |
| Video siêu ngắn… (11 dòng kỹ thuật) + VÍ DỤ MẪU (cột I) | `techniques` (tên, cách làm, ví dụ, bài học liên quan) | 11         |

Không nhập: sheet "5 phút để tạo thói quen", "Sheet3" (mẫu trống – là khung của wizard GĐ 2), dòng tracker, email cá nhân và giá "$85 => 149.000" ở B36.

## Quy tắc

- Chép nguyên văn, kể cả lỗi chính tả – Hana sửa trong CMS. Bỏ số thứ tự "1." đầu câu quiz (đã có field `order`).
- Bản ghi thật `isSample = false`, xuất bản ngay. Chạy lại không ghi đè bản ghi đã có (giữ chỉnh sửa của Hana).
- Xóa bản ghi `[MẪU]` của 4 collection này; `pnpm seed` không tạo lại mẫu cho chúng khi đã có bản ghi thật.
- `isFreePreview` để tắt cho cả 20 bài – Hana chọn bài xem thử.

## Câu hỏi cần chốt (Hana)

1. **Thang điểm quiz**: file dùng 1–5 ("Không bao giờ / Hiếm khi / Thỉnh thoảng / Thường xuyên / Rất thường xuyên"); spec AGENTS 8.2 và quiz đang chạy dùng 1–4.
2. **Cách chấm**: số câu mỗi giai đoạn không đều (Cue 6, Craving 3, Response 5, Reward 2). Chấm theo **tổng** (hiện tại) sẽ gần như luôn ra Cue; đề xuất chấm theo **điểm trung bình** mỗi giai đoạn (quy tắc hòa B8 giữ nguyên).
3. Lỗi chính tả trong file: "chắc chắc" (Insight 4), "ngôn ngữ ghi nhận của bản" (kỹ thuật Chọn phần thưởng theo gu), "Make It Satisfied" (Atomic Habits dùng "Satisfying"). Gợi ý quiz có tiền tố tiếng Anh "Invisible:", "Unsatisfying:", "Unattractive:", "Difficult:" – giữ hay dịch?
