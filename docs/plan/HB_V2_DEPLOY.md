# Kế hoạch Deploy Bộ Nâng cấp Habit v2 (HB v2 Deploy Runbook)

> **Dành cho:** Anh IT phụ trách deploy và Hana Lương.  
> **Phạm vi:** Triển khai toàn bộ nâng cấp Habit Hack v2 (hành trình 28 ngày, 6 bước thiết kế vòng lặp, Boarding Pass, Tracker ngày lịch, suy ngẫm trạm, sao lưu dữ liệu, đồng hành sau 28 ngày) lên VPS production.  
> **Tài liệu đối chiếu:** `docs/plan/GO_LIVE_STEPS.md`, `docs/plan/HB_FLOW_V2.md`, `docs/decisions/HB-15.md`.

---

## 1. Migration

> HB-15c (Planning): app **tự chạy migration khi khởi động** (`prodMigrations` trong `payload.config.ts`, xem `docs/RUNBOOK.md`). **Không chạy `pnpm migrate` bằng tay** trên VPS.

Migration chạy theo thứ tự tên file, mọi file **chưa có** trong bảng `payload_migrations` của bản thật đều được chạy. Riêng bộ HB v2 có các file sau (prod đang ở bản trước HB thì chạy đủ cả danh sách):

| File                                          | Task  | Nội dung                                                                    |
| :-------------------------------------------- | :---- | :-------------------------------------------------------------------------- |
| `20261021_012851_hb02_journey_28.ts`          | HB-02 | Hành trình 28 ngày, ngưỡng 90%                                              |
| `20261023_093308_hb03_plan_fields.ts`         | HB-03 | Trường mới của kế hoạch (nhịp tuần, ngày bắt đầu…)                          |
| `20261024_072228_hb04_checkin_status.ts`      | HB-04 | Trạng thái check-in (đủ / bản tối giản / lỡ nhịp / nghỉ)                    |
| `20261026_033511_hb07_journey_content.ts`     | HB-07 | Global `habitJourneyContent` (trạm, câu chữ hành trình)                     |
| `20261031_073042_hb24_flow_content.ts`        | HB-24 | Nội dung 6 bước: khám, 1%, vòng lặp, Boarding Pass                          |
| `20261031_080633_eb01_design_system.ts`       | EB-01 | (bộ EB, đã merge vào `main`, lên cùng lần deploy này)                       |
| `20261031_102521_hb12_station_reflections.ts` | HB-12 | Bảng `habitStationReflections`, câu hỏi suy ngẫm mỗi trạm                   |
| `20261101_040756_hb18_flow_content_extra.ts`  | HB-18 | `stepQuotes`, link Coach / ủng hộ trong `siteSettings`, khối sau hành trình |
| `20261102_034312_eb08_block_templates.ts`     | EB-08 | Collection `blockTemplates` (mẫu đã lưu của builder)                        |
| `20261102_080246_cf01_coffee_donation.ts`     | CF-01 | Ly cà phê ủng hộ (MoMo) trong `siteSettings` – tab Thanh toán               |
| `20261102_100526_pk13_title_spacing.ts`       | PK-13 | Giãn dòng / khoảng cách tiêu đề trong `designSystem`                        |

Xem bản thật đang ở migration nào (chỉ đọc tên migration, không đọc dữ liệu khách):

```bash
cd /opt/tdcx
export DC="docker compose -p tdcx -f docker-compose.prod.yml"
$DC exec -T postgres psql -U postgres -d tramdungcamxuc -c "select name from payload_migrations order by id desc limit 5" < /dev/null
```

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
   - **Ủng hộ:** tab **Thanh toán** → **Ly cà phê ủng hộ (MoMo)**: tải ảnh QR (chỉ phần mã, có mô tả ảnh), bật công tắc. Chỉ `owner` sửa được. (Mục Habit Donation cũ đã ẩn – CF-02.)

3. **Quy tắc trích dẫn học thuật (Bắt buộc)**:
   - Mọi câu danh ngôn hoặc số liệu khoa học đưa vào `stepQuotes` và `facts` **bắt buộc** phải ghi rõ Tác giả và Nguồn tài liệu đã kiểm chứng.

---

## 3. Quy trình Deploy trên VPS Production

Từ 02/11 dùng **`scripts/deploy.sh`**, không cần nhập `APP_TAG` (chi tiết: `docs/RUNBOOK.md` mục "Deploy một lệnh"). Anh tự chạy trên VPS.

### Bước 3.0 (chỉ lần đầu dùng script)

Mở `.env`, để **trống** `APP_TAG` (dòng `APP_TAG=`). Script luôn truyền `APP_TAG` qua lệnh nên giá trị trong `.env` không còn tác dụng, nhưng để trống cho đỡ nhầm. Lần đầu chạy, script chưa có bản đang chạy làm mốc rollback nếu image cũ chưa có nhãn commit – khi đó ghi lại `git rev-parse --short=7 HEAD` để rollback tay.

### Bước 3.1: Chờ CI xanh

GitHub → **Actions**: run CI của commit mới nhất trên `main` xanh **cả** job "Build and Push Docker image". (CI chỉ đẩy `latest` khi mọi bước qua.)

### Bước 3.2: Deploy

```bash
cd /opt/tdcx
./scripts/deploy.sh
```

Script làm theo thứ tự: backup (lỗi → dừng) → ghi commit đang chạy vào `.deploy/previous` → `git pull --ff-only` → kéo image `latest` → `up -d` → chờ `healthy` → in commit đang chạy + migration mới nhất. App tự chạy migration khi khởi động.

_Mong đợi: dòng `backup OK`, `app healthy`, "Migration mới nhất" = migration cuối ở mục 1 (02/11: `20261102_100526_pk13_title_spacing`)._

Xem lại bất cứ lúc nào: `./scripts/deploy.sh status`.

**Không chạy `pnpm seed`** trên bản thật (GO_LIVE_STEPS mục 9). Nội dung mục 2 Hana tự nhập trong `/admin`.

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
   - Khối "Đồng hành sau 28 ngày": Hiển thị nút "Đặt lịch với Habit Coach" mở đúng link (không còn nút Ủng hộ).
3. **Ly cà phê:** bật trong CMS → thấy nút ở góc phải dưới trên mọi trang (cả tracker); bấm mở QR, Esc đóng.

---

## 5. Quay lại bản cũ (Rollback)

1. **Lỗi giao diện / logic, dữ liệu không hỏng:** `./scripts/deploy.sh rollback` – quay về commit đã ghi ở `.deploy/previous`, chờ `healthy`. Các cột / bảng mới của migration vẫn nằm trong DB, bản cũ không dùng tới. **Không** chạy `migrate:down` (mỗi lần chỉ lùi 1 migration, có thể xoá bảng suy ngẫm của học viên). Lần `./scripts/deploy.sh` sau lại lên `latest`.
2. **Dữ liệu hỏng:** khôi phục bản backup ở bước 3.2 theo `docs/RUNBOOK.md` mục "Khôi phục backup / Rollback" (đọc kỹ cảnh báo xoá dữ liệu), rồi làm như ý 1.
