# Kế hoạch Deploy Bộ Nâng cấp Habit v2 (HB v2 Deploy Runbook)

> **Dành cho:** Anh IT phụ trách deploy và Hana Lương.  
> **Phạm vi:** Triển khai toàn bộ nâng cấp Habit Hack v2 (hành trình 28 ngày, 6 bước thiết kế vòng lặp, Boarding Pass, Tracker ngày lịch, suy ngẫm trạm, sao lưu dữ liệu, đồng hành sau 28 ngày) lên VPS production.  
> **Tài liệu đối chiếu:** `docs/plan/GO_LIVE_STEPS.md`, `docs/plan/HB_FLOW_V2.md`, `docs/decisions/HB-15.md`.

---

## 1. Danh sách Migration & Thứ tự thực thi

Bộ nâng cấp HB v2 bao gồm 3 migration schema cơ sở dữ liệu Postgres (theo thứ tự timestamp tự động):

| STT | File Migration                                | Nguồn Task | Nội dung thay đổi trong Database                                                                                                                                                                                                                       |
| :-: | :-------------------------------------------- | :--------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  1  | `20261031_073042_hb24_flow_content.ts`        |   HB-24    | Bổ sung các nhóm trường cấu hình flow mới trong global `habitJourneyContent`: `diagnose` (8 câu khảo sát, thang điểm, kết quả), `onePercent` (3 điều chưa biết, câu chốt), `loop` (giải thích 4 giai đoạn, 4 quy tắc), `boardingPass` (caption gợi ý). |
|  2  | `20261031_102521_hb12_station_reflections.ts` |   HB-12    | Tạo bảng mới `habitStationReflections` (lưu bài suy ngẫm trạm của học viên với phân quyền `selfCustomerOnlyField`) và bổ sung mảng `reflectionQuestions` vào các trạm trong `habitJourneyContent`.                                                     |
|  3  | `20261101_040756_hb18_flow_content_extra.ts`  |   HB-18    | Bổ sung trường `stepQuotes` (câu trích dẫn 6 bước), trường liên kết trong `siteSettings` (`habitCoachBookingUrl`, `habitDonationEnabled`, `habitDonationUrl`), và khối đồng hành trong `tracker` (`afterJourneyTitle`, `afterJourneyText`).            |

> [!NOTE]
> Khi chạy qua lệnh `pnpm migrate`, hệ thống Payload sẽ tự động quét thư mục `src/migrations/`, so khớp với bảng `payload_migrations` trong cơ sở dữ liệu và áp dụng chính xác theo thứ tự thời gian.

---

## 2. Danh mục Nội dung Hana cần nhập trước khi mở cho khách

Trước khi công bố chính thức hành trình thói quen 28 ngày đến học viên, Hana cần đăng nhập vào trang quản trị (`/admin`) và hoàn tất các mục sau:

1. **Khóa Habit → Nội dung hành trình Habit (`habitJourneyContent`)**:
   - **Bước 1 (Khám đúng bệnh)**: Rà soát lại 8 câu hỏi khảo sát và 4 gợi ý theo từng giai đoạn nút thắt (Tín hiệu, Khao khát, Phản hồi, Phần thưởng).
   - **Bước 2 (Nguyên lý 1%)**: Rà soát 3 điều có thể bạn chưa biết (`onePercent.unknowns`) và câu đúc kết (`onePercent.closing`).
   - **Bước 5 (Vòng lặp thói quen)**: Nhập lời mở, giải thích 4 giai đoạn và 4 quy tắc thực hành (`loop`).
   - **Bước 6 (Boarding Pass)**: Nhập câu dặn dò trước giờ khởi hành (`boardingPass.intro`) và câu gợi ý caption chia sẻ mạng xã hội (`boardingPassCaption`).
   - **Các trạm hành trình (`stations`)**: Nhập câu hỏi suy ngẫm cuối mỗi trạm (từ Trạm 1 đến Trạm 4, mỗi trạm tối đa 5 câu).
   - **Đồng hành sau 28 ngày (`tracker`)**: Nhập tiêu đề và lời nhắn gửi khích lệ của Coach Hana (`afterJourneyTitle`, `afterJourneyText`).

2. **Cài đặt Website (`siteSettings`) → Tab Công cụ số**:
   - **Liên kết đặt lịch Coach (Habit)** (`habitCoachBookingUrl`): Dán link Cal.com hoặc Google Calendar đặt lịch 1:1 cá nhân của Hana.
   - **Mục ủng hộ (Habit Donation)**: Bật công tắc `habitDonationEnabled` (nếu sẵn sàng nhận ủng hộ) và dán link trang ủng hộ/VietQR vào `habitDonationUrl`.

