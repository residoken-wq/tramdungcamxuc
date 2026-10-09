# Prototype giao diện EQ Buddy + Habit Loop của Hana (nhận 09/10/2026)

Nguồn: `docs/sources/HANA EQ - HABIT.rar` (186 MB, **không commit**; đã xóa khỏi máy Local 09/10 – cần xem lại thì xin Hana gửi lại). Bên trong là app Next.js 15 + Tailwind 3 riêng, thư mục `DIGITAL PRODUCT/`, 42 file mã nguồn (`src/app`, `src/components/{eq-buddy,habit-tracker}`, `src/data`, `src/context`).

**Cách dùng:** làm **mẫu giao diện tham khảo** cho GĐ 2 (Habit) và GĐ 3 (EQ Buddy). **Không chép code** vào repo: khác phiên bản Next/Tailwind, dữ liệu lưu `localStorage`, nội dung và giá viết cứng trong code (trái AGENTS.md mục 2.3). Khi mở GĐ 2/3, task dựng lại từng màn bằng component brand + dữ liệu Payload, bám bố cục và câu chữ giao diện của prototype khi không trái spec.

## EQ Buddy (`src/components/eq-buddy/EQBuddyApp.tsx`, 850 dòng)

| Màn             | Prototype                                                                                                                                                                                                            | So với spec 8.3                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Giới thiệu      | 2 bước: "Giới thiệu bộ thẻ" → "Cách thức sử dụng"                                                                                                                                                                    | Spec không có – nên giữ (trải nghiệm tốt)                                                                         |
| Chọn trạng thái | "Hôm nay bạn đang cảm thấy thế nào?" – ô nhập tự do + 6 gợi ý (Bối rối và cần lời khuyên, Hơi mệt mỏi và kiệt sức, Cần một khoảng dừng tĩnh lặng, Biết ơn cuộc sống, Lo lắng về tương lai, Đang tìm kiếm sự can đảm) | Ô nhập **không ảnh hưởng** thẻ rút – luôn ngẫu nhiên. Spec: chọn theo tag cảm xúc / chủ đề / ngẫu nhiên → **Q18** |
| Rút thẻ         | Ngẫu nhiên, pháo giấy (`canvas-confetti`), thẻ lật                                                                                                                                                                   | Spec: lật nhẹ, tôn trọng `prefers-reduced-motion` – prototype chưa có                                             |
| Kết quả         | Mặt trước: từ khóa + câu thông điệp; mặt sau: 3 câu hỏi suy ngẫm                                                                                                                                                     | Spec: thông điệp → câu chuyện → câu hỏi + hành động nhỏ → lưu / chia sẻ / rút tiếp / offer                        |
| Tất cả thẻ      | Lưới chọn thẻ cụ thể                                                                                                                                                                                                 | Spec không có – cân nhắc giữ cho người có bộ thẻ vật lý                                                           |

- Dữ liệu: `data.ts` – **8 thẻ mẫu** (Trực giác, Khoảng dừng, Chấp nhận, Biết ơn, Trắc ẩn, Buông bỏ, Sáng tỏ, Dũng cảm), không phải 26. Trường: `keyword` (Anh), `vietnameseKeyword`, `frontText`, `backPrompts[3]`, `category`, `gradientTheme` → khác schema `eqCards` (**Q17**).
- Còn thiếu so với spec: trang thẻ QR `/eq-buddy/the/[qrSlug]`, lưu thẻ, ghi reflection (chỉ khi đăng nhập), ảnh chia sẻ 4:5 / 9:16, giới hạn dùng thử, nút Shopee, offer liên quan.

## Habit Loop 5 phút + tracker (`src/components/habit-tracker/HabitLoopBuilder/HabitLoopBuilder.tsx`, 1480 dòng)

| Bước                       | Prototype                                                                                                                            | So với spec 8.2                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Bảng điểm thói quen     | Danh sách việc buổi sáng, chấm Tốt / Bình thường / Xấu; bắt buộc ≥ 1 dòng                                                            | Khớp                                                                                                                                                         |
| 2. Cam kết danh tính       | Thói quen mong muốn + "Tôi là người…" (3 câu gợi ý)                                                                                  | Spec: "Tôi sẽ [hành động] để trở thành [con người]" (đúng file Excel)                                                                                        |
| 3. Vòng lặp hành vi        | 4 ô nhập tự do: Tín hiệu, Khao khát, Phản ứng, Phần thưởng                                                                           | Spec: chọn **1–2 kỹ thuật mỗi giai đoạn** từ `techniques` (11 kỹ thuật đã nhập 08/10) + ghi hành động cụ thể                                                 |
| 4. Boarding Pass + tracker | Thẻ tóm tắt (nút sao chép), lưới 21 ngày 7 × 3, bấm ngày → tick + chọn 1 trong 10 emoji; pháo giấy ngày 7/14/21; paywall sau 21 ngày | Spec: **không cho tick ngày tương lai** (prototype cho), câu "Lỡ nhịp 1 ngày là không sao cả", câu bỏ phiếu, tổng kết ngày 21, chứng nhận; cảm xúc → **Q14** |

- Paywall: "Chương Trình Chuyên Sâu • Trọn Đời", **199.000đ / 499.000đ**, hứa template Notion & Google Sheets, 20 video, nhóm Zalo → **Q15** (giá trong CMS là 250.000 / 178.000).
- Thư viện video (`src/data/toolkit-videos.ts`): 25 mục, **mọi `videoUrl` là cùng một link YouTube mẫu**. Spec cấm YouTube cho video trả phí → Bunny / Cloudflare Stream, link ký có hạn (Q9).
- Dữ liệu lưu `localStorage` (`tram_dung_21day_tracker_data`, `tram_dung_habit_loop_form_data`); spec: lưu nháp ở trình duyệt, để lại email để lưu kết quả → `habitPlans` / `habitCheckins`.
- Các component khác trong `habit-tracker/` (DailyTracker, HabitSetupModal, EmotionalQuizModal, HabitStats, ToolkitDrawer…) **không được trang chính dùng** – bản nháp cũ.

## Brand

- `brand-book-2026.md` trong prototype ghi `accent-pink` = `#EF3883`; repo này `#EF3B83` → **Q16**.
- Prototype dùng màu ngoài bảng `#E6DAF0` (viền) và `#3E138A` (gradient paywall); emoji làm biểu tượng. Khi dựng lại: chỉ 8 màu brand, icon SVG nét mảnh (trừ khi Hana chốt emoji ở Q14).
