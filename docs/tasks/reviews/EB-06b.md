# Review EB-06b – Tabs, Accordion, Bộ đếm

**Kết luận: ĐẠT sau EB-06bc** (01/11, Planning QA trên `task/EB-06b-interactive-widgets` @ `d753c90`, gộp `main` mới nhất gồm HB-22; Planning sửa EB-06bc). Không migration. Planning mở PR từ nhánh Planning.

## Đã kiểm

Máy QA, Postgres 16 sạch.

- typecheck sạch; lint 0 lỗi / 44 cảnh báo (bằng `main`).
- unit **193 file xanh trên DB trống** sau EB-06bc.
- e2e builder (`puck*`) sau EB-06bc: **21 xanh**, 1 đỏ là `puck-conversion` (Turnstile bị chặn ở máy QA, CI chạy). `puck-interactive-widgets` chạy 5 lần liên tiếp xanh.
- Khớp prompt: slot trong `arrayFields` (`disallow: CHILD_BLOCK_TYPES`), WAI-ARIA Tabs (phím mũi tên, Home / End), Accordion một / nhiều mục, Bộ đếm SSR ra số cuối, định dạng `1.234`, `prefers-reduced-motion`, nhãn không trùng `FAQ`, rich text trong array được lọc (`rich-text-data.ts`), kiểu chữ qua `typographyClasses`.

## EB-06bc (Planning sửa)

| #   | Vấn đề                                                                                                                                                                                                                                                                                                                                           | Sửa                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Trang công khai có Tabs / Accordion / Bộ đếm bị hỏng.** Ba widget là client component nhưng nhận slot của Puck (một hàm) và cả object `puck` (chứa hàm `renderDropZone`). Server không truyền hàm sang client component được: nội dung trang không render (HTML chỉ còn payload, không có chữ trong tab). E2E của Laptop chỉ viết, không chạy. | `render` của khối đổi slot thành element (`renderItemSlots`) và chỉ truyền `isEditing`.                                             |
| D2  | **Không chuyển tab được trong trình dựng.** Lớp phủ kéo thả của Puck nuốt cú bấm vào nút tab (kể cả khi khối đang chọn), nên không kéo khối vào tab 2 trở đi được. Accordion tương tự với mục đang đóng.                                                                                                                                         | Trình dựng hiện mọi tab xếp chồng (nhãn "Tab n: …") và mọi mục accordion mở; trang công khai giữ dạng tab / accordion.              |
| D3  | **Khối trong tab / accordion mất kiểu và ảnh / liên kết.** `walkPuckItems` (resolve ảnh, slug trang) và `collectPageStyles` (CSS `_style`) không đi vào slot nằm trong item của `array`.                                                                                                                                                         | Cả hai đi vào item của `array`. E2E kiểm màu tiêu đề đặt trong tab 1 trên trang công khai.                                          |
| D4  | **Bộ đếm không chạy hiệu ứng.** `setHasAnimated(true)` làm effect chạy lại, cleanup huỷ `requestAnimationFrame` ngay khung đầu.                                                                                                                                                                                                                  | Dùng `useRef`.                                                                                                                      |
| D5  | Tab đang chọn vẫn xanh thẫm (class màu của tiêu đề đè màu nút); màu nhấn `accent-pink` cho chữ nhỏ không đạt tương phản AA.                                                                                                                                                                                                                      | Màu đặt trên nút: đang chọn `bright-magenta`, chưa chọn theo `_style` hoặc `deep-navy/70`.                                          |
| D6  | E2E: tên khối "Văn bản (Text Widget)" không tồn tại; tìm Bộ đếm bằng `data-eb-id` (khối không có `_style` thì không có lớp bọc); thả khối vào tab không ổn định. `puck-builder.spec` đỏ vì nhóm "Cơ bản" dài ra đẩy khối Hero xuống dưới màn hình.                                                                                               | Sửa tên, tìm theo nhãn, thả có dừng 400 ms và kiểm khối nằm trong slot tab 2 trước khi xuất bản; `scrollIntoViewIfNeeded` cho Hero. |

## Ghi cho buổi thử Hana / BACKLOG

- Kéo khối vào tab đã có nội dung cần giữ chuột trên khối cuối một chút (dnd-kit của Puck cần thời gian chọn vùng thả lồng). Đã ghi trong `HUONG_DAN_CMS.md` 5.26; theo dõi ở buổi thử EB-11.
- Nhóm "Cơ bản" có 12 khối, đẩy các nhóm khác xuống: cân nhắc thu gọn mặc định nhóm ít dùng (EB-11).