3. **Quy tắc trích dẫn học thuật (Bắt buộc)**:
   - Mọi câu danh ngôn hoặc số liệu khoa học đưa vào `stepQuotes` và `facts` **bắt buộc** phải ghi rõ Tác giả và Nguồn tài liệu đã kiểm chứng.

---

## 3. Quy trình Deploy trên VPS Production

Thực hiện trên VPS production (`/opt/tdcx`):

### Bước 3.1: Chuẩn bị & Cập nhật mã nguồn

```bash
cd /opt/tdcx

# Kiểm tra trạng thái git
git status

# Kéo mã nguồn mới nhất từ nhánh main
git fetch origin
git pull --ff-only origin main

# Thiết lập biến tắt cho docker compose
export DC="docker compose -p tdcx -f docker-compose.prod.yml"
```

### Bước 3.2: Cập nhật Tag Image trong `.env` & Kéo Image mới

```bash
# Sửa APP_TAG trong .env sang bản release mới (ví dụ: v2.1.0 hoặc sha commit)
nano .env

# Kéo image ứng dụng và image tools mới nhất từ GitHub Container Registry
$DC pull < /dev/null
$DC --profile tools pull seed < /dev/null
```

### Bước 3.3: Chạy Database Migration

```bash
# Thực thi migration an toàn qua container seed độc lập
$DC --profile tools run --rm seed pnpm migrate < /dev/null
```

_Mong đợi: Terminal thông báo thành công cho 3 migration HB-24, HB-12, HB-18._

### Bước 3.4: Khởi động Ứng dụng & Kiểm tra Sức khỏe

```bash
# Khởi động dịch vụ nền
$DC up -d < /dev/null

# Đợi 30 giây để container sẵn sàng và kiểm tra trạng thái
sleep 30
$DC ps < /dev/null

# Xem log khởi động để đảm bảo không có ngoại lệ
$DC logs app --tail 100 < /dev/null
```

_Mong đợi: Container `app` và `postgres` đều ở trạng thái `healthy`._

---

## 4. Kiểm tra Sau Deploy (Post-Deployment Verification)

Thực hiện kiểm thử thực tế trên điện thoại (khung hình 375px) hoặc chế độ mô phỏng thiết bị di động:

1. **Trình hướng dẫn `/habit/5-phut`**:
   - Truy cập `/habit/5-phut`: thanh tiến trình hiện `Bước 1 / 6`.
   - Đi qua Bước 1 (Khám) → Bước 2 (1% Better) → Bước 3 (Tìm Mentor, chọn thói quen neo) → Bước 4 (Gọi tên, chọn ngày bắt đầu `startDate` trong tương lai) → Bước 5 (Vòng lặp, chọn kỹ thuật) → Bước 6 (Boarding Pass).
   - Tại Bước 6: Kiểm tra nút tải ảnh 4:5 và 9:16 tải đúng file ảnh `.png`.
   - Bấm nút chính **"Lên chuyến · Bắt đầu 28 ngày →"**: Gửi form thành công và thấy màn hình chúc mừng.
2. **Đăng nhập & Màn hình Tracker `/habit/tracker`**:
   - Đăng nhập tài khoản qua mã OTP email.
   - Vào `/habit/tracker`: Tiêu đề hiển thị đúng ngày **Khởi hành: dd/MM/yyyy** tương ứng với ngày đã chọn.
   - Mỗi ô ngày trên lưới trạm có hiển thị ngày lịch thực tế dạng `dd/MM`.
   - Thử check-in 1 ngày hợp lệ: Modal mở mượt mà với 4 trạng thái, chọn cảm xúc và lưu thành công.
   - Kéo xuống cuối trang: Khối "Dữ liệu của bạn" có đủ 5 nút (Tải bản sao lưu JSON, Tải CSV, Khôi phục, Gửi Coach, Bắt đầu mới).
   - Khối "Đồng hành sau 28 ngày": Hiển thị nút "Đặt lịch với Habit Coach" mở đúng link và nút "Ủng hộ Trạm Dừng Cảm Xúc".

---

## 5. Quy trình Quay lại Bản cũ (Rollback Plan)

Trong trường hợp phát sinh sự cố nghiêm trọng không thể khắc phục ngay:

```bash
cd /opt/tdcx
export DC="docker compose -p tdcx -f docker-compose.prod.yml"

# 1. Đổi APP_TAG trong .env về tag ổn định trước đó
nano .env

# 2. Nếu cần rollback migration schema (chỉ khi có lỗi cấu trúc bảng):
$DC --profile tools run --rm seed pnpm migrate:down < /dev/null

# 3. Khởi động lại container ứng dụng với bản tag cũ
$DC pull app < /dev/null
$DC up -d < /dev/null

# 4. Kiểm tra log hoạt động
$DC logs app --tail 50 < /dev/null
```
