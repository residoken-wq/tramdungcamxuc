# Checklist chuẩn bị demo Habit Hack + EQ Buddy (bản zip) cho Hana – 04/11/2026

Người làm: **anh Nhân** (server demo, không dùng `tramdungcamxuc.com`). Planning kiểm `main` @ `39623714`.

**Đã kiểm:**

- CI xanh;
- e2e Habit / EQ 28 / 28 xanh (DB trống, 375 + 1440);
- unit 2361 xanh;
- dựng lại trên DB trống + `pnpm seed`: tất cả trang trả 200, không tràn ngang ở 375, không lỗi JS.

## A. Bắt buộc trước buổi demo

| #   | Việc                                                                                                                                  | Vì sao                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| A1  | Deploy `main` mới nhất lên demo, chạy `pnpm migrate`                                                                                  | Có migration DP-01d, DP-02                                                                                  |
| A2  | Chạy nạp chữ Habit: `pnpm payload run scripts/dp01d-habit-content.ts < /dev/null` (chạy thử), rồi `APPLY=true …`                      | 11 kỹ thuật + 8 câu hỏi + chữ các bước theo bản zip                                                         |
| A3  | CMS → **Kỹ thuật**: chuyển sang **nháp** các kỹ thuật cũ mà script ở A2 liệt kê                                                       | Không thì bước 5 hiện **22 kỹ thuật**. DB có seed MẪU chắc chắn bị (11 bản `[MẪU] Kỹ thuật …`)              |
| A4  | Nhập 26 thẻ EQ thật: `docs/RUNBOOK.md` mục "Nhập 26 thẻ EQ thật" (`pnpm import:eq`, file JSON **ngoài repo**)                         | DB demo chỉ có 3 thẻ `[MẪU]`                                                                                |
| A5  | CMS → **Sản phẩm**: `habit-tracker-so` và `eq-buddy-so` đổi trạng thái bán sang **Đang bán** (`on_sale`), kiểm giá / 28 ngày dùng thử | Seed để "Sắp ra mắt": trang offer hiện "Nhận thông báo" thay vì nút dùng thử, không thử được luồng dùng thử |
| A6  | **Email gửi được** trên demo (OTP đăng nhập). Kiểm bằng cách tự đăng nhập 1 email thật của mình                                       | "Lên chuyến" → vào tracker cần mã OTP qua email. Không có email thì Hana kẹt ở bước đăng nhập               |
| A7  | Turnstile: khoá thật của Cloudflare cho tên miền demo                                                                                 | Form lên chuyến / đăng nhập cần Turnstile                                                                   |
| A8  | Logo: tải logo thật (PNG nền trong) lên CMS                                                                                           | Header đang hiện "LOGO – CHỜ FILE"                                                                          |
| A9  | CMS → **Nội dung EQ Buddy** → chế độ truy cập (`eqAccessMode`): chọn "Dùng thử" hoặc "Miễn phí hoàn toàn" theo ý Hana                 | Quyết định E3                                                                                               |

## B. Hana sẽ thấy, nên nói trước

- Trang chủ, các trang con, offer, quiz chẩn đoán hiện **chữ `[MẪU]`**. Đây là dữ liệu mẫu, chờ Hana nhập nội dung thật.
- Quiz chẩn đoán (`/habit/chan-doan`) hiện 16 câu `[MẪU] Tình huống trì hoãn …`.
- Các câu trích dẫn và tiêu đề đầu bước 2–6 của Habit **chưa sửa được trong CMS** (task DP-02d).
- Khối "Dữ liệu của bạn" ở tracker ghi dữ liệu lưu trên máy chủ (khác bản zip lưu trên trình duyệt). Đây là quyết định H1 = B.
- Bước 6 có thêm khối nhận kế hoạch qua email, không có trong zip (H1 = B).

## C. Chưa làm (không chặn demo)

- **DP-02d:** ~217 dòng chữ còn ghi cứng ở bước 1–5 / EQ giới thiệu; câu trích dẫn bước 2–6 lấy từ CMS `stepQuotes`.
- `/habit` (không có trang con) trả 404. Menu không trỏ tới đây. Nếu muốn, chuyển hướng sang `/habit/1-percent-better`.

## D. Kịch bản demo đề xuất (≈ 15 phút)

1. **EQ:**
   - `/eq-buddy`: 2 bước giới thiệu → Bắt đầu hành trình → nhập cảm xúc → Rút thẻ → lật 3D → Xem tất cả thẻ;
   - mở 1 link QR `/eq-buddy/the/<mã>` trên điện thoại.
2. **Habit:**
   - `/habit/5-phut`: 8 câu chẩn đoán → Nguyên lý 1% → Tìm Mentor → Gọi tên thói quen (chọn nhịp tuần) → Vòng lặp (chọn kỹ thuật) → Boarding Pass;
   - tải ảnh 9:16;
   - nhập email → Lên chuyến.
3. **Tracker:**
   - đăng nhập OTP → kích hoạt dùng thử → `/habit/tracker`: tiêu đề "28 ngày thành …", check-in ngày 1 (Đã làm + 1 mức tự tin);
   - tải CSV, khôi phục từ file (hộp xác nhận).
4. **CMS:** sửa 1 câu hỏi chẩn đoán hoặc lời dẫn bước 4 trong **Nội dung hành trình Habit**, tải lại trang thấy đổi.
