# Deploy BX-01 → BX-07 lên tramdungcamxuc.com

Viết ngày 15/11/2026, cập nhật 19/11/2026 (thêm BX-07). Quy trình chung: `docs/RUNBOOK.md` mục "Deploy một lệnh", "Backup / Rollback" và **mục 6** (báo cáo ô CMS để trống – BX-05).

## Đợt này lên những gì

| PR | Nội dung | Migration |
| --- | --- | --- |
| #377 BX-01 | Khối "Câu hỏi + nút" (2 nút `/habit/chan-doan`, `/eq-buddy`), CTA theo nền | – |
| #380 BX-02 | Form liên hệ: bật / tắt từng ô, chế độ "Nhận brochure" | – |
| #381 BX-03 | Trang giới thiệu sản phẩm: ô "Ẩn phần này" cho từng phần | `20261115_180000_bx03_product_sections` |
| #383 BX-04 | Tiêu đề: kiểu nhấn chữ (tô màu / gạch chân / nền / gạch ngang) + hiệu ứng, chip chọn chữ | – |
| #387 | Mobile: 2 nút hero không còn bị bóp hẹp | – |
| #390 | CMS: ô giá hiện kiểu `1.750.000 đ` | – |
| #393 | Công cụ nhấn chữ cho 20 khối tiêu đề (gồm "Khối các gói Growth Mirror") | – |
| #396 BX-05 | **Ô CMS để trống thì ẨN** (không hiện chữ mẫu), checkbox "Dùng chữ mặc định cho ô để trống" theo từng phần | `20261115_210000_bx05_empty_means_hidden` |
| #398 BX-06 | Nút đặt lịch không dẫn tới 404; link cũ chuyển hướng / trang "tạm ngưng"; khung trạng thái đặt lịch trong form sản phẩm | – |
| #401 BX-07 | Bài học Habit Hack tạm dùng video YouTube ("Nguồn video" Bunny / YouTube tạm thời), link chỉ trả cho khách có quyền | `20261116_120000_bx07_youtube_lessons` |

- 3 migration đều **chỉ thêm cột**, vài ms. Không xoá / sửa dữ liệu cũ:
  - BX-03, BX-05: cột boolean `DEFAULT false`;
  - BX-07: cột "Nguồn video" `DEFAULT 'bunny'` + "Link YouTube" (bài học cũ vẫn là Bunny).
- **Không** có biến môi trường mới, `docker-compose.prod.yml` không đổi.
- Nếu BX-01 → BX-03 đã deploy trước đó thì lần này chỉ chạy migration BX-05 và BX-07.

> ⚠️ **BX-05 đổi cách hiển thị ngay khi deploy:** mọi ô chữ đang **trống** trên site thật (trước đây tự hiện chữ mẫu của hệ thống) sẽ **ẩn**. Phải chạy báo cáo ở bước 2 và gửi Hana **trước** khi deploy.

## 1. Kiểm trước khi deploy

1. GitHub → **Actions** → run CI mới nhất của `main` (commit sau khi merge #401 BX-07):
   - tất cả job xanh;
   - job **"Build and Push Docker image"** xanh (đã đẩy `latest` và `tools-latest`).
2. Ghi lại 7 ký tự đầu của commit đó (VD `abc1234`).
3. Chọn giờ ít khách (tối muộn). Báo Hana trước: site khựng khoảng 1–2 phút.

## 2. Báo trước các phần sẽ ẩn (BX-05, bắt buộc)

SSH vào server:

```bash
cd /opt/tdcx
```

```bash
docker compose -p tdcx -f docker-compose.prod.yml --profile tools pull seed < /dev/null
```

```bash
docker compose -p tdcx -f docker-compose.prod.yml --profile tools run --rm seed pnpm report:empty-copy
```

- Lệnh **chỉ đọc**, không ghi gì vào DB, không in dữ liệu khách (chỉ tên trang / phần / ô).
- Chạy được khi DB **chưa** có cột BX-05.
- Không dùng `docker compose exec app …`: container `app` là bản cũ, không có script.

In ra một bảng: **Nguồn / Trang – Nhóm / Phần – Các ô để trống – Trạng thái**. Các dòng *"Sẽ ẩn khi deploy (Tắt)"* sẽ biến mất khỏi trang ngay sau deploy.

→ Chụp / copy bảng gửi Hana. Hana chọn:

- **(a)** để ẩn;
- **(b)** sau deploy bật "Dùng chữ mặc định cho ô để trống" ở phần đó;
- **(c)** điền chữ thật.

Hana đồng ý thì sang bước 3.

## 3. Deploy

```bash
./scripts/deploy.sh status
```

Ghi lại commit đang chạy (để đối chiếu khi rollback).

```bash
./scripts/deploy.sh
```

Script tự làm theo thứ tự:

1. backup DB + media;
2. ghi mốc rollback;
3. `git pull`;
4. kéo image `latest`;
5. `up -d`, migration chạy lúc app khởi động;
6. chờ `healthy`.

Lỗi ở bước nào thì dừng ở đó. **Không** sửa `.env`. Nếu `git status` có file đã sửa thì script dừng: báo lại, không tự xoá.

```bash
./scripts/deploy.sh status
```

Mong đợi:

- commit đang chạy = commit ở bước 1;
- migration mới nhất = `20261116_120000_bx07_youtube_lessons`.

## 4. Kiểm sau deploy (10 phút, ai cũng làm được)

Mở bằng điện thoại **và** máy tính:

| Trang | Thấy |
| --- | --- |
| `/` trên điện thoại | 2 thẻ "Dành cho cá nhân / doanh nghiệp" rộng gần hết màn hình, mỗi nút nằm 1 dòng |
| `/` | Bấm nút đặt lịch: **không** ra 404 – vào trang đặt lịch, hoặc trang "Phiên trải nghiệm đang tạm ngưng nhận lịch" (nếu chưa có phiên nào Đang bán) |
| `/dat-phien-trai-nghiem?san-pham=7` | Không 404 (chuyển sang phiên đang bán, hoặc trang "tạm ngưng") |
| `/habit/1-percent-better` | Trang mở bình thường; phần nào trống / đã ẩn thì không còn khung rỗng |
| `/eq-buddy`, `/habit/5-phut` | Mở bình thường; đối chiếu với bảng ở bước 2 |
| `/admin` → Sản phẩm → 1 sản phẩm | Ô giá hiện `250.000 đ`, gõ số tự thêm dấu chấm; cột giá ở danh sách `250.000đ` |
| `/admin` → Sản phẩm → "Phiên trải nghiệm" | Đầu form có khung "Trang đặt lịch đang mở / ĐÓNG" |
| Builder → "Khối các gói Growth Mirror" | Dưới ô "Tiêu đề dòng 1" có dãy chip chữ; bấm 1 chữ thì hiện "Kiểu nhấn chữ" + "Hiệu ứng" |
| `/admin` → Bài học → 1 bài | Có ô "Nguồn video" (Bunny Stream / YouTube (tạm thời)); chọn YouTube thì hiện ô "Link YouTube (tạm thời)" |

Lỗi bất kỳ → bước 6.

## 5. Hana làm trong CMS sau deploy

1. **Phần muốn giữ chữ mẫu** (theo bảng bước 2): bật "Dùng chữ mặc định cho ô để trống" ở đúng phần đó, hoặc điền chữ thật → Lưu / Xuất bản.
   - **Sản phẩm** → tab "Trang giới thiệu": mỗi phần có 1 checkbox ở đầu nhóm.
   - **Nội dung EQ Buddy** / **Nội dung Habit**: mỗi tab / nhóm có 1 checkbox ở đầu.
   - **Builder**: chọn khối → ô "Dùng chữ mặc định cho ô để trống" (Tắt / Bật).
2. **Phiên trải nghiệm (sản phẩm 7):**
   - Trạng thái bán = **Đang bán**;
   - Giá = `149000`;
   - **Xuất bản**.

   Khung đầu form chuyển sang "Trang đặt lịch đang mở".
3. **Sản phẩm Habit Tracker số** → "Ẩn / hiện các phần": tick "Ẩn: khác biệt" và "Ẩn: Câu hỏi thường gặp" (rà soát mục 17), nếu chưa làm.
4. **Trang Chuyển mình** → form cuối trang: khối "Khung form liên hệ" chọn "Mục đích form = Nhận brochure" (BX-02), nếu chưa làm.
5. **Bài học Habit Hack (BX-07)** – nếu dùng YouTube tạm thời:
   - trên YouTube, mỗi video bài học để **Không công khai** (không để Công khai) và **giữ bật "Cho phép nhúng"**;
   - CMS → Bài học → từng bài → "Nguồn video" = **YouTube (tạm thời)** → dán link → **Xuất bản**;
   - mở thử 1 bài bằng tài khoản khách đã có quyền: video phát được; tài khoản chưa có quyền không thấy video.
6. **Tiêu đề muốn nhấn chữ** (VD "CHUYỂN MÌNH KHÔNG CHÊNH VÊNH"):
   - bấm chip "CHUYỂN" 1 lần, "CHÊNH" 2 lần;
   - chọn kiểu "Nền", hiệu ứng "Vẽ dần";
   - Xuất bản.

Chi tiết từng ô: `docs/HUONG_DAN_CMS.md` (mục "Ô để trống và chữ mặc định", "Nút đặt lịch phiên trải nghiệm", tô màu chữ BX-04, bài học YouTube tạm thời BX-07).

## 6. Rollback

Ba migration chỉ **thêm cột**, nên bản cũ vẫn chạy được trên DB mới. Rollback chỉ cần đổi bản app:

```bash
./scripts/deploy.sh rollback
```

```bash
./scripts/deploy.sh status
```

Mong đợi: commit đang chạy = commit ghi ở bước 3. Sau rollback:

- ô trống lại hiện chữ mẫu như trước (bản cũ không đọc cột BX-05);
- bài học đã chuyển sang YouTube **không còn video** (bản cũ chỉ đọc Bunny) cho đến khi deploy lại.

Chỉ khi dữ liệu bị hỏng mới phục hồi toàn bộ DB + media từ bản backup `deploy.sh` vừa tạo: `docs/RUNBOOK.md` → "Phục hồi toàn diện cả code, database và media". Lệnh này **xoá dữ liệu hiện tại** (lead / đơn mới sau giờ deploy sẽ mất), nên phải hỏi lại trước khi chạy.

## 7. (Tuỳ chọn) Email báo lead cho Hana

Không bắt buộc cho đợt này. Muốn Hana nhận email khi có lead:

1. Tạo tài khoản Resend, xác minh domain `tramdungcamxuc.com` (thêm bản ghi DNS Resend đưa).
2. Anh IT tự điền vào `/opt/tdcx/.env`:
   ```dotenv
   RESEND_API_KEY=<key>
   EMAIL_FROM=TRAM DUNG CAM XUC <no-reply@tramdungcamxuc.com>
   ```
   Không gửi key qua chat.
3. Chạy lại `./scripts/deploy.sh`.
4. Hana điền email nhận vào CMS → Cài đặt Website → **Email liên hệ** (Gmail được).
